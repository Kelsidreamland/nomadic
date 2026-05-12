import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { generateSmartInsights } from '../services/ai';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bot, Plane, ChevronDown, ChevronRight, Scale, AlertTriangle, CheckCircle2, X, Clock, MapPin, Plus, Check, ClipboardList } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { buildPackingChecklistSummary, getItemQuantity, getPackingChecklistProgress, togglePackedItemId } from '../services/packingChecklist';
import { getUpcomingFlight } from '../services/flightMemory';
import { buildQuickInventoryInsights, mergeQuickInventoryInsights } from '../services/quickInventoryAdvice';
import { getCombinedAllowance } from '../services/flightAllowance';

const joinParts = (...parts: Array<string | undefined | null>) => parts.filter(Boolean).join(' · ');

const formatPlace = (place?: string, terminal?: string) => joinParts(place, terminal);

const formatRoute = (departure?: string, departureTerminal?: string, arrival?: string, arrivalTerminal?: string) => {
  const from = formatPlace(departure, departureTerminal);
  const to = formatPlace(arrival, arrivalTerminal);
  if (from && to) return `${from} → ${to}`;
  return from || to;
};

type SmartInsights = {
  optimization?: {
    weight_status?: 'Safe' | 'Warning' | 'Overweight' | string;
    luggage_analysis?: string;
    remove_suggestions?: Array<{ item_id: string; reason: string }>;
    packing_advice?: string[];
  };
};

const PACKING_CHECKLIST_KEY = 'nomadic_packing_checklist_checked_item_ids';
const LONG_PRESS_MOVE_CANCEL_PX = 10;

const loadPackedItemIds = () => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(PACKING_CHECKLIST_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
};

