import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item, type OutfitMatch } from '../db';
import { v4 as uuidv4 } from 'uuid';
import Xarrow from 'react-xarrows';
import { Sparkles, Trash2, Bot, Info, Image as ImageIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { generateOutfitAdvice, generatePackingDecision } from '../services/ai';
import { useTranslation } from 'react-i18next';

export const Outfits = () => {
  const { t } = useTranslation();
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const matches = useLiveQuery(() => db.outfit_matches.toArray()) || [];
  
  const tops = items.filter(i => i.category === '衣物' && (i.subCategory === '上衣' || i.subCategory === '内搭'));
  const bottoms = items.filter(i => i.category === '衣物' && (i.subCategory === '下装' || i.subCategory === '连身裙'));
  const outerwears = items.filter(i => i.category === '衣物' && i.subCategory === '外套');

  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTopClick = (id: string) => {
    if (selectedTopId === id) setSelectedTopId(null);
    else setSelectedTopId(id);
  };

  const handleBottomClick = async (bottomId: string) => {
    if (!selectedTopId) return;

    // Check if match already exists
    const exists = matches.find(m => m.topItemId === selectedTopId && m.bottomItemId === bottomId);
    
    if (exists) {
      await db.outfit_matches.delete(exists.id);
    } else {
      await db.outfit_matches.add({
        id: uuidv4(),
        topItemId: selectedTopId,
        bottomItemId: bottomId,
        createdAt: Date.now()
      });

      // Get AI Advice
      const top = tops.find(t => t.id === selectedTopId);
      const bottom = bottoms.find(b => b.id === bottomId);
      if (top && bottom) {
        setIsThinking(true);
        const advice = await generateOutfitAdvice(top.name, bottom.name, '目的地');
        setAiAdvice(advice);
        setIsThinking(false);
      }
    }
    
    setSelectedTopId(null); // deselect
  };

  const getMatchDecision = async () => {
    setIsThinking(true);
    const decision = await generatePackingDecision(items.filter(i => i.category === '衣物'), '未知目的地', matches.length);
    setAiAdvice(decision);
    setIsThinking(false);
  };

  const renderItemCard = (item: Item, isTop: boolean = false) => {
    const isSelected = selectedTopId === item.id;
    return (
      <div 
        key={item.id}
        id={`item-${item.id}`}
        onClick={() => isTop ? handleTopClick(item.id) : handleBottomClick(item.id)}
        className={clsx(
          "p-4 rounded-2xl border-2 transition-all cursor-pointer text-center relative overflow-hidden",
          isSelected 
            ? "border-[#2C3E50] bg-blue-50/50 shadow-md scale-105 z-20" 
            : selectedTopId && !isTop
              ? "border-blue-200 hover:border-[#2C3E50] hover:bg-blue-50/50 hover:shadow-md animate-pulse"
              : "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm"
        )}
      >
        {item.image && (
          <div className="w-full aspect-square mb-3 flex items-center justify-center">
            <img 
              src={item.image} 
              alt={item.name} 
              className="max-w-full max-h-full object-contain drop-shadow-md"
              style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.2))' }}
            />
          </div>
        )}
        <div className="font-bold text-[#2C3E50] truncate">{item.name}</div>
        <div className="text-xs text-gray-400 mt-1">{item.season}</div>
        {isSelected && isTop && (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#2C3E50] rounded-full border-4 border-white" />
        )}
        {selectedTopId && !isTop && (
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-300 rounded-full border-4 border-white" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" ref={containerRef}>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-[#2C3E50] tracking-wider">{t('outfits.title')}</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">{t('outfits.subtitle')}</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-2">
          <Sparkles size={18} className="text-yellow-500" />
          <span className="font-bold text-[#2C3E50]">{t('outfits.totalSets', { count: matches.length })}</span>
        </div>
      </div>

      {(aiAdvice || isThinking) && (
        <div className="bg-[#2C3E50] text-white p-5 rounded-3xl shadow-lg relative overflow-hidden animate-fade-in">
          <div className="absolute -right-4 -top-4 opacity-10">
            <Bot size={100} />
          </div>
          <div className="flex items-start space-x-3 relative z-10">
            <Bot size={24} className="shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-blue-200 uppercase tracking-wider mb-1">{t('outfits.aiReview')}</h4>
              {isThinking ? (
                <div className="flex space-x-1 items-center h-5">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              ) : (
                <p className="text-sm font-medium leading-relaxed">{aiAdvice}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tops.length === 0 || bottoms.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
          <Info size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('outfits.empty')}</p>
        </div>
      ) : (
        <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-10 min-h-[500px] overflow-x-auto">
          <div className="flex justify-between relative z-10 min-w-[600px] space-x-4">
            {/* Tops Column */}
            <div className="flex-1 space-y-6">
              <h3 className="text-center font-bold text-gray-400 text-sm tracking-widest mb-6">{t('outfits.tops')}</h3>
              {tops.map(top => renderItemCard(top, true))}
            </div>

            {/* Bottoms Column */}
            <div className="flex-1 space-y-6">
              <h3 className="text-center font-bold text-gray-400 text-sm tracking-widest mb-6">{t('outfits.bottoms')}</h3>
              {bottoms.map(bottom => renderItemCard(bottom, false))}
            </div>

            {/* Outerwear Column (Only render if there are outerwears) */}
            {outerwears.length > 0 && (
              <div className="flex-1 space-y-6">
                <h3 className="text-center font-bold text-gray-400 text-sm tracking-widest mb-6">{t('outfits.outerwear')}</h3>
                {outerwears.map(outer => (
                  <div 
                    key={outer.id}
                    className="p-4 rounded-2xl border-2 border-gray-100 bg-white text-center relative opacity-80"
                  >
                    {outer.image && (
                      <div className="w-full aspect-square mb-3 flex items-center justify-center">
                        <img 
                          src={outer.image} 
                          alt={outer.name} 
                          className="max-w-full max-h-full object-contain drop-shadow-md"
                          style={{ filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.2))' }}
                        />
                      </div>
                    )}
                    <div className="font-bold text-gray-600 truncate">{outer.name}</div>
                    <div className="text-xs text-gray-400 mt-1">{t('outfits.universal')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Render Xarrows */}
          {matches.map(match => {
            const hasTop = document.getElementById(`item-${match.topItemId}`);
            const hasBottom = document.getElementById(`item-${match.bottomItemId}`);
            if (!hasTop || !hasBottom) return null;
            
            return (
              <Xarrow
                key={match.id}
                start={`item-${match.topItemId}`}
                end={`item-${match.bottomItemId}`}
                color="#2C3E50"
                strokeWidth={2}
                path="smooth"
                curveness={0.5}
                showHead={false}
                dashness={{ strokeLen: 10, nonStrokeLen: 5, animation: -1 }}
              />
            );
          })}
        </div>
      )}

      {matches.length > 0 && (
        <button 
          onClick={getMatchDecision}
          className="w-full py-4 bg-white border border-gray-200 hover:border-[#2C3E50] text-[#2C3E50] rounded-2xl font-bold tracking-widest shadow-sm transition-colors flex justify-center items-center space-x-2"
        >
          <Bot size={20} />
          <span>{t('outfits.aiReduce')}</span>
        </button>
      )}
    </div>
  );
};
