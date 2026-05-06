import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Item } from '../db';
import { v4 as uuidv4 } from 'uuid';
import { Info, TrendingUp, Shirt } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { getOutfitEligibleItems } from '../services/outfitEligibility';

export const Outfits = () => {
  const { t } = useTranslation();
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const matches = useLiveQuery(() => db.outfit_matches.toArray()) || [];

  const clothingItems = getOutfitEligibleItems(items);
  const tops = clothingItems.filter(i => ['上衣', '內搭', '外套', '連身裙'].includes(i.subCategory || ''));
  const bottoms = clothingItems.filter(i => ['下裝', '鞋子', '配飾'].includes(i.subCategory || ''));

  const [selectedTopId, setSelectedTopId] = useState<string | null>(null);

  const getMatchCount = (itemId: string, isTop: boolean) => {
    return matches.filter(m => isTop ? m.topItemId === itemId : m.bottomItemId === itemId).length;
  };

  const handleTopClick = (id: string) => {
    if (selectedTopId === id) setSelectedTopId(null);
    else setSelectedTopId(id);
  };

  const handleBottomClick = (bottomId: string) => {
    if (!selectedTopId) return;
    const exists = matches.find(m => m.topItemId === selectedTopId && m.bottomItemId === bottomId);
    if (exists) {
      db.outfit_matches.delete(exists.id);
    } else {
      db.outfit_matches.add({
        id: uuidv4(),
        topItemId: selectedTopId,
        bottomItemId: bottomId,
        createdAt: Date.now()
      });
    }
  };

  const renderVersatilityBadge = (count: number) => {
    if (count === 0) return <span className="bg-[var(--color-brand-stone)]/60 text-[var(--color-brand-espresso)]/60 px-2 py-0.5 rounded-full text-[10px] font-bold">{t('outfits.versatility0')}</span>;
    if (count >= 3) return <span className="bg-[var(--color-brand-olive)]/15 text-[var(--color-brand-espresso)] px-2 py-0.5 rounded-full text-[10px] font-bold">{t('outfits.versatilityHigh', { count })}</span>;
    return <span className="bg-[var(--color-brand-terracotta)]/10 text-[var(--color-brand-terracotta)] px-2 py-0.5 rounded-full text-[10px] font-bold">{t('outfits.versatilityNormal', { count })}</span>;
  };

  const renderItemCard = (item: Item, isTop: boolean = false) => {
    const isSelected = selectedTopId === item.id;
    const matchCount = getMatchCount(item.id, isTop);

    let cardStyle = "border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] hover:border-[var(--color-brand-terracotta)]/40 hover:shadow-sm";

    if (isTop) {
      if (isSelected) {
        cardStyle = "border-[var(--color-brand-espresso)] bg-[var(--color-brand-sand)] shadow-md ring-2 ring-[var(--color-brand-espresso)] ring-offset-2";
      } else if (selectedTopId) {
        cardStyle = "border-[var(--color-brand-stone)] bg-[var(--color-brand-cream)] opacity-50 grayscale-[50%]";
      }
    } else {
      if (selectedTopId) {
        const isMatched = matches.some(m => m.topItemId === selectedTopId && m.bottomItemId === item.id);
        if (isMatched) {
          cardStyle = "border-[var(--color-brand-terracotta)] bg-[var(--color-brand-terracotta)]/10 shadow-md ring-2 ring-[var(--color-brand-terracotta)]/50 ring-offset-1";
        } else {
          cardStyle = "border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)] opacity-60 hover:opacity-100 hover:border-[var(--color-brand-terracotta)] border-dashed border-2";
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
            <img src={item.image} alt={item.name} className="max-h-full max-w-full rounded-lg object-contain drop-shadow-sm" />
          </div>
        )}
        <div className="font-bold text-[var(--color-brand-espresso)] text-sm truncate w-full mt-auto">{item.name}</div>
        <div className="text-[10px] text-[var(--color-brand-espresso)]/40 mt-1">{item.subCategory}</div>
      </div>
    );
  };

  const allRankedItems = clothingItems
    .map(item => ({
      item,
      count: matches.filter(m => m.topItemId === item.id || m.bottomItemId === item.id).length
    }))
    .sort((a, b) => b.count - a.count);

  const mostVersatile = allRankedItems.slice(0, 3);
  const leastVersatile = allRankedItems.filter(r => r.count <= 1).slice(-3).reverse();

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[var(--color-brand-espresso)]">{t('outfits.title')}</h2>
          <p className="text-sm text-[var(--color-brand-espresso)]/60 font-medium mt-1">{t('outfits.subtitle')}</p>
        </div>
      </div>

      {clothingItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--color-brand-cream)] p-4 rounded-2xl border border-[var(--color-brand-stone)] text-center">
            <div className="text-2xl font-black text-[var(--color-brand-terracotta)]">{clothingItems.length}</div>
            <div className="text-xs text-[var(--color-brand-espresso)]/40 mt-1">{t('items.title')}</div>
          </div>
          <div className="bg-[var(--color-brand-cream)] p-4 rounded-2xl border border-[var(--color-brand-stone)] text-center">
            <div className="text-2xl font-black text-[var(--color-brand-terracotta)]">{matches.length}</div>
            <div className="text-xs text-[var(--color-brand-espresso)]/40 mt-1">{t('outfits.setsCreated')}</div>
          </div>
          <div className="bg-[var(--color-brand-cream)] p-4 rounded-2xl border border-[var(--color-brand-stone)] text-center">
            <div className="text-2xl font-black text-[var(--color-brand-terracotta)]">{clothingItems.length > 0 ? (matches.length / clothingItems.length).toFixed(1) : '0'}</div>
            <div className="text-xs text-[var(--color-brand-espresso)]/40 mt-1">{t('outfits.avgPerItem')}</div>
          </div>
          <div className="bg-[var(--color-brand-cream)] p-4 rounded-2xl border border-[var(--color-brand-stone)] text-center">
            <div className="text-2xl font-black text-[var(--color-brand-olive)]">{allRankedItems.filter(r => r.count >= 3).length}</div>
            <div className="text-xs text-[var(--color-brand-espresso)]/40 mt-1">{t('outfits.universal')}</div>
          </div>
        </div>
      )}

      {allRankedItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mostVersatile.length > 0 && (
            <div className="bg-[var(--color-brand-cream)] p-5 rounded-3xl border border-[var(--color-brand-stone)]">
              <h3 className="font-bold text-sm text-[var(--color-brand-olive)] flex items-center gap-2 mb-3">
                <TrendingUp size={16} />
                <span>{t('outfits.topVersatile')}</span>
              </h3>
              <div className="space-y-2">
                {mostVersatile.map(({ item, count }) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-8 h-8 object-contain bg-white rounded-lg" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Shirt size={14} className="text-[var(--color-brand-espresso)]/30" />
                        </div>
                      )}
                      <span className="text-sm font-bold text-[var(--color-brand-espresso)]">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--color-brand-espresso)] bg-[var(--color-brand-olive)]/15 px-2 py-0.5 rounded-full">{t('outfits.versatilityHigh', { count })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {leastVersatile.length > 0 && (
            <div className="bg-[var(--color-brand-cream)] p-5 rounded-3xl border border-[var(--color-brand-stone)]">
              <h3 className="font-bold text-sm text-[var(--color-brand-terracotta)] flex items-center gap-2 mb-3">
                <Info size={16} />
                <span>{t('outfits.lowVersatile')}</span>
              </h3>
              <div className="space-y-2">
                {leastVersatile.map(({ item, count }) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-8 h-8 object-contain bg-white rounded-lg" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Shirt size={14} className="text-[var(--color-brand-espresso)]/30" />
                        </div>
                      )}
                      <span className="text-sm font-bold text-[var(--color-brand-espresso)]">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--color-brand-terracotta)] bg-[var(--color-brand-terracotta)]/10 px-2 py-0.5 rounded-full">{t('outfits.versatilityNormal', { count })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tops.length === 0 && bottoms.length === 0 ? (
        <div className="text-center py-20 text-[var(--color-brand-espresso)]/40 bg-[var(--color-brand-cream)] rounded-3xl border border-dashed border-[var(--color-brand-stone)]">
          <Info size={48} className="mx-auto mb-4 opacity-50" />
          <p>{t('outfits.empty')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="bg-[var(--color-brand-cream)] rounded-3xl shadow-sm border border-[var(--color-brand-stone)] p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[var(--color-brand-espresso)]">{t('outfits.tops')}</h3>
              {selectedTopId && (
                <button
                  onClick={() => setSelectedTopId(null)}
                  className="text-xs font-bold text-[var(--color-brand-terracotta)] bg-[var(--color-brand-terracotta)]/10 px-3 py-1 rounded-full hover:bg-[var(--color-brand-stone)]"
                >
                  {t('outfits.cancelSelection')}
                </button>
              )}
            </div>
            {tops.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {tops.map(top => renderItemCard(top, true))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-brand-espresso)]/40 py-4">{t('outfits.noTops')}</p>
            )}
          </div>

          <div className="bg-[var(--color-brand-cream)] rounded-3xl shadow-sm border border-[var(--color-brand-stone)] p-6 relative">
            {!selectedTopId && tops.length > 0 && (
              <div className="absolute inset-0 z-20 bg-[var(--color-brand-cream)]/60 backdrop-blur-[1px] rounded-3xl flex items-center justify-center">
                <div className="bg-[var(--color-brand-espresso)] text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
                  {t('outfits.selectTopFirst')}
                </div>
              </div>
            )}
            <h3 className="font-bold text-[var(--color-brand-espresso)] mb-4">{t('outfits.bottoms')}</h3>
            {bottoms.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {bottoms.map(bottom => renderItemCard(bottom, false))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-brand-espresso)]/40 py-4">{t('outfits.noBottoms')}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