export const Overview = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setActiveLuggageId } = useStore();
  const luggages = useLiveQuery(() => db.luggages.toArray()) || [];
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const flights = useLiveQuery(() => db.flights.toArray()) || [];
  const isPackingMode = searchParams.get('packing') === '1';
  const didAutoExpandPacking = useRef(false);
  const longPressTimerRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const draggedItemIdRef = useRef<string | null>(null);
  const packingSummary = buildPackingChecklistSummary(luggages, items);
  const expandableLuggageKey = packingSummary.expandableLuggageIds.join('|');

  const [now] = useState(() => Date.now());
  const upcomingFlight = getUpcomingFlight(flights, now);
  const upcomingTripFlights = upcomingFlight
    ? flights.filter(flight => (
      flight.id === upcomingFlight.id ||
      (
        flight.departureDate === upcomingFlight.departureDate &&
        flight.destination === upcomingFlight.destination &&
        (flight.departureAirport || '') === (upcomingFlight.departureAirport || '') &&
        (flight.arrivalAirport || '') === (upcomingFlight.arrivalAirport || '')
      )
    ))
    : [];
  const daysToFlight = upcomingFlight
    ? Math.ceil((new Date(upcomingFlight.departureDate).getTime() - now) / (1000 * 60 * 60 * 24))
    : null;

  const [expandedLuggage, setExpandedLuggage] = useState<Set<string>>(new Set());
  const [weightInputs, setWeightInputs] = useState<{ [key: string]: number }>({});
  const [allowanceInputs, setAllowanceInputs] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<SmartInsights | null>(null);
  const [packedItemIds, setPackedItemIds] = useState<string[]>(loadPackedItemIds);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverLuggageId, setDragOverLuggageId] = useState<string | null>(null);
  const packingProgress = getPackingChecklistProgress(items, packedItemIds);

  useEffect(() => {
    if (!isPackingMode || didAutoExpandPacking.current || packingSummary.totalItems === 0) return;
    setExpandedLuggage(new Set(packingSummary.expandableLuggageIds));
    didAutoExpandPacking.current = true;
  }, [expandableLuggageKey, isPackingMode, packingSummary.expandableLuggageIds, packingSummary.totalItems]);

  useEffect(() => {
    window.localStorage.setItem(PACKING_CHECKLIST_KEY, JSON.stringify(packedItemIds));
  }, [packedItemIds]);

  const getLatestWeight = (luggageId: string) => {
    const l = luggages.find(lg => lg.id === luggageId);
    if (!l?.weightHistory?.length) return 0;
    return l.weightHistory[l.weightHistory.length - 1].weight;
  };

  const getUpcomingTripAllowance = (field: 'checkedAllowance' | 'carryOnAllowance' | 'personalAllowance') => {
    if (!upcomingFlight) return 0;
    return (upcomingTripFlights.length > 0 ? upcomingTripFlights : [upcomingFlight])
      .reduce((sum, flight) => sum + getCombinedAllowance(flight, field), 0);
  };
  const checkedAllowanceLimit = getUpcomingTripAllowance('checkedAllowance');
  const carryOnAllowanceLimit = getUpcomingTripAllowance('carryOnAllowance');
  const personalAllowanceLimit = getUpcomingTripAllowance('personalAllowance');

  const itemsByLuggage = (luggageId: string) => items.filter(i => i.luggageId === luggageId);
  const getItemQuantityTotal = (targetItems: typeof items) => targetItems.reduce((sum, item) => sum + getItemQuantity(item), 0);
  const unassignedItems = items.filter(i => !i.luggageId || !luggages.find(l => l.id === i.luggageId));
  const unassignedLuggageId = '__unassigned';

  const getDefaultAllowanceForLuggage = (type: string) => {
    if (type === '托运') return checkedAllowanceLimit;
    if (type === '手提') return carryOnAllowanceLimit || 7;
    if (type === '随身') return personalAllowanceLimit;
    return 0;
  };

  const getLuggageAllowanceLimit = (luggage: typeof luggages[number]) => {
    return luggage.allowanceOverrideKg ?? getDefaultAllowanceForLuggage(luggage.type);
  };

  const getLuggageAllowanceInputValue = (luggage: typeof luggages[number]) => {
    if (allowanceInputs[luggage.id] !== undefined) return allowanceInputs[luggage.id];
    const limit = getLuggageAllowanceLimit(luggage);
    return limit > 0 ? String(limit) : '';
  };

  const toggleLuggage = (id: string) => {
    setExpandedLuggage(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openItemsForLuggage = (luggageId: string) => {
    setActiveLuggageId(luggageId);
    navigate('/items');
  };

  const startPackingChecklist = () => {
    setExpandedLuggage(new Set(packingSummary.expandableLuggageIds));
    navigate('/overview?packing=1');
  };

  const togglePackedItem = (itemId: string) => {
    setPackedItemIds(prev => togglePackedItemId(prev, itemId));
  };

  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return;
    window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const clearDragState = () => {
    clearLongPressTimer();
    longPressStartRef.current = null;
    draggedItemIdRef.current = null;
    setDraggedItemId(null);
    setDragOverLuggageId(null);
  };

  const moveItemToLuggage = async (itemId: string, luggageId: string) => {
    const item = items.find(entry => entry.id === itemId);
    const nextLuggageId = luggageId === unassignedLuggageId ? '' : luggageId;
    if (!item || item.luggageId === nextLuggageId) {
      clearDragState();
      return;
    }

    await db.items.update(itemId, { luggageId: nextLuggageId });
    setExpandedLuggage(prev => {
      const next = new Set(prev);
      if (nextLuggageId) {
        next.add(nextLuggageId);
      } else {
        next.add(unassignedLuggageId);
      }
      if (item.luggageId) next.add(item.luggageId);
      return next;
    });
    clearDragState();
  };

  const startItemDrag = (itemId: string) => {
    clearLongPressTimer();
    draggedItemIdRef.current = itemId;
    setDraggedItemId(itemId);
  };

  const startItemLongPress = (itemId: string, event: React.PointerEvent<HTMLDivElement>) => {
    clearLongPressTimer();
    longPressStartRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      draggedItemIdRef.current = itemId;
      setDraggedItemId(itemId);
      longPressTimerRef.current = null;
    }, 420);
  };

  const findLuggageDropTarget = (x: number, y: number) => {
    return document
      .elementFromPoint(x, y)
      ?.closest<HTMLElement>('[data-luggage-drop-target="true"]');
  };

  const handleItemPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = longPressStartRef.current;
    const activeDraggedItemId = draggedItemIdRef.current || draggedItemId;
    if (!start && !activeDraggedItemId) return;

    const moved = Math.hypot(event.clientX - (start?.x || event.clientX), event.clientY - (start?.y || event.clientY));
    if (!activeDraggedItemId && moved > LONG_PRESS_MOVE_CANCEL_PX) {
      clearLongPressTimer();
      longPressStartRef.current = null;
      return;
    }

    if (!activeDraggedItemId) return;
    const luggageId = findLuggageDropTarget(event.clientX, event.clientY)?.dataset.luggageId;
    setDragOverLuggageId(luggageId || null);
  };

  const finishItemLongPress = (event: React.PointerEvent<HTMLDivElement>) => {
    clearLongPressTimer();
    const activeDraggedItemId = draggedItemIdRef.current || draggedItemId;
    if (!activeDraggedItemId) return;
    const target = findLuggageDropTarget(event.clientX, event.clientY);
    const luggageId = target?.dataset.luggageId || dragOverLuggageId;
    if (!luggageId) {
      clearDragState();
      return;
    }
    void moveItemToLuggage(activeDraggedItemId, luggageId);
  };

  const handleLuggageDrop = (luggageId: string, droppedItemId?: string) => {
    const itemId = droppedItemId || draggedItemId;
    if (!itemId) return;
    void moveItemToLuggage(itemId, luggageId);
  };

  const handleRecordWeight = async (luggageId: string) => {
    const inputWeight = weightInputs[luggageId];
    if (inputWeight === undefined || inputWeight <= 0) return;
    const luggage = await db.luggages.get(luggageId);
    if (!luggage) return;
    const newHistory = [...(luggage.weightHistory || []), { date: new Date().toISOString(), weight: inputWeight }];
    await db.luggages.update(luggageId, { weightHistory: newHistory });
    setWeightInputs(prev => ({ ...prev, [luggageId]: 0 }));
  };

  const handleLuggageAllowanceInputChange = (luggageId: string, value: string) => {
    setAllowanceInputs(prev => ({ ...prev, [luggageId]: value }));
  };

  const handleSaveLuggageAllowance = async (luggageId: string) => {
    const luggage = luggages.find(entry => entry.id === luggageId);
    const fallbackValue = luggage ? getLuggageAllowanceInputValue(luggage) : '';
    const rawValue = (allowanceInputs[luggageId] ?? fallbackValue).trim();
    const value = rawValue === '' ? 0 : Number(rawValue);
    if (!Number.isFinite(value) || value < 0) return;
    await db.luggages.update(luggageId, { allowanceOverrideKg: value });
    setAllowanceInputs(prev => ({ ...prev, [luggageId]: rawValue }));
  };

  const handleAiReduce = async () => {
    if (items.length === 0) return;
    setIsAnalyzing(true);
    setInsights(null);
    const quickInsights = buildQuickInventoryInsights({ upcomingFlight, items, language: i18n.language });
    try {
      const result = await generateSmartInsights({ upcomingFlight, items, location: 'Global', luggages });
      setInsights(mergeQuickInventoryInsights(result, quickInsights));
    } catch (e) {
      console.error('AI reduce failed', e);
      setInsights(quickInsights);
    }
    setIsAnalyzing(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case '托运': return t('luggages.typeChecked');
      case '手提': return t('luggages.typeCarryOn');
      case '随身': return t('luggages.typePersonal');
      case '特殊': return t('luggages.typeSpecial');
      default: return type;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case '衣物': return t('items.categoryClothes');
      case '器材': return t('items.categoryGear');
      case '保養品': return t('items.categorySkincare');
      default: return t('items.categoryOther');
    }
  };

  const outboundTime = upcomingFlight ? joinParts(
    upcomingFlight.departureDate,
    upcomingFlight.departureTime && upcomingFlight.arrivalTime
      ? `${upcomingFlight.departureTime} - ${upcomingFlight.arrivalTime}`
      : upcomingFlight.departureTime || upcomingFlight.arrivalTime
  ) : '';

  const outboundRoute = upcomingFlight ? formatRoute(
    upcomingFlight.departureAirport,
    upcomingFlight.departureTerminal,
    upcomingFlight.arrivalAirport,
    upcomingFlight.arrivalTerminal
  ) : '';

  const hasReturnInfo = !!(
    upcomingFlight?.returnDepartureDate ||
    upcomingFlight?.returnFlightNumber ||
    upcomingFlight?.returnDepartureAirport ||
    upcomingFlight?.returnArrivalAirport
  );

  const returnInfo = upcomingFlight ? joinParts(
    upcomingFlight.returnFlightNumber,
    upcomingFlight.returnDepartureDate,
    upcomingFlight.returnDepartureTime && upcomingFlight.returnArrivalTime
      ? `${upcomingFlight.returnDepartureTime} - ${upcomingFlight.returnArrivalTime}`
      : upcomingFlight.returnDepartureTime || upcomingFlight.returnArrivalTime,
    formatRoute(
      upcomingFlight.returnDepartureAirport,
      upcomingFlight.returnDepartureTerminal,
      upcomingFlight.returnArrivalAirport,
      upcomingFlight.returnArrivalTerminal
    )
  ) : '';

  const removeSuggestions = insights?.optimization?.remove_suggestions ?? [];
  const packingAdvice = insights?.optimization?.packing_advice ?? [];

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[var(--color-brand-espresso)]">{t('overview.title')}</h2>
          <p className="mt-1 text-sm font-medium text-[var(--color-brand-espresso)]/55">{t('overview.subtitle')}</p>
        </div>
        <Link to="/items" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--color-brand-terracotta)] hover:underline">
          <Plus size={15} />
          <span>{t('items.add')}</span>
        </Link>
      </div>

      {upcomingFlight ? (
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm">
          <div className="pointer-events-none absolute -right-12 -top-12 text-[var(--color-brand-espresso)]/5">
            <Plane size={120} />
          </div>
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] shadow-sm">
                <span className="text-[10px] font-bold text-[var(--color-brand-espresso)]/50">{t('dashboard.days')}</span>
                <span className="font-serif text-2xl font-bold text-[var(--color-brand-terracotta)]">{daysToFlight}</span>
              </div>
              <div className="min-w-0">
                <p className="mb-1 text-xs font-bold text-[var(--color-brand-olive)]">{joinParts(t('dashboard.outbound'), upcomingFlight.flightNumber || upcomingFlight.airline)}</p>
                <h3 className="break-words text-2xl font-black leading-tight text-[var(--color-brand-espresso)]">{upcomingFlight.destination}</h3>
                <div className="mt-2 flex flex-col gap-1.5 text-xs font-medium text-[var(--color-brand-espresso)]/60">
                  <span className="inline-flex min-w-0 items-center"><Clock size={13} className="mr-2 shrink-0 text-[var(--color-brand-terracotta)]" /><span className="truncate">{outboundTime}</span></span>
                  {outboundRoute && <span className="inline-flex min-w-0 items-center"><MapPin size={13} className="mr-2 shrink-0 text-[var(--color-brand-espresso)]/40" /><span className="truncate">{outboundRoute}</span></span>}
                  {hasReturnInfo && <span className="inline-flex min-w-0 items-center text-[var(--color-brand-espresso)]/50"><Plane size={13} className="mr-2 shrink-0 text-[var(--color-brand-olive)]" /><span className="truncate">{joinParts(t('dashboard.returnTrip'), returnInfo)}</span></span>}
                </div>
              </div>
            </div>
            <Link to="/" className="text-xs font-bold text-[var(--color-brand-espresso)]/45 transition-colors hover:text-[var(--color-brand-espresso)]">
              {t('dashboard.editFlight')}
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-6 text-center shadow-sm">
          <Plane size={32} className="mx-auto mb-3 text-[var(--color-brand-espresso)]/20" />
          <p className="font-bold text-[var(--color-brand-espresso)]/50">{t('dashboard.noUpcoming')}</p>
          <Link to="/" className="mt-2 inline-block text-sm font-bold text-[var(--color-brand-terracotta)] hover:underline">{t('dashboard.newFlight')}</Link>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[var(--color-brand-espresso)]/60">{t('overview.itemsByLuggage')}</h3>

        {luggages.map(luggage => {
          const luggageItems = itemsByLuggage(luggage.id);
          const isExpanded = expandedLuggage.has(luggage.id);
          const weight = getLatestWeight(luggage.id);
          const allowanceLimit = getLuggageAllowanceLimit(luggage);

          return (
            <div
              key={luggage.id}
              data-luggage-drop-target="true"
              data-luggage-id={luggage.id}
              aria-label={t('overview.moveItemToLuggage', { name: luggage.name })}
              onDragOver={event => {
                if (!draggedItemId) return;
                event.preventDefault();
                setDragOverLuggageId(luggage.id);
              }}
              onDragLeave={() => setDragOverLuggageId(prev => prev === luggage.id ? null : prev)}
              onDrop={event => {
                event.preventDefault();
                handleLuggageDrop(luggage.id, event.dataTransfer?.getData('text/plain'));
              }}
              className={clsx(
                'overflow-hidden rounded-[28px] border bg-[var(--color-brand-cream)] shadow-sm transition-all',
                dragOverLuggageId === luggage.id
                  ? 'border-[var(--color-brand-terracotta)] ring-2 ring-[var(--color-brand-terracotta)]/25'
                  : 'border-[var(--color-brand-stone)]'
              )}
            >
              <button
                onClick={() => toggleLuggage(luggage.id)}
                className="w-full p-5 transition-colors hover:bg-[var(--color-brand-sand)]/50"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-sand)]">
                      <Scale size={18} className="text-[var(--color-brand-espresso)]/40" />
                    </div>
                    <div className="min-w-0 text-left">
                      <h4 className="truncate font-bold text-[var(--color-brand-espresso)]">{luggage.name}</h4>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-brand-espresso)]/45">
                        <span>{getTypeLabel(luggage.type)}</span>
                        <span>{getItemQuantityTotal(luggageItems)} {t('overview.items')}</span>
                        {weight > 0 && <span>{t('overview.measuredWeight', { weight: weight.toFixed(1) })}</span>}
                        {allowanceLimit > 0 && <span>{t('overview.luggageAllowance', { limit: allowanceLimit })}</span>}
                      </div>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown size={20} className="shrink-0 text-[var(--color-brand-espresso)]/30" /> : <ChevronRight size={20} className="shrink-0 text-[var(--color-brand-espresso)]/30" />}
                </div>
              </button>

              {isExpanded && (
                <div className="space-y-3 border-t border-[var(--color-brand-stone)]/50 px-5 pb-5 pt-4">
                  {luggageItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)]/45 p-4 text-center">
                      <p className="text-sm text-[var(--color-brand-espresso)]/45">{t('overview.noItems')}</p>
                      <button
                        onClick={() => openItemsForLuggage(luggage.id)}
                        className="mt-3 inline-flex items-center gap-1 rounded-xl bg-[var(--color-brand-espresso)] px-4 py-2 text-sm font-bold text-white"
                      >
                        <Plus size={15} />
                        <span>{t('overview.addFirstItem')}</span>
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {luggageItems.map(item => (
                          <div
                            key={item.id}
                            draggable
                            aria-label={t('overview.dragItem', { name: item.name })}
                            title={t('overview.dragItemHint')}
                            onDragStart={event => {
                              if (event.dataTransfer) {
                                event.dataTransfer.effectAllowed = 'move';
                                event.dataTransfer.setData('text/plain', item.id);
                              }
                              startItemDrag(item.id);
                            }}
                            onDragEnd={clearDragState}
                            onPointerDown={event => {
                              event.currentTarget.setPointerCapture?.(event.pointerId);
                              startItemLongPress(item.id, event);
                            }}
                            onPointerMove={handleItemPointerMove}
                            onPointerCancel={clearDragState}
                            onPointerUp={event => {
                              if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
                                event.currentTarget.releasePointerCapture?.(event.pointerId);
                              }
                              finishItemLongPress(event);
                            }}
                            className={clsx(
                              'flex min-w-0 cursor-grab select-none items-center gap-2 rounded-xl bg-[var(--color-brand-sand)] p-2 transition-all active:cursor-grabbing',
                              draggedItemId === item.id ? 'touch-none' : 'touch-pan-y',
                              draggedItemId === item.id && 'scale-[0.98] opacity-65 ring-2 ring-[var(--color-brand-terracotta)]/30'
                            )}
                          >
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-9 w-9 shrink-0 rounded-lg border border-[var(--color-brand-stone)] bg-white object-contain" />
                            ) : (
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] text-[var(--color-brand-espresso)]/30">{getCategoryLabel(item.category)[0]}</div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-bold text-[var(--color-brand-espresso)]">
                                {item.name}
                                {getItemQuantity(item) > 1 && <span className="ml-1 text-[var(--color-brand-terracotta)]">× {getItemQuantity(item)}</span>}
                              </p>
                              <p className="text-[10px] text-[var(--color-brand-espresso)]/40">{getCategoryLabel(item.category)}</p>
                            </div>
                            <select
                              data-testid={`move-item-select-${item.id}`}
                              aria-label={t('overview.moveItemToLuggage', { name: item.name })}
                              value=""
                              onPointerDown={event => event.stopPropagation()}
                              onClick={event => event.stopPropagation()}
                              onChange={event => void moveItemToLuggage(item.id, event.target.value)}
                              className="min-h-7 w-20 shrink-0 rounded-full border border-[var(--color-brand-stone)] bg-white px-2 text-[10px] font-bold text-[var(--color-brand-espresso)]/55 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]"
                            >
                              <option value="" disabled>{t('overview.moveItem')}</option>
                              {luggages
                                .filter(target => target.id !== item.luggageId)
                                .map(target => (
                                  <option key={target.id} value={target.id}>
                                    {target.name}
                                  </option>
                                ))}
                              {item.luggageId && <option value={unassignedLuggageId}>{t('items.unassigned')}</option>}
                            </select>
                            {isPackingMode && (
                              <button
                                type="button"
                                onClick={() => togglePackedItem(item.id)}
                                aria-label={t('overview.markPacked', { name: item.name })}
                                className={clsx(
                                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors',
                                  packedItemIds.includes(item.id)
                                    ? 'border-[var(--color-brand-olive)] bg-[var(--color-brand-olive)] text-white'
                                    : 'border-[var(--color-brand-espresso)]/20 bg-white text-transparent hover:border-[var(--color-brand-olive)] hover:text-[var(--color-brand-olive)]/50'
                                )}
                              >
                                <Check size={15} strokeWidth={3} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => openItemsForLuggage(luggage.id)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-brand-stone)] px-3 py-2 text-xs font-bold text-[var(--color-brand-espresso)]/70 hover:bg-[var(--color-brand-sand)]"
                      >
                        <Plus size={14} />
                        <span>{t('overview.addItemToLuggage')}</span>
                      </button>
                    </>
                  )}

                  <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                    <input
                      type="number"
                      placeholder={t('luggages.recordPlaceholder')}
                      value={weightInputs[luggage.id] || ''}
                      onChange={e => setWeightInputs({ ...weightInputs, [luggage.id]: parseFloat(e.target.value) || 0 })}
                      className="flex-1 rounded-xl bg-[var(--color-brand-sand)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
                    />
                    <button
                      onClick={() => handleRecordWeight(luggage.id)}
                      disabled={!weightInputs[luggage.id] || weightInputs[luggage.id] <= 0}
                      className="rounded-xl bg-[var(--color-brand-espresso)] px-4 py-2 text-sm font-bold text-white disabled:opacity-30"
                    >
                      {t('luggages.recordBtn')}
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <label className="text-xs font-bold text-[var(--color-brand-espresso)]/45">{t('overview.editLuggageAllowance')}</label>
                    <input
                      type="number"
                      min={0}
                      value={getLuggageAllowanceInputValue(luggage)}
                      onChange={event => handleLuggageAllowanceInputChange(luggage.id, event.target.value)}
                      data-testid={`luggage-allowance-input-${luggage.id}`}
                      className="w-full rounded-xl bg-[var(--color-brand-sand)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] sm:w-32"
                    />
                    <button
                      type="button"
                      data-testid={`luggage-allowance-save-${luggage.id}`}
                      onClick={() => void handleSaveLuggageAllowance(luggage.id)}
                      className="rounded-xl border border-[var(--color-brand-stone)] bg-white px-3 py-2 text-xs font-bold text-[var(--color-brand-espresso)]/65 transition-colors hover:bg-[var(--color-brand-sand)]"
                    >
                      {t('overview.saveLuggageAllowance')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {unassignedItems.length > 0 && (
          <div className="rounded-[28px] border border-dashed border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm">
            <button onClick={() => toggleLuggage(unassignedLuggageId)} className="flex w-full items-center justify-between gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-sand)]">
                  <Scale size={18} className="text-[var(--color-brand-espresso)]/30" />
                </div>
                <div>
                  <h4 className="font-bold text-[var(--color-brand-espresso)]/50">{t('items.unassigned')}</h4>
                  <p className="text-xs text-[var(--color-brand-espresso)]/30">{getItemQuantityTotal(unassignedItems)} {t('overview.items')}</p>
                </div>
              </div>
              {expandedLuggage.has(unassignedLuggageId) ? <ChevronDown size={20} className="shrink-0 text-[var(--color-brand-espresso)]/30" /> : <ChevronRight size={20} className="shrink-0 text-[var(--color-brand-espresso)]/30" />}
            </button>

            {expandedLuggage.has(unassignedLuggageId) && (
              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                {unassignedItems.map(item => (
                  <div
                    key={item.id}
                    draggable
                    aria-label={t('overview.dragItem', { name: item.name })}
                    title={t('overview.dragItemHint')}
                    onDragStart={event => {
                      if (event.dataTransfer) {
                        event.dataTransfer.effectAllowed = 'move';
                        event.dataTransfer.setData('text/plain', item.id);
                      }
                      startItemDrag(item.id);
                    }}
                    onDragEnd={clearDragState}
                    onPointerDown={event => {
                      event.currentTarget.setPointerCapture?.(event.pointerId);
                      startItemLongPress(item.id, event);
                    }}
                    onPointerMove={handleItemPointerMove}
                    onPointerCancel={clearDragState}
                    onPointerUp={event => {
                      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
                        event.currentTarget.releasePointerCapture?.(event.pointerId);
                      }
                      finishItemLongPress(event);
                    }}
                    className={clsx(
                      'flex min-w-0 cursor-grab select-none items-center gap-2 rounded-xl bg-[var(--color-brand-sand)] p-2 transition-all active:cursor-grabbing',
                      draggedItemId === item.id ? 'touch-none' : 'touch-pan-y',
                      draggedItemId === item.id && 'scale-[0.98] opacity-65 ring-2 ring-[var(--color-brand-terracotta)]/30'
                    )}
                  >
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="h-9 w-9 shrink-0 rounded-lg border border-[var(--color-brand-stone)] bg-white object-contain" />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[10px] text-[var(--color-brand-espresso)]/30">{getCategoryLabel(item.category)[0]}</div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[var(--color-brand-espresso)]">
                        {item.name}
                        {getItemQuantity(item) > 1 && <span className="ml-1 text-[var(--color-brand-terracotta)]">× {getItemQuantity(item)}</span>}
                      </p>
                      <p className="text-[10px] text-[var(--color-brand-espresso)]/40">{getCategoryLabel(item.category)}</p>
                    </div>
                    <select
                      data-testid={`move-item-select-${item.id}`}
                      aria-label={t('overview.moveItemToLuggage', { name: item.name })}
                      value=""
                      onPointerDown={event => event.stopPropagation()}
                      onClick={event => event.stopPropagation()}
                      onChange={event => void moveItemToLuggage(item.id, event.target.value)}
                      className="min-h-7 w-20 shrink-0 rounded-full border border-[var(--color-brand-stone)] bg-white px-2 text-[10px] font-bold text-[var(--color-brand-espresso)]/55 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]"
                    >
                      <option value="" disabled>{t('overview.moveItem')}</option>
                      {luggages.map(target => (
                        <option key={target.id} value={target.id}>
                          {target.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-[var(--color-brand-espresso)]/65">{t('overview.preDepartureTools')}</h3>
          <p className="mt-1 text-xs font-medium text-[var(--color-brand-espresso)]/45">{t('overview.preDepartureToolsSubtitle')}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleAiReduce}
            disabled={isAnalyzing || items.length === 0}
            className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--color-brand-espresso)] px-3 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-black disabled:opacity-30"
          >
            <Bot size={18} />
            <span>{isAnalyzing ? t('overview.aiAnalyzing') : t('overview.aiReduce')}</span>
          </button>

          {isPackingMode ? (
            <div className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] px-3 py-3 text-sm font-bold text-[var(--color-brand-espresso)]/65 shadow-sm">
              <ClipboardList size={18} />
              <span>{t('overview.packingProgress', { checked: packingProgress.checkedItems, total: packingProgress.totalCheckableItems })}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={startPackingChecklist}
              disabled={packingProgress.totalCheckableItems === 0}
              className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] px-3 py-3 text-sm font-bold text-[var(--color-brand-espresso)]/70 shadow-sm transition-colors hover:bg-white disabled:opacity-35"
            >
              <ClipboardList size={18} />
              <span>{t('overview.generatePackingChecklist')}</span>
            </button>
          )}
        </div>

        <Link
          to="/memory"
          className="flex items-center justify-center gap-2 rounded-2xl border border-transparent py-2 text-xs font-bold text-[var(--color-brand-espresso)]/45 transition-colors hover:border-[var(--color-brand-stone)] hover:bg-[var(--color-brand-sand)] hover:text-[var(--color-brand-terracotta)]"
        >
          <Plane size={14} />
          <span>{t('flightMemory.entry')}</span>
        </Link>
      </div>

      {isAnalyzing && (
        <div className="flex flex-col items-center space-y-4 rounded-[28px] border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-8 shadow-sm">
          <div className="flex space-x-2">
            <div className="h-3 w-3 animate-bounce rounded-full bg-[var(--color-brand-olive)]" style={{ animationDelay: '0ms' }} />
            <div className="h-3 w-3 animate-bounce rounded-full bg-[var(--color-brand-olive)]" style={{ animationDelay: '150ms' }} />
            <div className="h-3 w-3 animate-bounce rounded-full bg-[var(--color-brand-olive)]" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm font-bold text-[var(--color-brand-espresso)]/60">{t('dashboard.analyzingMsg')}</p>
        </div>
      )}

      {insights?.optimization && (
        <div className="space-y-4 animate-fade-in">
          <div className={clsx(
            'rounded-2xl border p-5',
            insights.optimization.weight_status === 'Safe' ? 'border-[var(--color-brand-olive)]/20 bg-[var(--color-brand-olive)]/10 text-[var(--color-brand-espresso)]' :
            insights.optimization.weight_status === 'Overweight' ? 'border-red-100 bg-red-50 text-red-800' :
            'border-[var(--color-brand-terracotta)]/20 bg-[var(--color-brand-terracotta)]/10 text-[var(--color-brand-espresso)]'
          )}>
            <div className="mb-1 flex items-center gap-2 font-bold">
              {insights.optimization.weight_status === 'Safe' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{t('dashboard.weightStatus')}{insights.optimization.weight_status}</span>
            </div>
            <p className="text-sm">{insights.optimization.luggage_analysis}</p>
          </div>

          {removeSuggestions.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5">
              <h4 className="mb-3 text-sm font-bold text-[var(--color-brand-terracotta)]">{t('dashboard.discardAdvice')}</h4>
              <ul className="space-y-2">
                {removeSuggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-brand-espresso)]/70">
                    <X size={14} className="mt-0.5 shrink-0 text-[var(--color-brand-terracotta)]" />
                    <span><strong>{items.find(inv => inv.id === s.item_id)?.name || s.item_id}</strong> - {s.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {packingAdvice.length > 0 && (
            <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5">
              <h4 className="mb-3 text-sm font-bold text-[var(--color-brand-olive)]">{t('dashboard.packingAdvice')}</h4>
              <ul className="space-y-2">
                {packingAdvice.map((advice, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-brand-espresso)]/70">
                    <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--color-brand-olive)]" />
                    <span>{advice}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
