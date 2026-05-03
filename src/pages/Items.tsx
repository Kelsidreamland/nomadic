import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, PackageSearch, Camera, Sparkles, Image as ImageIcon, Edit2, X, ChevronDown } from 'lucide-react';
import { analyzeItemWithAI } from '../services/ai';
import { useTranslation } from 'react-i18next';
import { useStore } from '../store';

const defaultNewItem: Partial<Item> = {
  name: '', category: '衣物', subCategory: '上衣', season: '通用', condition: '新', isDiscardable: false, luggageId: '', notes: '', image: ''
};

export const Items = () => {
  const { t } = useTranslation();
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const luggages = useLiveQuery(() => db.luggages.toArray()) || [];
  const { activeLuggageId, setActiveLuggageId } = useStore();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);
  const [editingImage, setEditingImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualItem, setManualItem] = useState<Partial<Item>>({ ...defaultNewItem });
  const [now] = useState(() => Date.now());
  const expiringCutoff = now + 30 * 24 * 60 * 60 * 1000;

  const getLuggageTypeLabel = (type: string) => {
    switch (type) {
      case '托运': return t('luggages.typeChecked');
      case '手提': return t('luggages.typeCarryOn');
      case '随身': return t('luggages.typePersonal');
      case '特殊': return t('luggages.typeSpecial');
      default: return type;
    }
  };

  const createStickerPreview = async (base64: string): Promise<string> => {
    const image = new Image();
    image.src = base64;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Image load failed'));
    });
    const maxSize = 320;
    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const imageWidth = Math.max(1, Math.round(image.width * scale));
    const imageHeight = Math.max(1, Math.round(image.height * scale));
    const padding = Math.max(12, Math.round(Math.min(imageWidth, imageHeight) * 0.08));
    const canvas = document.createElement('canvas');
    canvas.width = imageWidth + padding * 2;
    canvas.height = imageHeight + padding * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return base64;
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.roundRect(4, 4, canvas.width - 8, canvas.height - 8, 28);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.drawImage(image, padding, padding, imageWidth, imageHeight);
    return canvas.toDataURL('image/png');
  };

  const handleImageCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const sticker = await createStickerPreview(base64);
      setEditingImage(sticker);
      setIsAnalyzing(true);
      setEditingItem({ ...defaultNewItem, image: sticker, luggageId: activeLuggageId || '' });
      try {
        const result = await analyzeItemWithAI('', base64);
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
          luggageId: activeLuggageId || prev?.luggageId || '',
        }));
        if (result.color || result.occasion || result.wrinkleProne || result.tempRange) {
          setShowAdvanced(true);
        }
      } catch (err: any) {
        console.error('AI analysis failed', err);
      }
      setIsAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      const sticker = await createStickerPreview(base64);
      setManualItem(prev => ({ ...prev, image: sticker }));
      setIsAnalyzing(true);
      try {
        const result = await analyzeItemWithAI(manualItem.name || '', base64);
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
      } catch (err: any) {
        console.error('AI analysis failed', err);
      }
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
      } as Item);
    }
    setEditingItem(null);
    setEditingImage(null);
    setShowAdvanced(false);
  };

  const handleSaveManual = async () => {
    if (!manualItem.name) return;
    await db.items.add({
      ...manualItem,
      id: uuidv4(),
      createdAt: Date.now(),
      luggageId: manualItem.luggageId || activeLuggageId || '',
    } as Item);
    setManualItem({ ...defaultNewItem });
    setShowManualForm(false);
  };

  const handleDelete = async (id: string) => {
    await db.items.delete(id);
    const matches = await db.outfit_matches.filter(m => m.topItemId === id || m.bottomItemId === id).toArray();
    await Promise.all(matches.map(m => db.outfit_matches.delete(m.id)));
  };

  const handleEdit = (item: Item) => {
    setEditingItem({ ...item });
    setEditingImage(item.image || null);
    setShowAdvanced(!!(item.color || item.occasion || item.wrinkleProne || item.tempRange));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setEditingImage(null);
    setShowAdvanced(false);
  };

  const itemCountByLuggage = (luggageId: string) => items.filter(i => i.luggageId === luggageId).length;

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
        <h2 className="text-3xl font-serif font-bold text-[var(--color-brand-espresso)] tracking-wider">{t('items.title')}</h2>
      </div>

      {/* Luggage selector */}
      {luggages.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-[var(--color-brand-espresso)]/40 shrink-0">{t('luggages.title')}:</span>
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

      {/* Camera capture area */}
      <div className="bg-[var(--color-brand-cream)] rounded-3xl shadow-sm border border-[var(--color-brand-stone)] p-8 text-center space-y-4">
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
            onClick={() => { setShowManualForm(true); setManualItem({ ...defaultNewItem, luggageId: activeLuggageId || '' }); }}
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
              <img src={editingImage} alt="Preview" className="w-24 h-24 object-cover rounded-2xl border border-[var(--color-brand-stone)] shadow-sm shrink-0" />
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
                  value={editingItem.luggageId || activeLuggageId || ''}
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

              <label className="flex items-center space-x-2 p-2">
                <input
                  type="checkbox"
                  checked={editingItem.isDiscardable || false}
                  onChange={e => setEditingItem({ ...editingItem, isDiscardable: e.target.checked })}
                  className="w-5 h-5 text-[var(--color-brand-espresso)] rounded focus:ring-[var(--color-brand-espresso)]"
                />
                <span className="text-sm font-medium text-[var(--color-brand-espresso)]/80">{t('items.discardable')}</span>
              </label>
            </div>
          )}

          <button
            onClick={handleSaveConfirmed}
            disabled={!editingItem.name}
            className="w-full py-3 bg-[var(--color-brand-espresso)] disabled:opacity-30 text-white rounded-xl font-bold tracking-widest shadow-md hover:bg-black transition-colors"
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
                  <img src={manualItem.image} alt="Preview" className="w-full h-full object-cover" />
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
                value={manualItem.luggageId || activeLuggageId || ''}
                onChange={e => setManualItem({ ...manualItem, luggageId: e.target.value })}
                className="w-full px-3 py-2 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-sm"
              >
                <option value="">{t('items.unassigned')}</option>
                {luggages.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({getLuggageTypeLabel(l.type)})</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSaveManual}
            disabled={!manualItem.name}
            className="w-full py-3 bg-[var(--color-brand-espresso)] disabled:opacity-30 text-white rounded-xl font-bold tracking-widest shadow-md hover:bg-black transition-colors"
          >
            {t('items.save')}
          </button>
        </div>
      )}

      {/* Item list */}
      {items.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-brand-espresso)]/40">
          <PackageSearch size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('items.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => {
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
                    <img src={item.image} alt={item.name} className="w-14 h-14 object-cover rounded-2xl border border-[var(--color-brand-stone)] shadow-sm" />
                  ) : (
                    <div className="w-14 h-14 bg-[var(--color-brand-sand)] rounded-2xl flex items-center justify-center border border-[var(--color-brand-stone)]">
                      <ImageIcon size={20} className="text-[var(--color-brand-espresso)]/30" />
                    </div>
                  )}
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-[var(--color-brand-espresso)]">{item.name}</h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-[var(--color-brand-espresso)]/70 font-bold">{i18nCategory}</span>
                      {item.subCategory && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--color-brand-sand)] text-[var(--color-brand-espresso)]/50 font-medium">{item.subCategory}</span>
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
      )}
    </div>
  );
};
