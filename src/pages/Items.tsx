import { useEffect, useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Trash2, PackageSearch, Camera, Image as ImageIcon, Edit2, X, ChevronDown, Crop, RotateCcw, Scissors, Eraser, ClipboardList, Plus, Minus } from 'lucide-react';
import { analyzeItemWithAI } from '../services/ai';
import { DEFAULT_STICKER_ADJUSTMENT, clampStickerAdjustment, getDefaultStickerCutoutPath, normalizeStickerCutoutPath, type StickerAdjustment, type StickerPoint } from '../services/imageSticker';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';
import { useSearchParams } from 'react-router-dom';
import { clampQuickInventoryQuantity, createQuickInventoryItemDraft, getQuickInventoryTemplate, quickInventoryTemplates } from '../services/quickInventory';
import { getItemQuantity } from '../services/packingChecklist';

const defaultNewItem: Partial<Item> = {
  name: '', category: '衣物', subCategory: '上衣', season: '通用', condition: '新', isDiscardable: false, luggageId: '', notes: '', image: ''
};

const MIN_CUTOUT_POINTS = 3;

const traceCutoutPath = (ctx: CanvasRenderingContext2D, points: StickerPoint[], size: number) => {
  points.forEach((point, index) => {
    const x = point.x * size;
    const y = point.y * size;
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
};

const getCutoutSvgPath = (points: StickerPoint[]) => {
  if (points.length < MIN_CUTOUT_POINTS) return '';
  return `${points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x * 100} ${point.y * 100}`).join(' ')} Z`;
};

export const Items = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const luggages = useLiveQuery(() => db.luggages.toArray()) || [];
  const { activeLuggageId, setActiveLuggageId } = useStore();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [imageEditSource, setImageEditSource] = useState<string | null>(null);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [isEditingImage, setIsEditingImage] = useState(false);
  const [stickerAdjustment, setStickerAdjustment] = useState<StickerAdjustment>(DEFAULT_STICKER_ADJUSTMENT);
  const [cutoutPath, setCutoutPath] = useState<StickerPoint[]>([]);
  const [isDrawingCutout, setIsDrawingCutout] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualItem, setManualItem] = useState<Partial<Item>>({ ...defaultNewItem });
  const [inventoryMode, setInventoryMode] = useState<'quick' | 'detail'>(() => searchParams.get('mode') === 'quick' ? 'quick' : 'detail');
  const [quickQuantities, setQuickQuantities] = useState<Record<string, number>>(() => {
    return Object.fromEntries(quickInventoryTemplates.map(template => [template.id, template.defaultQuantity]));
  });
  const [now] = useState(() => Date.now());
  const expiringCutoff = now + 30 * 24 * 60 * 60 * 1000;
  const activeLuggage = luggages.find((luggage) => luggage.id === activeLuggageId) || null;
  const visibleItems = activeLuggage ? items.filter((item) => item.luggageId === activeLuggage.id) : items;
  const totalVisibleItemQuantity = visibleItems.reduce((sum, item) => sum + getItemQuantity(item), 0);

  useEffect(() => {
    if (activeLuggageId && luggages.length > 0 && !activeLuggage) {
      setActiveLuggageId(null);
    }
  }, [activeLuggage, activeLuggageId, luggages.length, setActiveLuggageId]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'quick' || mode === 'detail') {
      setInventoryMode(mode);
    }
  }, [searchParams]);

  const getLuggageTypeLabel = (type: string) => {
    switch (type) {
      case '托运': return t('luggages.typeChecked');
      case '手提': return t('luggages.typeCarryOn');
      case '随身': return t('luggages.typePersonal');
      case '特殊': return t('luggages.typeSpecial');
      default: return type;
    }
  };

  const createStickerPreview = async (
    base64: string,
    adjustment: Partial<StickerAdjustment> = DEFAULT_STICKER_ADJUSTMENT,
    cutoutPoints: StickerPoint[] = []
  ): Promise<string> => {
    const stickerOptions = clampStickerAdjustment(adjustment);
    const normalizedCutout = normalizeStickerCutoutPath(cutoutPoints);
    const hasCutout = normalizedCutout.length >= MIN_CUTOUT_POINTS;
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image load failed'));
      image.src = base64;
    });
    const canvasSize = 360;
    const imageBoxSize = 292;
    const scale = Math.min(imageBoxSize / image.width, imageBoxSize / image.height) * stickerOptions.zoom;
    const imageWidth = Math.max(1, Math.round(image.width * scale));
    const imageHeight = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return base64;
    if (hasCutout) {
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 18;
      ctx.shadowOffsetY = 8;
      ctx.beginPath();
      traceCutoutPath(ctx, normalizedCutout, canvasSize);
      ctx.fill();
      ctx.restore();
    }
    const drawX = (canvas.width - imageWidth) / 2 + stickerOptions.offsetX;
    const drawY = (canvas.height - imageHeight) / 2 + stickerOptions.offsetY;
    if (hasCutout) {
      ctx.save();
      ctx.beginPath();
      traceCutoutPath(ctx, normalizedCutout, canvasSize);
      ctx.clip();
      ctx.drawImage(image, drawX, drawY, imageWidth, imageHeight);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 18;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();
      traceCutoutPath(ctx, normalizedCutout, canvasSize);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0,0,0,0.12)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, 32);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.drawImage(image, drawX, drawY, imageWidth, imageHeight);
    }
    return canvas.toDataURL('image/png');
  };

  const createAiImagePayload = async (base64: string): Promise<string> => {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image load failed'));
      image.src = base64;
    });

    const maxSize = 1280;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const imageWidth = Math.max(1, Math.round(image.width * scale));
    const imageHeight = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = imageWidth;
    canvas.height = imageHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return base64;
    ctx.drawImage(image, 0, 0, imageWidth, imageHeight);
    return canvas.toDataURL('image/jpeg', 0.82);
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAnalysisError(null);
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = ev.target?.result as string;
        const sticker = await createStickerPreview(base64);
        const aiImage = await createAiImagePayload(base64);
        setImageEditSource(base64);
        setStickerAdjustment(DEFAULT_STICKER_ADJUSTMENT);
        setCutoutPath([]);
        setShowImageEditor(false);
        setEditingImage(sticker);
        setEditingItem({ ...defaultNewItem, image: sticker, luggageId: activeLuggage?.id || '' });
        try {
          const result = await analyzeItemWithAI('', aiImage);
          setEditingItem(prev => ({
            ...prev,
            name: result.name || prev?.name,
            category: result.category || prev?.category,
            subCategory: result.subCategory || prev?.subCategory,
            season: result.season || prev?.season,
            color: result.color,
            occasion: result.occasion,
            wrinkleProne: result.wrinkleProne,
            tempRange: result.tempRange,
            notes: result.notes,
            image: sticker,
            luggageId: activeLuggage?.id || prev?.luggageId || '',
          }));
          if (result.color || result.occasion || result.wrinkleProne || result.tempRange) {
            setShowAdvanced(true);
          }
        } catch (err) {
          console.error('AI analysis failed', err);
          setAnalysisError(t('items.aiFailed'));
          setEditingItem(prev => ({
            ...prev,
            name: prev?.name || t('items.untitledItem'),
            image: sticker,
            luggageId: activeLuggage?.id || prev?.luggageId || '',
          }));
        }
      } catch (err) {
        console.error('Image processing failed', err);
        setAnalysisError(t('items.imageReadFailed'));
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.onerror = () => {
      setAnalysisError(t('items.imageReadFailed'));
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setAnalysisError(null);
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const base64 = ev.target?.result as string;
        const sticker = await createStickerPreview(base64);
        const aiImage = await createAiImagePayload(base64);
        setManualItem(prev => ({ ...prev, image: sticker }));
        try {
          const result = await analyzeItemWithAI(manualItem.name || '', aiImage);
          setManualItem(prev => ({
            ...prev,
            name: result.name || prev.name,
            category: result.category || prev.category,
            subCategory: result.subCategory || prev.subCategory,
            season: result.season || prev.season,
            color: result.color,
            occasion: result.occasion,
            wrinkleProne: result.wrinkleProne,
            tempRange: result.tempRange,
            notes: result.notes,
            image: sticker,
          }));
        } catch (err) {
          console.error('AI analysis failed', err);
          setAnalysisError(t('items.aiFailed'));
          setManualItem(prev => ({
            ...prev,
            name: prev.name || t('items.untitledItem'),
            image: sticker,
          }));
        }
      } catch (err) {
        console.error('Image processing failed', err);
        setAnalysisError(t('items.imageReadFailed'));
      } finally {
        setIsAnalyzing(false);
      }
    };
    reader.onerror = () => {
      setAnalysisError(t('items.imageReadFailed'));
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveConfirmed = async () => {
    if (!editingItem?.name) return;
    if ((editingItem as Item).id) {
      await db.items.update((editingItem as Item).id, { ...editingItem });
    } else {
      await db.items.add({
        ...editingItem,
        id: uuidv4(),
        createdAt: Date.now(),
        inventoryMode: 'detail',
        outfitEligible: editingItem.category === '衣物',
      } as Item);
    }
    setEditingItem(null);
    setEditingImage(null);
    setImageEditSource(null);
    setCutoutPath([]);
    setAnalysisError(null);
    setShowAdvanced(false);
    setShowImageEditor(false);
  };

  const handleSaveManual = async () => {
    if (!manualItem.name) return;
    await db.items.add({
      ...manualItem,
      id: uuidv4(),
      createdAt: Date.now(),
      luggageId: manualItem.luggageId || activeLuggage?.id || '',
      inventoryMode: 'detail',
      outfitEligible: manualItem.category === '衣物',
    } as Item);
    setManualItem({ ...defaultNewItem, luggageId: activeLuggage?.id || '' });
    setAnalysisError(null);
    setShowManualForm(false);
  };

  const selectInventoryMode = (mode: 'quick' | 'detail') => {
    setInventoryMode(mode);
    setSearchParams(mode === 'quick' ? { mode: 'quick' } : { mode: 'detail' });
  };

  const updateQuickQuantity = (templateId: string, delta: number) => {
    setQuickQuantities(prev => ({
      ...prev,
      [templateId]: clampQuickInventoryQuantity((prev[templateId] || getQuickInventoryTemplate(templateId).defaultQuantity) + delta),
    }));
  };

  const handleQuickAdd = async (templateId: string) => {
    const template = getQuickInventoryTemplate(templateId);
    const luggageId = activeLuggage?.id || '';
    const quantity = quickQuantities[templateId] || template.defaultQuantity;
    const existing = await db.items
      .filter(item => item.inventoryMode === 'quick' && item.name === template.name && (item.luggageId || '') === luggageId)
      .first();

    if (existing) {
      await db.items.update(existing.id, {
        quantity: clampQuickInventoryQuantity((existing.quantity || 1) + quantity),
      });
      return;
    }

    await db.items.add({
      ...createQuickInventoryItemDraft(template, quantity, luggageId),
      id: uuidv4(),
      createdAt: Date.now(),
    } as Item);
  };

  const handleDelete = async (id: string) => {
    await db.items.delete(id);
    const matches = await db.outfit_matches.filter(m => m.topItemId === id || m.bottomItemId === id).toArray();
    await Promise.all(matches.map(m => db.outfit_matches.delete(m.id)));
  };

  const handleEdit = (item: Item) => {
    setEditingItem({ ...item });
    setEditingImage(item.image || null);
    setImageEditSource(item.image || null);
    setStickerAdjustment(DEFAULT_STICKER_ADJUSTMENT);
    setCutoutPath([]);
    setAnalysisError(null);
    setShowAdvanced(!!(item.color || item.occasion || item.wrinkleProne || item.tempRange));
    setShowImageEditor(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditingImage(null);
    setImageEditSource(null);
    setCutoutPath([]);
    setAnalysisError(null);
    setShowAdvanced(false);
    setShowImageEditor(false);
  };

  const updateStickerAdjustment = (patch: Partial<StickerAdjustment>) => {
    setStickerAdjustment(prev => clampStickerAdjustment({ ...prev, ...patch }));
  };

  const getCutoutPointFromEvent = (event: React.PointerEvent<HTMLDivElement>): StickerPoint => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - bounds.left) / bounds.width,
      y: (event.clientY - bounds.top) / bounds.height,
    };
  };

  const handleCutoutPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDrawingCutout(true);
    setCutoutPath(normalizeStickerCutoutPath([getCutoutPointFromEvent(event)]));
  };

  const handleCutoutPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingCutout) return;
    event.preventDefault();
    const nextPoint = normalizeStickerCutoutPath([getCutoutPointFromEvent(event)])[0];
    if (!nextPoint) return;
    setCutoutPath(prev => {
      const lastPoint = prev[prev.length - 1];
      if (lastPoint && Math.hypot(nextPoint.x - lastPoint.x, nextPoint.y - lastPoint.y) < 0.01) {
        return prev;
      }
      return [...prev, nextPoint];
    });
  };

  const finishCutoutDrawing = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawingCutout) return;
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setIsDrawingCutout(false);
    setCutoutPath(prev => normalizeStickerCutoutPath(prev));
  };

  const applyStickerEdit = async () => {
    if (!imageEditSource) return;
    setIsEditingImage(true);
    try {
      const sticker = await createStickerPreview(imageEditSource, stickerAdjustment, cutoutPath);
      setEditingImage(sticker);
      setEditingItem(prev => ({ ...prev, image: sticker }));
      setShowImageEditor(false);
    } catch (err) {
      console.error('Image edit failed', err);
      setAnalysisError(t('items.imageReadFailed'));
    } finally {
      setIsEditingImage(false);
    }
  };

  const itemCountByLuggage = (luggageId: string) => {
    return items.filter(i => i.luggageId === luggageId).reduce((sum, item) => sum + getItemQuantity(item), 0);
  };

  const subCategoryOptions = [
    { value: '上衣', label: t('items.subTop') },
    { value: '下裝', label: t('items.subBottom') },
    { value: '外套', label: t('items.subOuterwear') },
    { value: '內搭', label: t('items.subInnerwear') },
    { value: '連身裙', label: t('items.subDress') },
    { value: '鞋子', label: t('items.subShoes') },
    { value: '配飾', label: t('items.subAccessory') },
    { value: '襪子', label: t('items.subSocks') },
    { value: '內衣', label: t('items.subBra') },
    { value: '內褲', label: t('items.subUnderpants') },
  ];

  const categoryOptions = [
    { value: '衣物', label: t('items.categoryClothes') },
    { value: '器材', label: t('items.categoryGear') },
    { value: '保養品', label: t('items.categorySkincare') },
    { value: '其他', label: t('items.categoryOther') },
  ];

  const seasonOptions = [
    { value: '通用', label: t('items.seasonGeneral') },
    { value: '冬季', label: t('items.seasonWinter') },
    { value: '夏季', label: t('items.seasonSummer') },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold text-[var(--color-brand-espresso)]">{t('items.title')}</h2>
      </div>

      {/* Luggage selector */}
      {luggages.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-[var(--color-brand-espresso)]/40 shrink-0">{t('luggages.title')}:</span>
          <button
            onClick={() => setActiveLuggageId(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
              !activeLuggageId
                ? 'bg-[var(--color-brand-espresso)] text-white'
                : 'bg-white border border-[var(--color-brand-stone)] text-[var(--color-brand-espresso)]/60 hover:border-[var(--color-brand-terracotta)]'
            }`}
          >
            {t('items.allLuggages')} ({items.reduce((sum, item) => sum + getItemQuantity(item), 0)})
          </button>
          {luggages.map(l => (
            <button
              key={l.id}
              onClick={() => setActiveLuggageId(l.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                activeLuggageId === l.id
                  ? 'bg-[var(--color-brand-espresso)] text-white'
                  : 'bg-white border border-[var(--color-brand-stone)] text-[var(--color-brand-espresso)]/60 hover:border-[var(--color-brand-terracotta)]'
              }`}
            >
              {l.name} ({itemCountByLuggage(l.id)})
            </button>
          ))}
        </div>
      )}

      {activeLuggage && (
        <div className="rounded-3xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] px-5 py-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{activeLuggage.name}</p>
              <p className="mt-1 text-sm text-[var(--color-brand-espresso)]/60">{t('items.assigningTo', { name: activeLuggage.name })}</p>
              <p className="mt-1 text-xs text-[var(--color-brand-espresso)]/40">{t('items.showingFor')}</p>
            </div>
            <button
              onClick={() => setActiveLuggageId(null)}
              className="shrink-0 rounded-full border border-[var(--color-brand-stone)] px-3 py-1.5 text-xs font-bold text-[var(--color-brand-espresso)]/70 hover:bg-[var(--color-brand-sand)] transition-colors"
            >
              {t('items.viewAll')}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-3xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-4 shadow-sm">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-[var(--color-brand-sand)] p-1">
          <button
            type="button"
            onClick={() => selectInventoryMode('quick')}
            className={`rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
              inventoryMode === 'quick'
                ? 'bg-[var(--color-brand-espresso)] text-white shadow-sm'
                : 'text-[var(--color-brand-espresso)]/55 hover:bg-white/60'
            }`}
          >
            {t('items.quickInventory')}
          </button>
          <button
            type="button"
            onClick={() => selectInventoryMode('detail')}
            className={`rounded-xl px-3 py-2 text-sm font-bold transition-colors ${
              inventoryMode === 'detail'
                ? 'bg-[var(--color-brand-espresso)] text-white shadow-sm'
                : 'text-[var(--color-brand-espresso)]/55 hover:bg-white/60'
            }`}
          >
            {t('items.detailInventory')}
          </button>
        </div>
      </div>

      {inventoryMode === 'quick' && (
        <div className="rounded-3xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] p-5 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-brand-sand)] text-[var(--color-brand-terracotta)]">
              <ClipboardList size={21} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--color-brand-espresso)]">{t('items.quickInventoryTitle')}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-brand-espresso)]/55">{t('items.quickInventoryDesc')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {quickInventoryTemplates.map(template => {
              const quantity = quickQuantities[template.id] || template.defaultQuantity;
              return (
                <div key={template.id} className="flex items-center gap-3 rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)]/55 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[var(--color-brand-espresso)]">{template.name}</p>
                    <p className="mt-0.5 text-[11px] text-[var(--color-brand-espresso)]/40">{template.category}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-white px-1.5 py-1 shadow-sm">
                    <button
                      type="button"
                      onClick={() => updateQuickQuantity(template.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-brand-espresso)]/45 hover:bg-[var(--color-brand-sand)]"
                      aria-label={t('items.decreaseQuantity', { name: template.name })}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-7 text-center text-sm font-black text-[var(--color-brand-espresso)]">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuickQuantity(template.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--color-brand-espresso)]/60 hover:bg-[var(--color-brand-sand)]"
                      aria-label={t('items.increaseQuantity', { name: template.name })}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickAdd(template.id)}
                    className="shrink-0 rounded-xl bg-[var(--color-brand-espresso)] px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-black"
                  >
                    {t('items.quickAdd')}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Camera capture area */}
      <div className={`${inventoryMode === 'detail' ? 'block' : 'hidden'} bg-[var(--color-brand-cream)] rounded-3xl shadow-sm border border-[var(--color-brand-stone)] p-8 text-center space-y-4`}>
        {activeLuggage && (
          <div className="mx-auto max-w-md rounded-2xl bg-[var(--color-brand-sand)] px-4 py-3 text-left border border-[var(--color-brand-stone)]/70">
            <p className="text-xs font-bold uppercase text-[var(--color-brand-espresso)]/40">{activeLuggage.name}</p>
            <p className="mt-1 text-sm font-medium text-[var(--color-brand-espresso)]/70">{t('items.assigningTo', { name: activeLuggage.name })}</p>
          </div>
        )}
        <label className="flex flex-col items-center justify-center w-full h-40 bg-white rounded-3xl border-2 border-dashed border-[var(--color-brand-stone)] cursor-pointer hover:border-[var(--color-brand-terracotta)] transition-colors">
          <Camera size={48} className="text-[var(--color-brand-espresso)]/25 mb-3" />
          <span className="font-bold text-[var(--color-brand-espresso)]/50 text-lg">{t('items.takePhoto')}</span>
          <span className="text-xs text-[var(--color-brand-espresso)]/30 mt-1">AI {t('items.aiAutoFill')}</span>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleImageCapture}
          />
        </label>
        <div className="flex items-center justify-center gap-4">
          <label className="text-sm font-medium text-[var(--color-brand-espresso)]/40 hover:text-[var(--color-brand-terracotta)] cursor-pointer transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageCapture}
            />
            {t('items.uploadImage')}
          </label>
          <span className="text-[var(--color-brand-espresso)]/20">|</span>
          <button
            onClick={() => {
              setAnalysisError(null);
              setShowManualForm(true);
              setManualItem({ ...defaultNewItem, luggageId: activeLuggage?.id || '' });
            }}
            className="text-sm font-medium text-[var(--color-brand-espresso)]/40 hover:text-[var(--color-brand-terracotta)] transition-colors"
          >
            {t('items.add')}
          </button>
        </div>
      </div>

      {/* AI analyzing overlay */}
      {isAnalyzing && (
        <div className="bg-[var(--color-brand-cream)] p-8 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] flex flex-col items-center space-y-4">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-[var(--color-brand-olive)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-[var(--color-brand-olive)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-[var(--color-brand-olive)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="font-bold text-[var(--color-brand-espresso)]/60">{t('items.analyzing')}</p>
        </div>
      )}

      {analysisError && !isAnalyzing && (
        <div className="rounded-2xl border border-[var(--color-brand-terracotta)]/25 bg-[var(--color-brand-terracotta)]/10 px-4 py-3 text-sm font-medium text-[var(--color-brand-espresso)]/70">
          {analysisError}
        </div>
      )}

      {/* Confirmation card (after photo or edit) */}
      {editingItem && !isAnalyzing && (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-[var(--color-brand-espresso)]">
              {(editingItem as Item).id ? t('items.edit') : t('items.add')}
            </h3>
            <button onClick={cancelEditing} className="p-2 text-[var(--color-brand-espresso)]/40 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-4">
            {editingImage && (
              <div className="shrink-0 space-y-2">
                <img src={editingImage} alt="Preview" className="w-24 h-24 object-contain bg-white rounded-2xl border border-[var(--color-brand-stone)] shadow-sm" />
                {imageEditSource && (
                  <button
                    onClick={() => setShowImageEditor(!showImageEditor)}
                    className="flex w-24 items-center justify-center gap-1 rounded-xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] px-2 py-2 text-[11px] font-bold text-[var(--color-brand-espresso)]/65 hover:bg-white"
                  >
                    <Crop size={13} />
                    <span>{t('items.editImage')}</span>
                  </button>
                )}
              </div>
            )}
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder={t('items.namePlaceholder')}
                value={editingItem.name || ''}
                onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] font-bold"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={editingItem.category || '衣物'}
                  onChange={e => setEditingItem({ ...editingItem, category: e.target.value as any, subCategory: undefined })}
                  className="px-3 py-2 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-sm"
                >
                  {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {editingItem.category === '衣物' && (
                  <select
                    value={editingItem.subCategory || '上衣'}
                    onChange={e => setEditingItem({ ...editingItem, subCategory: e.target.value as any })}
                    className="px-3 py-2 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-sm"
                  >
                    {subCategoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={editingItem.season || '通用'}
                  onChange={e => setEditingItem({ ...editingItem, season: e.target.value as any })}
                  className="px-3 py-2 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-sm"
                >
                  {seasonOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                  value={editingItem.luggageId || activeLuggage?.id || ''}
                  onChange={e => setEditingItem({ ...editingItem, luggageId: e.target.value })}
                  className="px-3 py-2 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-sm"
                >
                  <option value="">{t('items.unassigned')}</option>
                  {luggages.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({getLuggageTypeLabel(l.type)})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {showImageEditor && imageEditSource && (
            <div className="rounded-2xl border border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)]/55 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{t('items.imageEditorTitle')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-brand-espresso)]/45">{t('items.cutoutHint')}</p>
                </div>
                <button
                  onClick={() => {
                    setStickerAdjustment(DEFAULT_STICKER_ADJUSTMENT);
                    setCutoutPath([]);
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-brand-stone)] bg-white px-3 py-2 text-xs font-bold text-[var(--color-brand-espresso)]/65"
                >
                  <RotateCcw size={13} />
                  <span>{t('items.resetImageEdit')}</span>
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-[260px_1fr]">
                <div
                  onPointerDown={handleCutoutPointerDown}
                  onPointerMove={handleCutoutPointerMove}
                  onPointerUp={finishCutoutDrawing}
                  onPointerCancel={finishCutoutDrawing}
                  className="relative mx-auto flex aspect-square w-full max-w-[260px] touch-none select-none items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-brand-stone)] bg-white shadow-inner"
                >
                  <img
                    src={imageEditSource}
                    alt="Preview"
                    draggable={false}
                    className="max-h-full max-w-full object-contain"
                    style={{
                      transform: `translate(${stickerAdjustment.offsetX / 2}px, ${stickerAdjustment.offsetY / 2}px) scale(${stickerAdjustment.zoom})`,
                      transformOrigin: 'center',
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(45deg,rgba(61,51,45,0.04)_25%,transparent_25%,transparent_75%,rgba(61,51,45,0.04)_75%),linear-gradient(45deg,rgba(61,51,45,0.04)_25%,transparent_25%,transparent_75%,rgba(61,51,45,0.04)_75%)] bg-[length:18px_18px] bg-[position:0_0,9px_9px]" />
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
                    {cutoutPath.length >= MIN_CUTOUT_POINTS && (
                      <path
                        d={getCutoutSvgPath(cutoutPath)}
                        fill="rgba(252,251,249,0.2)"
                        stroke="#FFFFFF"
                        strokeWidth="3"
                        strokeLinejoin="round"
                        vectorEffect="non-scaling-stroke"
                      />
                    )}
                    {cutoutPath.length > 0 && cutoutPath.length < MIN_CUTOUT_POINTS && (
                      <circle cx={cutoutPath[0].x * 100} cy={cutoutPath[0].y * 100} r="2" fill="#FFFFFF" />
                    )}
                  </svg>
                  <div className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-[var(--color-brand-espresso)]/70 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
                    {cutoutPath.length >= MIN_CUTOUT_POINTS
                      ? t('items.cutoutPointCount', { count: cutoutPath.length })
                      : t('items.cutoutDrawHint')}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setCutoutPath(getDefaultStickerCutoutPath())}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-[var(--color-brand-stone)] bg-white px-3 py-2 text-xs font-bold text-[var(--color-brand-espresso)]/70 hover:border-[var(--color-brand-terracotta)]"
                    >
                      <Scissors size={13} />
                      <span>{t('items.cutoutDefault')}</span>
                    </button>
                    <button
                      onClick={() => setCutoutPath([])}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-[var(--color-brand-stone)] bg-white px-3 py-2 text-xs font-bold text-[var(--color-brand-espresso)]/70 hover:border-[var(--color-brand-terracotta)]"
                    >
                      <Eraser size={13} />
                      <span>{t('items.cutoutClear')}</span>
                    </button>
                  </div>
                  <label className="block">
                    <div className="mb-1 flex items-center justify-between text-xs font-bold text-[var(--color-brand-espresso)]/55">
                      <span>{t('items.stickerZoom')}</span>
                      <span>{stickerAdjustment.zoom.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.65"
                      max="2"
                      step="0.05"
                      value={stickerAdjustment.zoom}
                      onChange={e => updateStickerAdjustment({ zoom: Number(e.target.value) })}
                      className="w-full accent-[var(--color-brand-espresso)]"
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-xs font-bold text-[var(--color-brand-espresso)]/55">{t('items.stickerHorizontal')}</div>
                    <input
                      type="range"
                      min="-48"
                      max="48"
                      step="2"
                      value={stickerAdjustment.offsetX}
                      onChange={e => updateStickerAdjustment({ offsetX: Number(e.target.value) })}
                      className="w-full accent-[var(--color-brand-espresso)]"
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-xs font-bold text-[var(--color-brand-espresso)]/55">{t('items.stickerVertical')}</div>
                    <input
                      type="range"
                      min="-48"
                      max="48"
                      step="2"
                      value={stickerAdjustment.offsetY}
                      onChange={e => updateStickerAdjustment({ offsetY: Number(e.target.value) })}
                      className="w-full accent-[var(--color-brand-espresso)]"
                    />
                  </label>
                </div>
              </div>

              <button
                onClick={applyStickerEdit}
                disabled={isEditingImage}
                className="mt-4 w-full rounded-xl bg-[var(--color-brand-espresso)] py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-black disabled:cursor-wait disabled:opacity-60"
              >
                {isEditingImage ? t('items.processingImage') : t('items.applyImageEdit')}
              </button>
            </div>
          )}

          <label className="flex items-start gap-3 rounded-2xl bg-[var(--color-brand-sand)]/70 px-3 py-3 text-left">
            <input
              type="checkbox"
              checked={editingItem.isDiscardable || false}
              onChange={e => setEditingItem({ ...editingItem, isDiscardable: e.target.checked })}
              className="mt-0.5 h-5 w-5 rounded text-[var(--color-brand-espresso)] focus:ring-[var(--color-brand-espresso)]"
            />
            <span>
              <span className="block text-sm font-medium text-[var(--color-brand-espresso)]/80">{t('items.discardable')}</span>
              <span className="mt-1 block text-xs leading-relaxed text-[var(--color-brand-espresso)]/45">{t('items.discardableHint')}</span>
            </span>
          </label>

          {/* Advanced toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full p-3 bg-[var(--color-brand-sand)] rounded-xl text-[var(--color-brand-espresso)]/60 font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            <span>{t('items.advancedTitle')}</span>
            <ChevronDown size={16} className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-fade-in">
              {editingItem.category === '衣物' && (
                <div className="grid grid-cols-2 gap-4 bg-[var(--color-brand-sand)]/50 p-4 rounded-2xl">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase mb-1">{t('items.colorLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('items.colorPlaceholder')}
                      value={editingItem.color || ''}
                      onChange={e => setEditingItem({ ...editingItem, color: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)] text-sm border border-[var(--color-brand-stone)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase mb-1">{t('items.tempLabel')}</label>
                    <input
                      type="text"
                      placeholder={t('items.tempPlaceholder')}
                      value={editingItem.tempRange || ''}
                      onChange={e => setEditingItem({ ...editingItem, tempRange: e.target.value })}
                      className="w-full px-3 py-2 bg-white rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)] text-sm border border-[var(--color-brand-stone)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase mb-1">{t('items.occasionLabel')}</label>
                    <select
                      value={editingItem.occasion || '其他'}
                      onChange={e => setEditingItem({ ...editingItem, occasion: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)] text-sm border border-[var(--color-brand-stone)]"
                    >
                      <option value="商務">{t('items.occasionBusiness')}</option>
                      <option value="休閒">{t('items.occasionCasual')}</option>
                      <option value="運動">{t('items.occasionSport')}</option>
                      <option value="正式">{t('items.occasionFormal')}</option>
                      <option value="其他">{t('items.occasionOther')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase mb-1">{t('items.wrinkleLabel')}</label>
                    <select
                      value={editingItem.wrinkleProne || '適中'}
                      onChange={e => setEditingItem({ ...editingItem, wrinkleProne: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)] text-sm border border-[var(--color-brand-stone)]"
                    >
                      <option value="易皺">{t('items.wrinkleHigh')}</option>
                      <option value="適中">{t('items.wrinkleMedium')}</option>
                      <option value="抗皺">{t('items.wrinkleLow')}</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <select
                  value={editingItem.condition || '新'}
                  onChange={e => setEditingItem({ ...editingItem, condition: e.target.value as any })}
                  className="px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
                >
                  <option value="新">{t('items.condNew')}</option>
                  <option value="舊">{t('items.condOld')}</option>
                  <option value="快用完">{t('items.condEmptying')}</option>
                </select>
                {editingItem.category === '保養品' && (
                  <input
                    type="date"
                    value={editingItem.expirationDate || ''}
                    onChange={e => setEditingItem({ ...editingItem, expirationDate: e.target.value })}
                    className="px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-[var(--color-brand-espresso)]/60"
                  />
                )}
              </div>

              <textarea
                placeholder={t('items.notesPlaceholder')}
                value={editingItem.notes || ''}
                onChange={e => setEditingItem({ ...editingItem, notes: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] h-20 resize-none text-sm"
              />
            </div>
          )}

          <button
            onClick={handleSaveConfirmed}
            disabled={!editingItem.name}
            className="w-full py-3 bg-[var(--color-brand-espresso)] disabled:opacity-30 text-white rounded-xl font-bold shadow-md hover:bg-black transition-colors"
          >
            {(editingItem as Item).id ? t('items.update') : t('items.save')}
          </button>
        </div>
      )}

      {/* Manual add form */}
      {showManualForm && (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-[var(--color-brand-espresso)]">{t('items.add')}</h3>
            <button onClick={() => setShowManualForm(false)} className="p-2 text-[var(--color-brand-espresso)]/40 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex flex-col gap-2">
              <div
                className="w-20 h-20 bg-[var(--color-brand-sand)] rounded-2xl border-2 border-dashed border-[var(--color-brand-stone)] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {manualItem.image ? (
                  <img src={manualItem.image} alt="Preview" className="w-full h-full object-contain bg-white" />
                ) : (
                  <>
                    <ImageIcon size={20} className="text-[var(--color-brand-espresso)]/40 mb-1" />
                    <span className="text-[10px] text-[var(--color-brand-espresso)]/40 font-bold">{t('items.uploadImage')}</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleManualImageUpload}
              />
            </div>

            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder={t('items.namePlaceholder')}
                value={manualItem.name || ''}
                onChange={e => setManualItem({ ...manualItem, name: e.target.value })}
                className="w-full px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={manualItem.category || '衣物'}
                  onChange={e => setManualItem({ ...manualItem, category: e.target.value as any, subCategory: undefined })}
                  className="px-3 py-2 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-sm"
                >
                  {categoryOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                  value={manualItem.season || '通用'}
                  onChange={e => setManualItem({ ...manualItem, season: e.target.value as any })}
                  className="px-3 py-2 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-sm"
                >
                  {seasonOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <select
                value={manualItem.luggageId || activeLuggage?.id || ''}
                onChange={e => setManualItem({ ...manualItem, luggageId: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-sm"
              >
                <option value="">{t('items.unassigned')}</option>
                {luggages.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({getLuggageTypeLabel(l.type)})</option>
                ))}
              </select>

              <label className="flex items-start gap-3 rounded-2xl bg-[var(--color-brand-sand)]/70 px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={manualItem.isDiscardable || false}
                  onChange={e => setManualItem({ ...manualItem, isDiscardable: e.target.checked })}
                  className="mt-0.5 h-5 w-5 rounded text-[var(--color-brand-espresso)] focus:ring-[var(--color-brand-espresso)]"
                />
                <span>
                  <span className="block text-sm font-medium text-[var(--color-brand-espresso)]/80">{t('items.discardable')}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-[var(--color-brand-espresso)]/45">{t('items.discardableHint')}</span>
                </span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSaveManual}
            disabled={!manualItem.name}
            className="w-full py-3 bg-[var(--color-brand-espresso)] disabled:opacity-30 text-white rounded-xl font-bold shadow-md hover:bg-black transition-colors"
          >
            {t('items.save')}
          </button>
        </div>
      )}

      {/* Item list */}
      {visibleItems.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-brand-espresso)]/40">
          <PackageSearch size={48} className="mx-auto mb-4 opacity-50" />
          <p>{activeLuggage ? t('items.emptyFiltered') : t('items.empty')}</p>
          {activeLuggage && (
            <p className="mt-2 text-sm text-[var(--color-brand-espresso)]/30">{t('items.emptyFilteredDesc', { name: activeLuggage.name })}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="px-1 text-xs font-bold text-[var(--color-brand-espresso)]/45">{t('items.totalQuantity', { count: totalVisibleItemQuantity })}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleItems.map(item => {
            const isExpiring = item.category === '保養品' && item.expirationDate && new Date(item.expirationDate) < new Date(expiringCutoff);
            let i18nCategory: string = item.category;
            switch (item.category) {
              case '衣物': i18nCategory = t('items.categoryClothes'); break;
              case '器材': i18nCategory = t('items.categoryGear'); break;
              case '保養品': i18nCategory = t('items.categorySkincare'); break;
              case '其他': i18nCategory = t('items.categoryOther'); break;
            }

            const luggage = luggages.find(l => l.id === item.luggageId);

              return (
              <div key={item.id} className="bg-[var(--color-brand-cream)] p-4 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] flex justify-between items-start group hover:border-[var(--color-brand-stone)] transition-colors">
                <div className="flex space-x-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-contain bg-white rounded-2xl border border-[var(--color-brand-stone)] shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 bg-[var(--color-brand-sand)] rounded-2xl flex items-center justify-center border border-[var(--color-brand-stone)]">
                      <ImageIcon size={20} className="text-[var(--color-brand-espresso)]/30" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-[var(--color-brand-espresso)]">
                      {item.name}
                      {(item.quantity || 1) > 1 && <span className="ml-1 text-sm text-[var(--color-brand-terracotta)]">× {item.quantity}</span>}
                    </h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-[var(--color-brand-espresso)]/70 font-bold">{i18nCategory}</span>
                      {item.inventoryMode === 'quick' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-brand-olive)]/15 text-[var(--color-brand-espresso)] font-bold">{t('items.quickInventory')}</span>
                      )}
                      {item.subCategory && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-brand-sand)] text-[var(--color-brand-espresso)]/50 font-medium">{item.subCategory}</span>
                      )}
                      {item.isDiscardable && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-brand-terracotta)]/10 text-[var(--color-brand-terracotta)] font-bold">{t('items.discardableBadge')}</span>
                      )}
                      <span className="text-[10px] text-[var(--color-brand-espresso)]/40">
                        {item.season === '通用' ? t('items.seasonGeneral') : item.season === '冬季' ? t('items.seasonWinter') : t('items.seasonSummer')}
                      </span>
                    </div>
                    {luggage && (
                      <p className="text-[10px] text-[var(--color-brand-terracotta)] font-medium">{luggage.name}</p>
                    )}
                    {isExpiring && (
                      <p className="text-[10px] text-orange-500 font-bold">{t('items.expiringWarning')}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col space-y-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => handleEdit(item)} className="p-1.5 text-[var(--color-brand-espresso)]/30 hover:text-[var(--color-brand-espresso)] transition-colors bg-[var(--color-brand-sand)] rounded-xl hover:bg-gray-100">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-[var(--color-brand-espresso)]/30 hover:text-red-500 transition-colors bg-red-50 rounded-xl hover:bg-red-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
