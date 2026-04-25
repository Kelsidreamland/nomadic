import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, PackageSearch, Camera, Sparkles, Image as ImageIcon, Edit2, X, ChevronDown } from 'lucide-react';
import { analyzeItemWithAI } from '../services/ai';
import { useTranslation } from 'react-i18next';

export const Items = () => {
  const { t } = useTranslation();
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const luggages = useLiveQuery(() => db.luggages.toArray()) || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [now] = useState(() => Date.now());
  const expiringCutoff = now + 30 * 24 * 60 * 60 * 1000;
  
  const defaultNewItem: Partial<Item> = {
    name: '', category: '衣物', subCategory: '上衣', season: '通用', condition: '新', isDiscardable: false, luggageId: '', notes: '', image: ''
  };
  const [newItem, setNewItem] = useState<Partial<Item>>(defaultNewItem);

  const handleOpenAdd = () => {
    setIsEditing(null);
    setNewItem(defaultNewItem);
    setIsAdding(!isAdding);
  };

  const handleOpenEdit = (item: Item) => {
    setIsAdding(true);
    setIsEditing(item.id);
    setNewItem(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setIsEditing(null);
    setNewItem(defaultNewItem);
  };

  const handleSave = async () => {
    if (!newItem.name) return;
    
    if (isEditing) {
      await db.items.update(isEditing, { ...newItem, updatedAt: Date.now() });
    } else {
      await db.items.add({
        ...newItem,
        id: uuidv4(),
        createdAt: Date.now(),
      } as Item);
    }
    
    handleCancel();
  };

  const handleDelete = async (id: string) => {
    await db.items.delete(id);
    const matches = await db.outfit_matches.filter(m => m.topItemId === id || m.bottomItemId === id).toArray();
    await Promise.all(matches.map(m => db.outfit_matches.delete(m.id)));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setNewItem(prev => ({ ...prev, image: base64 }));
      handleAiAutoFill(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleAiAutoFill = async (base64Image?: string) => {
    if (!newItem.name && !base64Image) return;
    setIsAiThinking(true);
    try {
      const result = await analyzeItemWithAI(newItem.name || '', base64Image || newItem.image);
      setNewItem(prev => ({
        ...prev,
        name: result.name || prev.name,
        category: result.category || prev.category,
        subCategory: result.subCategory || prev.subCategory,
        season: result.season || prev.season,
        color: result.color || prev.color,
        occasion: result.occasion || prev.occasion,
        wrinkleProne: result.wrinkleProne || prev.wrinkleProne,
        tempRange: result.tempRange || prev.tempRange,
        notes: result.notes || prev.notes
      }));
      // Auto-expand advanced options if AI filled them
      setShowAdvanced(true);
    } catch (error: any) {
      console.error("Auto-fill failed", error);
      alert(error.message || '自動填寫失敗');
    }
    setIsAiThinking(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[var(--color-brand-espresso)] tracking-wider">{t('items.title')}</h2>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center space-x-1 bg-[var(--color-brand-espresso)] text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-[var(--color-brand-espresso)] transition-colors"
        >
          {isAdding && !isEditing ? <X size={16} /> : <Plus size={16} />}
          <span>{isAdding && !isEditing ? t('items.cancel') : t('items.add')}</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] space-y-4 relative">
          {isEditing && (
            <button 
              onClick={handleCancel}
              className="absolute top-4 right-4 p-2 text-[var(--color-brand-espresso)]/40 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
          
          <h3 className="font-bold text-lg text-[var(--color-brand-espresso)] mb-2 border-b border-gray-50 pb-2">
            {isEditing ? t('items.edit') : t('items.add')}
          </h3>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex space-x-2">
              <div 
                className="w-20 h-20 bg-[var(--color-brand-sand)] rounded-2xl flex-shrink-0 border-2 border-dashed border-[var(--color-brand-stone)] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {newItem.image ? (
                  <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <ImageIcon size={20} className="text-[var(--color-brand-espresso)]/40 mb-1" />
                    <span className="text-[10px] text-[var(--color-brand-espresso)]/40 font-bold">{t('items.uploadImage')}</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              </div>

              {!newItem.image && (
                <div 
                  className="w-20 h-20 bg-[var(--color-brand-sand)] rounded-2xl flex-shrink-0 border-2 border-dashed border-[var(--color-brand-stone)] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden"
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <Camera size={20} className="text-[var(--color-brand-espresso)]/40 mb-1" />
                  <span className="text-[10px] text-[var(--color-brand-espresso)]/40 font-bold">{t('items.takePhoto', '現場拍照')}</span>
                  <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleImageUpload} />
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder={t('items.namePlaceholder')} 
                  value={newItem.name} 
                  onChange={e => setNewItem({...newItem, name: e.target.value})}
                  className="flex-1 px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
                />
                <button 
                  onClick={() => handleAiAutoFill()}
                  disabled={isAiThinking}
                  className="px-4 py-3 bg-blue-50 text-[var(--color-brand-terracotta)] rounded-xl font-bold flex items-center space-x-1 hover:bg-[var(--color-brand-stone)] transition-colors disabled:opacity-50"
                  title={t('items.aiAutoFill')}
                >
                  <Sparkles size={16} />
                  <span>{isAiThinking ? t('items.analyzing') : t('items.aiAutoFill')}</span>
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <select 
              value={newItem.category} 
              onChange={e => setNewItem({...newItem, category: e.target.value as any})}
              className="px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
            >
              <option value="衣物">{t('items.categoryClothes', '衣物')}</option>
              <option value="器材">{t('items.categoryGear', '器材')}</option>
              <option value="保養品">{t('items.categorySkincare', '保養品')}</option>
              <option value="其他">{t('items.categoryOther', '其他')}</option>
            </select>

            {newItem.category === '衣物' && (
              <select 
                value={newItem.subCategory} 
                onChange={e => setNewItem({...newItem, subCategory: e.target.value as any})}
                className="px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
              >
                <option value="上衣">{t('items.subTop', '上衣')}</option>
                <option value="下裝">{t('items.subBottom', '下裝')}</option>
                <option value="外套">{t('items.subOuterwear', '外套')}</option>
                <option value="內搭">{t('items.subInnerwear', '內搭')}</option>
                <option value="連身裙">{t('items.subDress', '連身裙')}</option>
                <option value="鞋子">{t('items.subShoes', '鞋子')}</option>
                <option value="配飾">{t('items.subAccessory', '配飾')}</option>
                <option value="襪子">{t('items.subSocks', '襪子')}</option>
                <option value="內衣">{t('items.subBra', '內衣')}</option>
                <option value="內褲">{t('items.subUnderpants', '內褲')}</option>
              </select>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            <select 
              value={newItem.season} 
              onChange={e => setNewItem({...newItem, season: e.target.value as any})}
              className="px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
            >
              <option value="通用">{t('items.seasonGeneral')}</option>
              <option value="冬季">{t('items.seasonWinter')}</option>
              <option value="夏季">{t('items.seasonSummer')}</option>
            </select>
          </div>

          <button 
            onClick={() => setShowAdvanced(!showAdvanced)} 
            className="flex items-center justify-between w-full p-3 bg-[var(--color-brand-sand)] rounded-xl text-[var(--color-brand-espresso)]/60 font-bold text-sm hover:bg-gray-100 transition-colors"
          >
            <span>✨ AI 進階屬性與備註 (選填)</span>
            <ChevronDown size={16} className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="space-y-4 animate-fade-in">
              {/* Pack AI Refactor: New Metadata Fields */}
              {newItem.category === '衣物' && (
                <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-[var(--color-brand-terracotta)]/50">
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase mb-1">主要顏色</label>
                    <input 
                      type="text" 
                      placeholder="例如: 黑色, 藏青色" 
                      value={newItem.color || ''} 
                      onChange={e => setNewItem({...newItem, color: e.target.value})}
                      className="w-full px-4 py-3 bg-[var(--color-brand-cream)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)] text-sm border border-[var(--color-brand-stone)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase mb-1">適合溫度</label>
                    <input 
                      type="text" 
                      placeholder="例如: 15-25°C" 
                      value={newItem.tempRange || ''} 
                      onChange={e => setNewItem({...newItem, tempRange: e.target.value})}
                      className="w-full px-4 py-3 bg-[var(--color-brand-cream)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)] text-sm border border-[var(--color-brand-stone)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase mb-1">適用場景</label>
                    <select 
                      value={newItem.occasion || '其他'} 
                      onChange={e => setNewItem({...newItem, occasion: e.target.value as any})}
                      className="w-full px-4 py-3 bg-[var(--color-brand-cream)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)] text-sm border border-[var(--color-brand-stone)]"
                    >
                      <option value="商務">商務 (Business)</option>
                      <option value="休閒">休閒 (Casual)</option>
                      <option value="運動">運動 (Sport)</option>
                      <option value="正式">正式 (Formal)</option>
                      <option value="其他">其他 (Other)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase mb-1">易皺程度</label>
                    <select 
                      value={newItem.wrinkleProne || '適中'} 
                      onChange={e => setNewItem({...newItem, wrinkleProne: e.target.value as any})}
                      className="w-full px-4 py-3 bg-[var(--color-brand-cream)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)] text-sm border border-[var(--color-brand-stone)]"
                    >
                      <option value="易皺">易皺 (Wrinkle-prone)</option>
                      <option value="適中">適中 (Normal)</option>
                      <option value="抗皺">抗皺 (Wrinkle-free)</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <select 
                  value={newItem.condition} 
                  onChange={e => setNewItem({...newItem, condition: e.target.value as any})}
                  className="px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
                >
                  <option value="新">{t('items.condNew', '新')}</option>
                  <option value="舊">{t('items.condOld', '舊')}</option>
                  <option value="快用完">{t('items.condEmptying', '快用完')}</option>
                </select>

                <select 
                  value={newItem.luggageId} 
                  onChange={e => setNewItem({...newItem, luggageId: e.target.value})}
                  className="px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
                >
                  <option value="">{t('items.unassigned')}</option>
                  {luggages.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.type})</option>
                  ))}
                </select>
              </div>

              {newItem.category === '保養品' && (
                <input 
                  type="date" 
                  value={newItem.expirationDate || ''} 
                  onChange={e => setNewItem({...newItem, expirationDate: e.target.value})}
                  className="w-full px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-[var(--color-brand-espresso)]/60"
                />
              )}

              <textarea
                placeholder={t('items.notesPlaceholder')}
                value={newItem.notes || ''}
                onChange={e => setNewItem({...newItem, notes: e.target.value})}
                className="w-full px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] h-20 resize-none text-sm"
              />

              <label className="flex items-center space-x-2 p-2">
                <input 
                  type="checkbox" 
                  checked={newItem.isDiscardable} 
                  onChange={e => setNewItem({...newItem, isDiscardable: e.target.checked})}
                  className="w-5 h-5 text-[var(--color-brand-espresso)] rounded focus:ring-[var(--color-brand-espresso)]"
                />
                <span className="text-sm font-medium text-[var(--color-brand-espresso)]/80">{t('items.discardable')}</span>
              </label>
            </div>
          )}

          <button 
            onClick={handleSave}
            className="w-full py-3 bg-[var(--color-brand-espresso)] text-white rounded-xl font-bold tracking-widest shadow-md hover:bg-[var(--color-brand-espresso)] transition-colors"
          >
            {isEditing ? t('items.update') : t('items.save')}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-brand-espresso)]/40">
          <PackageSearch size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('items.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(item => {
            const isExpiring = item.category === '保養品' && item.expirationDate && new Date(item.expirationDate) < new Date(expiringCutoff);
            
            return (
              <div key={item.id} className="bg-[var(--color-brand-cream)] p-5 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] flex justify-between items-start group hover:border-[var(--color-brand-stone)] transition-colors">
                <div className="flex space-x-4">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-2xl border border-[var(--color-brand-stone)] shadow-sm" style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.1))' }} />
                  ) : (
                    <div className="w-16 h-16 bg-[var(--color-brand-sand)] rounded-2xl flex items-center justify-center border border-[var(--color-brand-stone)]">
                      <ImageIcon size={24} className="text-[var(--color-brand-espresso)]/30" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-[var(--color-brand-espresso)] text-lg">{item.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-[var(--color-brand-espresso)]/80 font-bold">{item.category}</span>
                      {item.isDiscardable && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">可丟棄</span>}
                    </div>
                    <div className="text-xs font-medium text-[var(--color-brand-espresso)]/40 flex items-center space-x-2">
                      <span>{item.season}</span>
                      <span>•</span>
                      <span>{item.condition}</span>
                      {item.subCategory && (
                        <>
                          <span>•</span>
                          <span>{item.subCategory}</span>
                        </>
                      )}
                      {item.luggageId && (
                        <>
                          <span>•</span>
                          <span className="text-[var(--color-brand-terracotta)]">{luggages.find(l => l.id === item.luggageId)?.name || '未知行李'}</span>
                        </>
                      )}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-[var(--color-brand-espresso)]/60 mt-2 line-clamp-2">{item.notes}</p>
                    )}
                    {isExpiring && (
                      <div className="text-xs text-orange-500 font-bold mt-2">
                        {t('items.expiringWarning')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => handleOpenEdit(item)} className="p-2 text-[var(--color-brand-espresso)]/30 hover:text-[var(--color-brand-espresso)] transition-colors bg-[var(--color-brand-sand)] rounded-xl hover:bg-gray-100">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-[var(--color-brand-espresso)]/30 hover:text-red-500 transition-colors bg-red-50 rounded-xl hover:bg-red-100">
                    <Trash2 size={16} />
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
