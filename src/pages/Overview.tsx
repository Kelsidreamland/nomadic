import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { generateSmartInsights } from '../services/ai';
import { Link } from 'react-router-dom';
import { Bot, Plane, ChevronDown, ChevronRight, Scale, Sparkles, AlertTriangle, CheckCircle2, X, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export const Overview = () => {
  const { t } = useTranslation();
  const luggages = useLiveQuery(() => db.luggages.toArray()) || [];
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const flights = useLiveQuery(() => db.flights.toArray()) || [];

  const upcomingFlight = flights.sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())[0];
  const now = Date.now();
  const daysToFlight = upcomingFlight
    ? Math.ceil((new Date(upcomingFlight.departureDate).getTime() - now) / (1000 * 60 * 60 * 24))
    : null;

  const [expandedLuggage, setExpandedLuggage] = useState<Set<string>>(new Set());
  const [weightInputs, setWeightInputs] = useState<{ [key: string]: number }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const getLatestWeight = (luggageId: string) => {
    const l = luggages.find(lg => lg.id === luggageId);
    if (!l?.weightHistory?.length) return 0;
    return l.weightHistory[l.weightHistory.length - 1].weight;
  };

  const checkedWeight = luggages.filter(l => l.type === '托运').reduce((sum, l) => sum + getLatestWeight(l.id), 0);
  const carryOnWeight = luggages.filter(l => l.type === '手提').reduce((sum, l) => sum + getLatestWeight(l.id), 0);

  const itemsByLuggage = (luggageId: string) => items.filter(i => i.luggageId === luggageId);
  const unassignedItems = items.filter(i => !i.luggageId || !luggages.find(l => l.id === i.luggageId));

  const toggleLuggage = (id: string) => {
    setExpandedLuggage(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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

  const handleAiReduce = async () => {
    if (items.length === 0) return;
    setIsAnalyzing(true);
    setInsights(null);
    try {
      const result = await generateSmartInsights({ upcomingFlight, items, location: 'Global', luggages });
      setInsights(result);
    } catch (e: any) {
      console.error('AI reduce failed', e);
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

  const WeightBar = ({ current, limit, label }: { current: number; limit: number; label: string }) => {
    const pct = limit > 0 ? Math.min(100, (current / limit) * 100) : 0;
    const isOver = current > limit;
    const remaining = limit - current;

    return (
      <div className="space-y-1.5">
        <div className="flex justify-between items-end">
          <span className="text-xs font-bold text-[var(--color-brand-espresso)]/50 uppercase tracking-wider">{label}</span>
          <span className="text-xs font-bold text-[var(--color-brand-espresso)]/70">
            {current.toFixed(1)} / {limit} kg
            {limit > 0 && (
              <span className={clsx('ml-1', isOver ? 'text-red-500' : remaining < limit * 0.2 ? 'text-orange-500' : 'text-[var(--color-brand-olive)]')}>
                ({isOver ? `+${(current - limit).toFixed(1)}` : `-${remaining.toFixed(1)}`})
              </span>
            )}
          </span>
        </div>
        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className={clsx('h-full transition-all duration-500 rounded-full', isOver ? 'bg-red-500' : remaining < limit * 0.2 ? 'bg-orange-400' : 'bg-[var(--color-brand-olive)]')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold text-[var(--color-brand-espresso)] tracking-wider">{t('overview.title')}</h2>
        <Link to="/items" className="text-sm font-bold text-[var(--color-brand-terracotta)] hover:underline">{t('items.add')} +</Link>
      </div>

      {/* Trip Info Card */}
      {upcomingFlight ? (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute -right-12 -top-12 text-[var(--color-brand-espresso)]/5">
            <Plane size={120} />
          </div>
          <div className="flex items-center gap-4 z-10">
            <div className="w-16 h-16 bg-[var(--color-brand-sand)] text-[var(--color-brand-espresso)] rounded-2xl flex flex-col items-center justify-center font-bold border border-[var(--color-brand-stone)] shadow-sm">
              <span className="text-[10px] text-[var(--color-brand-espresso)]/50">{t('dashboard.days')}</span>
              <span className="text-2xl font-serif text-[var(--color-brand-terracotta)]">{daysToFlight}</span>
            </div>
            <div>
              <h3 className="text-2xl font-black text-[var(--color-brand-espresso)]">{upcomingFlight.destination}</h3>
              <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-brand-espresso)]/50 mt-1">
                <span>{upcomingFlight.airline}</span>
                <span>·</span>
                <span>{upcomingFlight.departureDate}</span>
              </div>
            </div>
          </div>
          <Link to="/" className="z-10 text-xs font-bold text-[var(--color-brand-espresso)]/40 hover:text-[var(--color-brand-espresso)] transition-colors">
            {t('dashboard.editFlight')}
          </Link>
        </div>
      ) : (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] text-center">
          <Plane size={32} className="mx-auto mb-3 text-[var(--color-brand-espresso)]/20" />
          <p className="font-bold text-[var(--color-brand-espresso)]/50">{t('dashboard.noUpcoming')}</p>
          <Link to="/" className="text-sm font-bold text-[var(--color-brand-terracotta)] hover:underline mt-2 inline-block">{t('dashboard.newFlight')}</Link>
        </div>
      )}

      {/* Weight vs Allowance */}
      {upcomingFlight && luggages.length > 0 && (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] space-y-4">
          <h3 className="font-bold text-sm text-[var(--color-brand-espresso)]/60 uppercase tracking-wider">{t('overview.weightVsLimit')}</h3>
          <WeightBar current={checkedWeight} limit={upcomingFlight.checkedAllowance || 0} label={t('dashboard.checked')} />
          <WeightBar current={carryOnWeight} limit={upcomingFlight.carryOnAllowance || 7} label={t('dashboard.carryOn')} />
        </div>
      )}

      {/* Items by Luggage */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm text-[var(--color-brand-espresso)]/60 uppercase tracking-wider">{t('overview.itemsByLuggage')}</h3>

        {luggages.map(luggage => {
          const luggageItems = itemsByLuggage(luggage.id);
          const isExpanded = expandedLuggage.has(luggage.id);
          const weight = getLatestWeight(luggage.id);

          return (
            <div key={luggage.id} className="bg-[var(--color-brand-cream)] rounded-3xl shadow-sm border border-[var(--color-brand-stone)] overflow-hidden">
              <button
                onClick={() => toggleLuggage(luggage.id)}
                className="w-full p-5 flex items-center justify-between hover:bg-[var(--color-brand-sand)]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-brand-sand)] rounded-xl flex items-center justify-center">
                    <Scale size={18} className="text-[var(--color-brand-espresso)]/40" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-bold text-[var(--color-brand-espresso)]">{luggage.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-[var(--color-brand-espresso)]/40">
                      <span>{getTypeLabel(luggage.type)}</span>
                      <span>·</span>
                      <span>{luggageItems.length} {t('overview.items')}</span>
                      {weight > 0 && <><span>·</span><span>{weight.toFixed(1)} kg</span></>}
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronDown size={20} className="text-[var(--color-brand-espresso)]/30" /> : <ChevronRight size={20} className="text-[var(--color-brand-espresso)]/30" />}
              </button>

              {isExpanded && (
                <div className="px-5 pb-5 space-y-3 border-t border-[var(--color-brand-stone)]/50 pt-4">
                  {luggageItems.length === 0 ? (
                    <p className="text-sm text-[var(--color-brand-espresso)]/30 text-center py-4">{t('overview.noItems')}</p>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {luggageItems.map(item => (
                        <div key={item.id} className="flex items-center gap-2 bg-[var(--color-brand-sand)] rounded-xl p-2">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-8 h-8 object-cover rounded-lg" />
                          ) : (
                            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-[10px] text-[var(--color-brand-espresso)]/30">{getCategoryLabel(item.category)[0]}</div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[var(--color-brand-espresso)] truncate">{item.name}</p>
                            <p className="text-[10px] text-[var(--color-brand-espresso)]/40">{getCategoryLabel(item.category)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Weight recording */}
                  <div className="flex gap-2 pt-2">
                    <input
                      type="number"
                      placeholder={t('luggages.recordPlaceholder')}
                      value={weightInputs[luggage.id] || ''}
                      onChange={e => setWeightInputs({ ...weightInputs, [luggage.id]: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-sm"
                    />
                    <button
                      onClick={() => handleRecordWeight(luggage.id)}
                      disabled={!weightInputs[luggage.id] || weightInputs[luggage.id] <= 0}
                      className="px-4 py-2 bg-[var(--color-brand-espresso)] disabled:opacity-30 text-white rounded-xl text-sm font-bold"
                    >
                      {t('luggages.recordBtn')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Unassigned items */}
        {unassignedItems.length > 0 && (
          <div className="bg-[var(--color-brand-cream)] rounded-3xl shadow-sm border border-dashed border-[var(--color-brand-stone)] p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[var(--color-brand-sand)] rounded-xl flex items-center justify-center">
                <Scale size={18} className="text-[var(--color-brand-espresso)]/30" />
              </div>
              <div>
                <h4 className="font-bold text-[var(--color-brand-espresso)]/50">{t('items.unassigned')}</h4>
                <p className="text-xs text-[var(--color-brand-espresso)]/30">{unassignedItems.length} {t('overview.items')}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Reduce Button */}
      <div className="space-y-4">
        <button
          onClick={handleAiReduce}
          disabled={isAnalyzing || items.length === 0}
          className="w-full py-4 bg-[var(--color-brand-espresso)] disabled:opacity-30 text-white rounded-2xl font-bold tracking-widest shadow-lg hover:bg-black transition-colors flex items-center justify-center gap-2"
        >
          <Bot size={20} />
          <span>{isAnalyzing ? t('overview.aiAnalyzing') : t('overview.aiReduce')}</span>
        </button>

        <Link
          to="/outfits"
          className="w-full py-3 border-2 border-[var(--color-brand-stone)] text-[var(--color-brand-espresso)]/60 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:border-[var(--color-brand-terracotta)] hover:text-[var(--color-brand-terracotta)] transition-colors"
        >
          <Sparkles size={16} />
          <span>{t('overview.viewOutfits')}</span>
        </Link>
      </div>

      {/* AI Results */}
      {isAnalyzing && (
        <div className="bg-[var(--color-brand-cream)] p-8 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] flex flex-col items-center space-y-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-[var(--color-brand-olive)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-[var(--color-brand-olive)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-[var(--color-brand-olive)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="font-bold text-[var(--color-brand-espresso)]/60 text-sm">{t('dashboard.analyzingMsg')}</p>
        </div>
      )}

      {insights?.optimization && (
        <div className="space-y-4 animate-fade-in">
          <div className={clsx(
            'p-5 rounded-2xl border',
            insights.optimization.weight_status === 'Safe' ? 'bg-green-50 border-green-100 text-green-800' :
            insights.optimization.weight_status === 'Overweight' ? 'bg-red-50 border-red-100 text-red-800' :
            'bg-orange-50 border-orange-100 text-orange-800'
          )}>
            <div className="flex items-center gap-2 font-bold mb-1">
              {insights.optimization.weight_status === 'Safe' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              <span>{t('dashboard.weightStatus')}{insights.optimization.weight_status}</span>
            </div>
            <p className="text-sm">{insights.optimization.luggage_analysis}</p>
          </div>

          {insights.optimization.remove_suggestions?.length > 0 && (
            <div className="bg-[var(--color-brand-cream)] p-5 rounded-2xl border border-[var(--color-brand-stone)]">
              <h4 className="font-bold text-red-500 text-sm mb-3">{t('dashboard.discardAdvice')}</h4>
              <ul className="space-y-2">
                {insights.optimization.remove_suggestions.map((s: any, i: number) => (
                  <li key={i} className="text-sm text-[var(--color-brand-espresso)]/70 flex items-start gap-2">
                    <X size={14} className="mt-0.5 text-red-400 shrink-0" />
                    <span><strong>{items.find(inv => inv.id === s.item_id)?.name || s.item_id}</strong> — {s.reason}</span>
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
