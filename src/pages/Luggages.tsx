import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Luggage } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { useStore } from '../store';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export const Luggages = () => {
  const { t } = useTranslation();
  const { currentSeasonFilter, setSeasonFilter } = useStore();
  const allLuggages = useLiveQuery(() => db.luggages.toArray()) || [];

  const luggages = allLuggages.filter(l => 
    currentSeasonFilter === '所有' ? true : l.season === currentSeasonFilter || l.season === '混合'
  );

  const [isAdding, setIsAdding] = useState(false);
  const [newLuggage, setNewLuggage] = useState<Partial<Luggage>>({
    name: '', type: '托运', season: '混合', length: 0, width: 0, height: 0, weightHistory: []
  });

  const handleAdd = async () => {
    if (!newLuggage.name) return;
    await db.luggages.add({
      ...newLuggage,
      id: uuidv4(),
      createdAt: Date.now(),
      weightHistory: [],
    } as Luggage);
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

  const [weightInputs, setWeightInputs] = useState<{[key: string]: number}>({});

  const handleRecordWeight = async (luggageId: string) => {
    const luggage = await db.luggages.get(luggageId);
    const inputWeight = weightInputs[luggageId];
    if (luggage && inputWeight !== undefined) {
      const newHistory = [...(luggage.weightHistory || []), {
        date: new Date().toISOString(),
        weight: inputWeight
      }];
      await db.luggages.update(luggageId, { weightHistory: newHistory });
      setWeightInputs({...weightInputs, [luggageId]: 0}); // reset input
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#2C3E50] tracking-wider">{t('luggages.title')}</h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1 bg-[#2C3E50] text-white px-4 py-2 rounded-full text-sm font-bold shadow-md hover:bg-[#1A252F] transition-colors"
        >
          <Plus size={16} />
          <span>{t('luggages.add')}</span>
        </button>
      </div>

      <div className="flex space-x-2 p-1 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-sm">
        {[{ id: '所有', label: t('luggages.all') }, { id: '冬季', label: t('luggages.winter') }, { id: '夏季', label: t('luggages.summer') }].map(season => (
          <button
            key={season.id}
            onClick={() => setSeasonFilter(season.id as any)}
            className={clsx(
              'flex-1 py-2 text-sm font-bold rounded-xl transition-all',
              currentSeasonFilter === season.id ? 'bg-[#2C3E50] text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
            )}
          >
            {season.label}
          </button>
        ))}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
          <input 
            type="text" 
            placeholder={t('luggages.namePlaceholder')} 
            value={newLuggage.name} 
            onChange={e => setNewLuggage({...newLuggage, name: e.target.value})}
            className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
          />
          
          <div className="grid grid-cols-2 gap-4">
            <select 
              value={newLuggage.type} 
              onChange={e => setNewLuggage({...newLuggage, type: e.target.value as any})}
              className="px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
            >
              <option value="托运">{t('luggages.typeChecked')}</option>
              <option value="手提">{t('luggages.typeCarryOn')}</option>
              <option value="随身">{t('luggages.typePersonal')}</option>
              <option value="特殊">{t('luggages.typeSpecial')}</option>
            </select>

            <select 
              value={newLuggage.season} 
              onChange={e => setNewLuggage({...newLuggage, season: e.target.value as any})}
              className="px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
            >
              <option value="混合">{t('luggages.seasonMixed')}</option>
              <option value="冬季">{t('luggages.seasonWinter')}</option>
              <option value="夏季">{t('luggages.seasonSummer')}</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500 pl-2">{t('luggages.sizeLabel')}</label>
            <div className="flex space-x-2">
              <input 
                type="number" 
                placeholder="L" 
                value={newLuggage.length || ''} 
                onChange={e => setNewLuggage({...newLuggage, length: parseFloat(e.target.value)})}
                className="w-1/3 px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
              />
              <input 
                type="number" 
                placeholder="W" 
                value={newLuggage.width || ''} 
                onChange={e => setNewLuggage({...newLuggage, width: parseFloat(e.target.value)})}
                className="w-1/3 px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
              />
              <input 
                type="number" 
                placeholder="H" 
                value={newLuggage.height || ''} 
                onChange={e => setNewLuggage({...newLuggage, height: parseFloat(e.target.value)})}
                className="w-1/3 px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
              />
            </div>
          </div>

          <button 
            onClick={handleAdd}
            className="w-full py-3 bg-[#2C3E50] text-white rounded-xl font-bold tracking-widest shadow-md"
          >
            {t('luggages.save')}
          </button>
        </div>
      )}

      {luggages.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Briefcase size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('luggages.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {luggages.map(luggage => {
            const currentWeight = getLuggageWeight(luggage);

            return (
              <div key={luggage.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-[#2C3E50] text-xl mb-1">{luggage.name}</h3>
                    <div className="flex space-x-2 mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600 font-bold">{luggage.type}</span>
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-bold">{luggage.season}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium">{t('luggages.size')}: {luggage.length} × {luggage.width} × {luggage.height} cm</p>
                  </div>
                  <button onClick={() => handleDelete(luggage.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
                
                <div className="space-y-4 border-t border-gray-50 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-500">{t('luggages.currentWeight')}</span>
                    <span className="text-2xl font-black text-[#2C3E50]">{currentWeight.toFixed(1)} kg</span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <input 
                      type="number" 
                      placeholder={t('luggages.recordPlaceholder')} 
                      value={weightInputs[luggage.id] || ''}
                      onChange={e => setWeightInputs({...weightInputs, [luggage.id]: parseFloat(e.target.value)})}
                      className="w-1/2 px-4 py-2 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50] text-sm"
                    />
                    <button 
                      onClick={() => handleRecordWeight(luggage.id)}
                      className="w-1/2 py-2 bg-[#2C3E50] text-white rounded-xl text-sm font-bold shadow-md hover:bg-[#1A252F] transition-colors"
                    >
                      {t('luggages.recordBtn')}
                    </button>
                  </div>

                  {luggage.weightHistory && luggage.weightHistory.length > 0 && (
                    <div className="mt-2 text-xs text-gray-400">
                      <p>{t('luggages.lastRecord')} {new Date(luggage.weightHistory[luggage.weightHistory.length - 1].date).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
