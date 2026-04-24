import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Sparkles, Bot, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { generateOutfitAdvice, generatePackingDecision } from '../services/ai';
import { useTranslation } from 'react-i18next';

export const Outfits = () => {
  const { t } = useTranslation();
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const matches = useLiveQuery(() => db.outfit_matches.toArray()) || [];
  
  const tops = items.filter(i => i.category === '衣物' && ['上衣', '内搭', '外套', '连身裙'].includes(i.subCategory || ''));
  const bottoms = items.filter(i => i.category === '衣物' && ['下装', '鞋子', '配饰'].includes(i.subCategory || ''));

  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);

  const getMatchCount = (itemId: string, isTop: boolean) => {
    return matches.filter(m => isTop ? m.topItemId === itemId : m.bottomItemId === itemId).length;
  };

  const handleTopClick = (id: string) => {
    if (selectedTopId === id) setSelectedTopId(null);
    else setSelectedTopId(id);
  };

  const handleBottomClick = async (bottomId: string) => {
    if (!selectedTopId) return;

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

      // Get AI Advice asynchronously without blocking UI
      const top = tops.find(t => t.id === selectedTopId);
      const bottom = bottoms.find(b => b.id === bottomId);
      if (top && bottom) {
        setIsThinking(true);
        generateOutfitAdvice(top.name, bottom.name, '目的地')
          .then(advice => {
            setAiAdvice(advice);
            setIsThinking(false);
          })
          .catch(err => {
            setAiAdvice(err.message || 'AI 生成失敗');
            setIsThinking(false);
          });
      }
    }
  };

  const getMatchDecision = async () => {
    setIsThinking(true);
    try {
      const decision = await generatePackingDecision(items.filter(i => i.category === '衣物'), '未知目的地', matches.length);
      setAiAdvice(decision);
    } catch (err: any) {
      setAiAdvice(err.message || 'AI 決策失敗');
    } finally {
      setIsThinking(false);
    }
  };

  const renderVersatilityBadge = (count: number) => {
    if (count === 0) return <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full text-[10px] font-bold">0 搭配 (建議捨棄)</span>;
    if (count >= 3) return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{count} 搭配 (高百搭)</span>;
    return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold">{count} 搭配</span>;
  };

  const renderItemCard = (item: Item, isTop: boolean = false) => {
    const isSelected = selectedTopId === item.id;
    const matchCount = getMatchCount(item.id, isTop);
    
    let cardStyle = "border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm";
    
    if (isTop) {
      if (isSelected) {
        cardStyle = "border-[#2C3E50] bg-blue-50/50 shadow-md ring-2 ring-[#2C3E50] ring-offset-2";
      } else if (selectedTopId) {
        cardStyle = "border-gray-100 bg-white opacity-50 grayscale-[50%]"; // Dim other tops when one is selected
      }
    } else {
      if (selectedTopId) {
        const isMatched = matches.some(m => m.topItemId === selectedTopId && m.bottomItemId === item.id);
        if (isMatched) {
          cardStyle = "border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-400 ring-offset-1";
        } else {
          cardStyle = "border-gray-100 bg-gray-50 opacity-60 hover:opacity-100 hover:border-blue-300 border-dashed border-2";
        }
      }
    }

    return (
      <div 
        key={item.id}
        onClick={() => isTop ? handleTopClick(item.id) : handleBottomClick(item.id)}
        className={clsx(
          "p-4 rounded-2xl border-2 transition-all cursor-pointer text-center relative flex flex-col items-center",
          cardStyle
        )}
      >
        <div className="absolute top-2 right-2 z-10">
          {renderVersatilityBadge(matchCount)}
        </div>

        {item.image && (
          <div className="w-20 h-20 mb-3 flex items-center justify-center">
            <img 
              src={item.image} 
              alt={item.name} 
              className="max-w-full max-h-full object-contain drop-shadow-sm rounded-lg"
            />
          </div>
        )}
        <div className="font-bold text-[#2C3E50] text-sm truncate w-full mt-auto">{item.name}</div>
        <div className="text-[10px] text-gray-400 mt-1">{item.subCategory} • {item.wrinkleProne || '適中'}</div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-[#2C3E50] tracking-wider">{t('outfits.title')}</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">點擊上衣，再點擊下裝即可建立搭配</p>
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

      {tops.length === 0 && bottoms.length === 0 ? (
        <div className="text-center py-20 text-gray-400 bg-white rounded-3xl border border-dashed border-gray-200">
          <Info size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('outfits.empty')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tops Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800 tracking-widest">上半身 (Tops & Outerwear)</h3>
              {selectedTopId && (
                <button 
                  onClick={() => setSelectedTopId(null)}
                  className="text-xs font-bold text-blue-500 bg-blue-50 px-3 py-1 rounded-full hover:bg-blue-100"
                >
                  取消選取
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tops.map(top => renderItemCard(top, true))}
            </div>
            {tops.length === 0 && <p className="text-sm text-gray-400 py-4">尚無上衣資料</p>}
          </div>

          {/* Bottoms Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 relative">
            {!selectedTopId && (
              <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[1px] rounded-3xl flex items-center justify-center">
                <div className="bg-gray-800 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg flex items-center space-x-2">
                  <span className="animate-pulse">👆</span>
                  <span>請先從上方選擇一件上衣</span>
                </div>
              </div>
            )}
            
            <h3 className="font-bold text-gray-800 tracking-widest mb-4">下半身與配件 (Bottoms & Accessories)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {bottoms.map(bottom => renderItemCard(bottom, false))}
            </div>
            {bottoms.length === 0 && <p className="text-sm text-gray-400 py-4">尚無下裝資料</p>}
          </div>
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
