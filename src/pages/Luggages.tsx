import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Luggage } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { useStore } from '../store';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { LuggageWeightChart } from '../components/LuggageWeightChart';
import { useNavigate } from 'react-router-dom';

const luggageSizePresets = [
  { label: '30"', length: 78, width: 52, height: 31 },
  { label: '28"', length: 75, width: 49, height: 30 },
  { label: '26"', length: 68, width: 45, height: 28 },
  { label: '24"', length: 61, width: 41, height: 26 },
  { label: '22"', length: 56, width: 38, height: 24 },
  { label: '20"', length: 55, width: 36, height: 23 },
];

const isValidWeightInput = (value?: string) => {
  if (!value) return false;
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) && parsedValue >= 0;
};

export const Luggages = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentSeasonFilter, setSeasonFilter, setActiveLuggageId } = useStore();
  const allLuggages = useLiveQuery(() => db.luggages.toArray()) || [];
  const allItems = useLiveQuery(() => db.items.toArray()) || [];

  const luggages = allLuggages.filter(l => 
    currentSeasonFilter === '所有' ? true : l.season === currentSeasonFilter || l.season === '混合'
  );

  const [isAdding, setIsAdding] = useState(false);
  const [newLuggage, setNewLuggage] = useState<Partial<Luggage>>({
    name: '', type: '托运', season: '混合', length: 0, width: 0, height: 0, weightHistory: []
  });

  const handleAdd = async () => {
    if (!newLuggage.name) return;
    const luggageId = uuidv4();
    await db.luggages.add({
      ...newLuggage,
      id: luggageId,
      createdAt: Date.now(),
      weightHistory: [],
    } as Luggage);
    setActiveLuggageId(luggageId);
    setIsAdding(false);
    setNewLuggage({ name: '', type: '托运', season: '混合', length: 0, width: 0, height: 0, weightHistory: [] });
  };

  const handleDelete = async (id: string) => {
    await db.luggages.delete(id);
    const relatedItems = await db.items.where('luggageId').equals(id).toArray();
    await Promise.all(relatedItems.map(item => db.items.update(item.id, { luggageId: '' })));
  };

  const getLuggageWeight = (luggage: Luggage) => {
    if (!luggage.weightHistory || luggage.weightHistory.length === 0) return 0;
    return luggage.weightHistory[luggage.weightHistory.length - 1].weight;
  };

  const getLuggageTypeLabel = (type: Luggage['type']) => {
    switch (type) {
      case '托运': return t('luggages.typeChecked');
      case '手提': return t('luggages.typeCarryOn');
      case '随身': return t('luggages.typePersonal');
      case '特殊': return t('luggages.typeSpecial');
      default: return type;
    }
  };

  const getLuggageSeasonLabel = (season: Luggage['season']) => {
    switch (season) {
      case '混合': return t('luggages.seasonMixed');
      case '冬季': return t('luggages.seasonWinter');
      case '夏季': return t('luggages.seasonSummer');
      case '通用': return t('items.seasonGeneral');
      default: return season;
    }
  };

  const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});

  const handleRecordWeight = async (luggageId: string) => {
    const luggage = await db.luggages.get(luggageId);
    const inputValue = weightInputs[luggageId];
    if (luggage && isValidWeightInput(inputValue)) {
      const inputWeight = Number(inputValue);
      const newHistory = [...(luggage.weightHistory || []), {
        date: new Date().toISOString(),
        weight: inputWeight
      }];
      await db.luggages.update(luggageId, { weightHistory: newHistory });
      setWeightInputs({ ...weightInputs, [luggageId]: '' });
    }
  };

  const itemCountByLuggage = (luggageId: string) => allItems.filter((item) => item.luggageId === luggageId).length;

  const openItemsForLuggage = (luggageId: string) => {
    setActiveLuggageId(luggageId);
    navigate('/items');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-serif font-bold text-[var(--color-brand-espresso)] tracking-wider">{t('luggages.title')}</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1 bg-[var(--color-brand-espresso)] text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-[var(--color-brand-espresso)] transition-colors"
        >
          <Plus size={16} />
          <span>{t('luggages.add')}</span>
        </button>
      </div>

      <div className="flex space-x-2 p-1 bg-[var(--color-brand-cream)] rounded-2xl shadow-sm border border-[var(--color-brand-stone)] max-w-sm">
        {[{ id: '所有', label: t('luggages.all') }, { id: '冬季', label: t('luggages.winter') }, { id: '夏季', label: t('luggages.summer') }].map(season => (
          <button
            key={season.id}
            onClick={() => setSeasonFilter(season.id as any)}
            className={clsx(
              'flex-1 py-2 text-sm font-bold rounded-xl transition-all',
              currentSeasonFilter === season.id ? 'bg-[var(--color-brand-espresso)] text-white shadow-md' : 'text-[var(--color-brand-espresso)]/40 hover:text-[var(--color-brand-espresso)]/80'
            )}
          >
            {season.label}
          </button>
        ))}
      </div>

      {isAdding && (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] space-y-4">
          <input 
            type="text" 
            placeholder={t('luggages.namePlaceholder')} 
            value={newLuggage.name} 
            onChange={e => setNewLuggage({...newLuggage, name: e.target.value})}
            className="w-full px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <select 
              value={newLuggage.type} 
              onChange={e => setNewLuggage({...newLuggage, type: e.target.value as any})}
              className="px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
            >
              <option value="托运">{t('luggages.typeChecked')}</option>
              <option value="手提">{t('luggages.typeCarryOn')}</option>
              <option value="随身">{t('luggages.typePersonal')}</option>
              <option value="特殊">{t('luggages.typeSpecial')}</option>
            </select>

            <select 
              value={newLuggage.season} 
              onChange={e => setNewLuggage({...newLuggage, season: e.target.value as any})}
              className="px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
            >
              <option value="混合">{t('luggages.seasonMixed')}</option>
              <option value="冬季">{t('luggages.seasonWinter')}</option>
              <option value="夏季">{t('luggages.seasonSummer')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-[var(--color-brand-espresso)]/60 pl-2">{t('luggages.sizeLabel')}</label>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {luggageSizePresets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setNewLuggage({
                    ...newLuggage,
                    name: newLuggage.name || `${preset.label} ${t('luggages.title')}`,
                    length: preset.length,
                    width: preset.width,
                    height: preset.height,
                    type: preset.label === '20"' || preset.label === '22"' ? '手提' : '托运'
                  })}
                  className="px-3 py-2 bg-[var(--color-brand-sand)] border border-[var(--color-brand-stone)] rounded-xl text-xs font-bold text-[var(--color-brand-espresso)]/70 hover:border-[var(--color-brand-terracotta)] hover:text-[var(--color-brand-terracotta)] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <p className="text-xs leading-relaxed text-[var(--color-brand-espresso)]/50 bg-[var(--color-brand-sand)] border border-[var(--color-brand-stone)] rounded-2xl px-4 py-3">
              {t('luggages.sizeReminder')}
            </p>
            <div className="flex space-x-2">
              <input 
                type="number" 
                placeholder="L" 
                value={newLuggage.length || ''} 
                onChange={e => setNewLuggage({...newLuggage, length: parseFloat(e.target.value)})}
                className="w-1/3 px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
              />
              <input 
                type="number" 
                placeholder="W" 
                value={newLuggage.width || ''} 
                onChange={e => setNewLuggage({...newLuggage, width: parseFloat(e.target.value)})}
                className="w-1/3 px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
              />
              <input 
                type="number" 
                placeholder="H" 
                value={newLuggage.height || ''} 
                onChange={e => setNewLuggage({...newLuggage, height: parseFloat(e.target.value)})}
                className="w-1/3 px-4 py-3 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)]"
              />
            </div>
          </div>

          <button 
            onClick={handleAdd}
            className="w-full py-3 bg-[var(--color-brand-espresso)] text-white rounded-xl font-bold tracking-widest shadow-md"
          >
            {t('luggages.save')}
          </button>
        </div>
      )}

      {luggages.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-brand-espresso)]/40">
          <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('luggages.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {luggages.map(luggage => {
            const currentWeight = getLuggageWeight(luggage);
            const canRecordWeight = isValidWeightInput(weightInputs[luggage.id]);
            const packedItemCount = itemCountByLuggage(luggage.id);

            return (
              <div key={luggage.id} className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-[var(--color-brand-espresso)] text-xl mb-1">{luggage.name}</h3>
                    <div className="flex space-x-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-[var(--color-brand-terracotta)] font-bold">{getLuggageTypeLabel(luggage.type)}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-[var(--color-brand-espresso)]/80 font-bold">{getLuggageSeasonLabel(luggage.season)}</span>
                    </div>
                    <p className="text-xs text-[var(--color-brand-espresso)]/40 font-medium">{t('luggages.size')}: {luggage.length} × {luggage.width} × {luggage.height} cm</p>
                  </div>
                  <button onClick={() => handleDelete(luggage.id)} className="p-2 text-[var(--color-brand-espresso)]/30 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="space-y-4 border-t border-gray-50 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-[var(--color-brand-espresso)]/60">{t('luggages.currentWeight')}</span>
                    <span className="text-2xl font-black text-[var(--color-brand-espresso)]">{currentWeight.toFixed(1)} kg</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--color-brand-sand)]/85 px-4 py-3 border border-[var(--color-brand-stone)]/70">
                    <div>
                      <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{t('luggages.itemsCount', { count: packedItemCount })}</p>
                      <p className="text-xs text-[var(--color-brand-espresso)]/50 mt-1">
                        {packedItemCount === 0 ? t('luggages.emptyLuggageHint') : t('luggages.autoAssignHint')}
                      </p>
                    </div>
                    <button
                      onClick={() => openItemsForLuggage(luggage.id)}
                      className="shrink-0 rounded-xl bg-[var(--color-brand-espresso)] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-black transition-colors"
                    >
                      {t('luggages.addItem')}
                    </button>
                  </div>

                  <LuggageWeightChart luggage={luggage} />
                  
                  <div className="flex space-x-2">
                    <input 
                      type="number" 
                      min="0"
                      step="0.1"
                      placeholder={t('luggages.recordPlaceholder')} 
                      value={weightInputs[luggage.id] || ''}
                      onChange={e => setWeightInputs({ ...weightInputs, [luggage.id]: e.target.value })}
                      className="w-1/2 px-4 py-2 bg-[var(--color-brand-sand)] rounded-xl outline-none focus:ring-2 focus:ring-[var(--color-brand-espresso)] text-sm"
                    />
                    <button 
                      onClick={() => handleRecordWeight(luggage.id)}
                      disabled={!canRecordWeight}
                      className={clsx(
                        'w-1/2 py-2 rounded-xl text-sm font-bold shadow-md transition-colors',
                        canRecordWeight
                          ? 'bg-[var(--color-brand-espresso)] text-white hover:bg-[var(--color-brand-espresso)]'
                          : 'bg-[var(--color-brand-stone)] text-[var(--color-brand-espresso)]/40 shadow-none cursor-not-allowed'
                      )}
                    >
                      {t('luggages.recordBtn')}
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
