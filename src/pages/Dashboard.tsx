import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Flight } from '../db';
import { generateSmartInsights } from '../services/ai';
import { getGeoIpLocation, syncGmailFlights } from '../services/google';
import { Bot, Plane, ShoppingBag, AlertTriangle, Mail, Plus, Save, X, ArrowRight, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import { useGoogleLogin } from '@react-oauth/google';
import { Onboarding } from '../components/Onboarding';

export const Dashboard = () => {
  const { t } = useTranslation();
  const luggages = useLiveQuery(() => db.luggages.toArray()) || [];
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const flights = useLiveQuery(() => db.flights.toArray()) || [];
  
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(() => {
    return localStorage.getItem('nomadic_onboarded') !== 'true';
  });
  
  const [insights, setInsights] = useState<any>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [location, setLocation] = useState('Global');
  const [isSyncing, setIsSyncing] = useState(false);
  const [now] = useState(() => Date.now());
  const [plannerStep, setPlannerStep] = useState<'context' | 'ai-plan' | 'checklist'>('context');
  const [packedItemIds, setPackedItemIds] = useState<string[]>([]);
  const [removedItemIds, setRemovedItemIds] = useState<string[]>([]);
  const [flightData, setFlightData] = useState<Partial<Flight>>({
    airline: '',
    destination: '',
    departureDate: '',
    checkedAllowance: 20,
    carryOnAllowance: 7,
    personalAllowance: 0
  });

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSyncing(true);
      try {
        await syncGmailFlights(tokenResponse.access_token);
      } catch (error) {
        console.error("Failed to sync flights:", error);
        alert("Sync failed. Check console for details.");
      } finally {
        setIsSyncing(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
    onError: (errorResponse: any) => {
      console.error('Login Failed', errorResponse);
      if (errorResponse?.error === 'redirect_uri_mismatch') {
        alert("Google 登入失敗：重定向 URI 不匹配 (redirect_uri_mismatch)。\n\n這通常是因為您目前在預覽沙盒網域執行。請將目前的 URL 加入 Google Cloud Console 的「已授權的 JavaScript 來源」與「已授權的重新導向 URI」，或在本地端 (localhost:5173) 進行測試。");
      } else {
        alert("Google 登入失敗");
      }
    }
  });

  const handleManualAdd = () => {
    if (upcomingFlight) {
      setFlightData(upcomingFlight);
    } else {
      setFlightData({
        airline: '',
        destination: '',
        departureDate: new Date().toISOString().split('T')[0],
        checkedAllowance: 20,
        carryOnAllowance: 7,
        personalAllowance: 0
      });
    }
    setShowFlightForm(true);
  };

  const [showFlightForm, setShowFlightForm] = useState(false);

  const upcomingFlight = flights.sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())[0];

  const handleSaveFlight = async () => {
    if (!flightData.destination || !flightData.departureDate) return;
    
    if (upcomingFlight) {
      await db.flights.update(upcomingFlight.id, flightData);
    } else {
      await db.flights.add({
        ...flightData,
        id: crypto.randomUUID()
      } as Flight);
    }
    setShowFlightForm(false);
  };

  // Calculate weights by luggage type
  const checkedWeight = luggages.filter(l => l.type === '托运').reduce((sum, l) => {
    return sum + (l.weightHistory?.length > 0 ? l.weightHistory[l.weightHistory.length - 1].weight : 0);
  }, 0);
  
  const carryOnWeight = luggages.filter(l => l.type === '手提').reduce((sum, l) => {
    return sum + (l.weightHistory?.length > 0 ? l.weightHistory[l.weightHistory.length - 1].weight : 0);
  }, 0);

  const personalWeight = luggages.filter(l => l.type === '随身').reduce((sum, l) => {
    return sum + (l.weightHistory?.length > 0 ? l.weightHistory[l.weightHistory.length - 1].weight : 0);
  }, 0);

  useEffect(() => {
    getGeoIpLocation().then(loc => setLocation(loc));
  }, []);

  const startAiPlan = async () => {
    setPlannerStep('ai-plan');
    setIsThinking(true);
    try {
      const contextData = {
        upcomingFlight,
        items,
        location,
        luggages
      };
      const result = await generateSmartInsights(contextData);
      setInsights(result);
    } catch (error: any) {
      alert(error.message || 'AI 規劃失敗');
      setPlannerStep('context'); // Revert step on error
    } finally {
      setIsThinking(false);
    }
  };

  const startChecklist = () => {
    setPlannerStep('checklist');
  };

  const toggleItemPacked = (id: string) => {
    if (packedItemIds.includes(id)) {
      setPackedItemIds(packedItemIds.filter(pid => pid !== id));
    } else {
      setPackedItemIds([...packedItemIds, id]);
    }
  };

  const toggleItemRemoved = (id: string) => {
    if (removedItemIds.includes(id)) {
      setRemovedItemIds(removedItemIds.filter(rid => rid !== id));
    } else {
      setRemovedItemIds([...removedItemIds, id]);
    }
  };

  const [newItemName, setNewItemName] = useState('');

  const handleAddTodoItem = async (name: string) => {
    if (!name.trim()) return;
    const newItem = {
      id: crypto.randomUUID(),
      name: name.trim(),
      category: '其他' as const,
      season: '通用' as const,
      condition: '新' as const,
      isDiscardable: true,
      luggageId: luggages[0]?.id || 'todo-list',
      createdAt: Date.now()
    };
    await db.items.add(newItem);
    setNewItemName('');
  };

  const smartSuggestions = ['SIM卡/網卡', '萬國充', '護照', '行動電源', '常備藥', '牙刷/牙膏'];

  const daysToFlight = upcomingFlight 
    ? Math.ceil((new Date(upcomingFlight.departureDate).getTime() - now) / (1000 * 60 * 60 * 24))
    : null;

  if (isFirstTimeUser) {
    return (
      <Onboarding 
        onComplete={() => {
          localStorage.setItem('nomadic_onboarded', 'true');
          setIsFirstTimeUser(false);
        }}
        onManualSkip={() => {
          localStorage.setItem('nomadic_onboarded', 'true');
          setIsFirstTimeUser(false);
          handleManualAdd();
        }}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black text-[var(--color-brand-espresso)] tracking-wider">{t('app.dashboard')}</h2>
          <p className="text-[var(--color-brand-espresso)]/60 font-medium mt-1">{t('dashboard.greeting')} {location}</p>
        </div>
      </div>

      {showFlightForm && (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg text-[var(--color-brand-espresso)]">航班資訊</h3>
            <button onClick={() => setShowFlightForm(false)} className="text-[var(--color-brand-espresso)]/40 hover:text-[var(--color-brand-espresso)]/80">
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">目的地</label>
              <input type="text" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.destination} onChange={e => setFlightData({...flightData, destination: e.target.value})} placeholder="例如：東京" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">航空公司</label>
              <input type="text" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.airline} onChange={e => setFlightData({...flightData, airline: e.target.value})} placeholder="例如：長榮航空" />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">出發日期</label>
              <input type="date" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.departureDate} onChange={e => setFlightData({...flightData, departureDate: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">托運限額 (kg)</label>
              <input type="number" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.checkedAllowance} onChange={e => setFlightData({...flightData, checkedAllowance: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">手提限額 (kg)</label>
              <input type="number" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.carryOnAllowance} onChange={e => setFlightData({...flightData, carryOnAllowance: Number(e.target.value)})} />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-brand-espresso)]/60 uppercase tracking-wider mb-1">隨身限額 (kg)</label>
              <input type="number" className="w-full bg-[var(--color-brand-sand)] border-0 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)]" value={flightData.personalAllowance} onChange={e => setFlightData({...flightData, personalAllowance: Number(e.target.value)})} />
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleSaveFlight} className="flex items-center space-x-2 bg-[var(--color-brand-espresso)] text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-black transition-colors">
              <Save size={16} />
              <span>儲存航班</span>
            </button>
          </div>
        </div>
      )}

      {/* Planner Step 1: Context */}
      {plannerStep === 'context' && (
        <div className="space-y-6">
          {/* Flight Card (Existing Code) */}
          {upcomingFlight ? (
            <div className="bg-[var(--color-brand-espresso)] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
              <div className="absolute -right-6 -bottom-10 opacity-10">
                <Plane size={160} />
              </div>
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <p className="text-sm font-bold text-blue-200 tracking-widest uppercase">{t('dashboard.nextFlight')}</p>
                    <button onClick={handleManualAdd} className="text-blue-200 hover:text-white transition-colors bg-[var(--color-brand-cream)]/10 px-2 py-1 rounded text-xs">
                      {t('settings.editFlight', '編輯')}
                    </button>
                  </div>
                  <h3 className="text-2xl font-black">{upcomingFlight.destination}</h3>
                  <p className="text-[var(--color-brand-stone)] mt-2">{upcomingFlight.airline} • {t('dashboard.allowance')} {upcomingFlight.checkedAllowance}kg</p>
                </div>
                <div className="text-center bg-[var(--color-brand-cream)]/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
                  <div className="text-4xl font-black">{daysToFlight}</div>
                  <div className="text-xs font-bold uppercase tracking-widest mt-1">{t('dashboard.days')}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-[var(--color-brand-sand)] rounded-2xl">
                  <Plane size={24} className="text-[var(--color-brand-espresso)]/40" />
                </div>
                <div>
                  <h3 className="font-bold text-[var(--color-brand-espresso)]">{t('dashboard.noFlights')}</h3>
                  <p className="text-sm text-[var(--color-brand-espresso)]/60">{t('dashboard.noFlightsSub')}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => login()} 
                  disabled={isSyncing}
                  className="flex items-center justify-center space-x-2 bg-[var(--color-brand-terracotta)] hover:bg-[var(--color-brand-terracotta-hover)] text-white px-4 py-2 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-50 text-sm"
                >
                  <Mail size={16} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Flights'}</span>
                </button>
                <button 
                  onClick={handleManualAdd}
                  className="flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-[var(--color-brand-espresso)]/80 px-4 py-2 rounded-xl font-bold transition-all shadow-sm text-sm"
                >
                  <Plus size={16} />
                  <span>Add Manual</span>
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={startAiPlan}
              className="w-full py-5 bg-[var(--color-brand-espresso)] hover:bg-[var(--color-brand-espresso)] text-white rounded-3xl font-bold tracking-widest shadow-lg shadow-[var(--color-brand-espresso)]/20 transition-all transform hover:scale-[1.02] flex justify-center items-center space-x-2"
            >
              <Bot size={20} className="text-[var(--color-brand-olive)]" />
              <span>讓 AI 幫我做減法 (膠囊衣櫥推薦)</span>
            </button>
            <button 
              onClick={startChecklist}
              className="w-full py-5 bg-[var(--color-brand-cream)] border-2 border-[var(--color-brand-stone)] hover:border-[var(--color-brand-terracotta)] text-[var(--color-brand-espresso)] rounded-3xl font-bold tracking-widest shadow-sm transition-all flex justify-center items-center space-x-2"
            >
              <CheckCircle2 size={20} className="text-[var(--color-brand-espresso)]/40" />
              <span>我自己手動打包 (Checklist)</span>
            </button>
          </div>
        </div>
      )}

      {upcomingFlight && (
        <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] space-y-6">
          <h3 className="font-bold text-lg text-[var(--color-brand-espresso)]">{t('dashboard.allowanceTitle')}</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-[var(--color-brand-espresso)]/40 tracking-widest uppercase mb-1">{t('dashboard.checked')}</p>
                <h4 className="text-xl font-black text-[var(--color-brand-espresso)]">{checkedWeight.toFixed(1)} <span className="text-sm text-[var(--color-brand-espresso)]/40">kg</span></h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[var(--color-brand-espresso)]/40 uppercase">{t('dashboard.limit')}</p>
                <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{upcomingFlight?.checkedAllowance || 0} kg</p>
              </div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={clsx("h-full transition-all duration-1000", checkedWeight > (upcomingFlight?.checkedAllowance || 0) ? 'bg-red-500' : 'bg-[var(--color-brand-espresso)]')} 
                style={{ width: `${Math.min(100, (checkedWeight / (upcomingFlight?.checkedAllowance || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs font-bold text-[var(--color-brand-espresso)]/40 tracking-widest uppercase mb-1">{t('dashboard.carryOn')}</p>
                <h4 className="text-xl font-black text-[var(--color-brand-espresso)]">{carryOnWeight.toFixed(1)} <span className="text-sm text-[var(--color-brand-espresso)]/40">kg</span></h4>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-[var(--color-brand-espresso)]/40 uppercase">{t('dashboard.limit')}</p>
                <p className="text-sm font-bold text-[var(--color-brand-espresso)]">{upcomingFlight?.carryOnAllowance || 0} kg</p>
              </div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div 
                className={clsx("h-full transition-all duration-1000", carryOnWeight > (upcomingFlight?.carryOnAllowance || 0) ? 'bg-red-500' : 'bg-[var(--color-brand-olive)]')} 
                style={{ width: `${Math.min(100, (carryOnWeight / (upcomingFlight?.carryOnAllowance || 1)) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Planner Step 2: AI Plan Generation */}
      {plannerStep === 'ai-plan' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center space-x-3 mb-6">
            <button onClick={() => setPlannerStep('context')} className="text-[var(--color-brand-espresso)]/40 hover:text-[var(--color-brand-espresso)]/80">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-black text-[var(--color-brand-espresso)]">AI 智能打包建議</h2>
          </div>

          {isThinking ? (
            <div className="bg-[var(--color-brand-cream)] p-12 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] flex flex-col justify-center items-center space-y-6">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-[var(--color-brand-olive)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-3 h-3 bg-[var(--color-brand-olive)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-3 h-3 bg-[var(--color-brand-olive)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="font-bold text-[var(--color-brand-espresso)]/60 text-center">
                正在分析行程、天氣與您的衣櫥庫存...<br/>
                <span className="text-xs font-normal text-[var(--color-brand-espresso)]/40 mt-2 block">這可能需要幾秒鐘的時間</span>
              </p>
            </div>
          ) : insights ? (
            <div className="space-y-6">
              {/* 行李分析 */}
              {insights.optimization && (
                <div className={clsx(
                  "p-6 rounded-3xl border",
                  insights.optimization.weight_status === 'Safe' ? "bg-green-50 border-green-100 text-green-800" :
                  insights.optimization.weight_status === 'Overweight' ? "bg-red-50 border-red-100 text-red-800" :
                  "bg-orange-50 border-orange-100 text-orange-800"
                )}>
                  <div className="flex items-center space-x-2 font-bold mb-2">
                    {insights.optimization.weight_status === 'Safe' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    <span>行李重量狀態：{insights.optimization.weight_status}</span>
                  </div>
                  <p className="text-sm font-medium">{insights.optimization.luggage_analysis}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 建議捨棄 */}
                {insights.optimization?.remove_suggestions && insights.optimization.remove_suggestions.length > 0 && (
                  <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl border border-[var(--color-brand-stone)] shadow-sm">
                    <h3 className="font-bold text-[var(--color-brand-espresso)] mb-4 flex items-center text-red-500">
                      <X size={18} className="mr-2" /> 建議捨棄 (減輕負重)
                    </h3>
                    <ul className="space-y-4">
                      {insights.optimization.remove_suggestions.map((item: any, i: number) => {
                        const originalItem = items.find(inv => inv.id === item.item_id);
                        return (
                          <li key={i} className="flex items-start space-x-3 text-sm">
                            <div className="mt-0.5 text-[var(--color-brand-espresso)]/40 shrink-0"><Circle size={16} /></div>
                            <div>
                              <span className="font-bold text-[var(--color-brand-espresso)]">{originalItem?.name || item.item_id}</span>
                              <p className="text-[var(--color-brand-espresso)]/60 text-xs mt-1">{item.reason}</p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* 備品建議 */}
                {insights.optimization?.packing_advice && insights.optimization.packing_advice.length > 0 && (
                  <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl border border-[var(--color-brand-stone)] shadow-sm">
                    <h3 className="font-bold text-[var(--color-brand-espresso)] mb-4 flex items-center text-[var(--color-brand-terracotta)]">
                      <ShoppingBag size={18} className="mr-2" /> 打包與備品建議
                    </h3>
                    <ul className="space-y-3">
                      {insights.optimization.packing_advice.map((advice: string, i: number) => (
                        <li key={i} className="flex items-start space-x-2 text-sm text-[var(--color-brand-espresso)]/80">
                          <span className="text-[var(--color-brand-olive)] font-bold">•</span>
                          <span>{advice}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <button 
                onClick={startChecklist}
                className="w-full py-4 bg-[var(--color-brand-terracotta)] hover:bg-[var(--color-brand-terracotta-hover)] text-white rounded-2xl font-bold tracking-widest shadow-md transition-colors flex justify-center items-center space-x-2"
              >
                <span>確認並進入打包清單</span>
                <ArrowRight size={20} />
              </button>
            </div>
          ) : (
            <div className="bg-[var(--color-brand-cream)] p-6 rounded-3xl shadow-sm border border-[var(--color-brand-stone)] text-center text-red-400 text-sm">
              AI 分析失敗，請確認 API Key 設定或稍後再試。
            </div>
          )}
        </div>
      )}

      {/* Planner Step 3: Checklist */}
      {plannerStep === 'checklist' && (
        <div className="space-y-6 animate-fade-in pb-20">
          <div className="flex items-center justify-between mb-6 sticky top-0 bg-[var(--color-brand-sand)]/90 backdrop-blur-md py-4 z-10">
            <div className="flex items-center space-x-3">
              <button onClick={() => setPlannerStep('context')} className="text-[var(--color-brand-espresso)]/40 hover:text-[var(--color-brand-espresso)]/80">
                <X size={24} />
              </button>
              <h2 className="text-2xl font-black text-[var(--color-brand-espresso)]">打包清單</h2>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-[var(--color-brand-espresso)]">{packedItemIds.length}</span>
              <span className="text-sm font-bold text-[var(--color-brand-espresso)]/40"> / {items.length - removedItemIds.length}</span>
            </div>
          </div>

          {/* Checkout/Discard Banner for removed items */}
          {removedItemIds.length > 0 && (
            <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-600">
                <Trash2 size={18} />
                <span className="font-bold text-sm">已捨棄 {removedItemIds.length} 件物品</span>
              </div>
              <button 
                onClick={async () => {
                  if (confirm(`確定要將這 ${removedItemIds.length} 件物品從物品庫中永久刪除嗎？`)) {
                    for (const id of removedItemIds) {
                      await db.items.delete(id);
                      // 也要刪除相關的穿搭紀錄
                      const relatedMatches = await db.outfit_matches.where('topItemId').equals(id).or('bottomItemId').equals(id).toArray();
                      for (const match of relatedMatches) {
                        await db.outfit_matches.delete(match.id);
                      }
                    }
                    setRemovedItemIds([]);
                  }
                }}
                className="text-xs font-bold bg-red-600 text-white px-3 py-1.5 rounded-full hover:bg-red-700 transition-colors"
              >
                永久刪除
              </button>
            </div>
          )}

          {/* Checklist UI */}
          <div className="bg-[var(--color-brand-cream)] rounded-3xl shadow-sm border border-[var(--color-brand-stone)] overflow-hidden mb-6">
            <div className="p-4 border-b border-[var(--color-brand-stone)] bg-[var(--color-brand-sand)]/50">
              <div className="flex space-x-2 mb-3">
                <input 
                  type="text" 
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTodoItem(newItemName)}
                  placeholder="新增待辦物品..."
                  className="flex-1 bg-[var(--color-brand-cream)] border border-[var(--color-brand-stone)] rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--color-brand-terracotta)] text-sm"
                />
                <button 
                  onClick={() => handleAddTodoItem(newItemName)}
                  disabled={!newItemName.trim()}
                  className="bg-[var(--color-brand-espresso)] text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-black transition-colors"
                >
                  新增
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {smartSuggestions.map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => handleAddTodoItem(suggestion)}
                    className="flex items-center space-x-1 text-xs font-medium text-[var(--color-brand-espresso)]/60 bg-[var(--color-brand-cream)] border border-[var(--color-brand-stone)] px-3 py-1.5 rounded-full hover:border-[var(--color-brand-terracotta)] hover:text-[var(--color-brand-terracotta)] transition-colors shadow-sm"
                  >
                    <Plus size={12} />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
            {items.filter(item => !removedItemIds.includes(item.id)).map(item => {
              const isPacked = packedItemIds.includes(item.id);
              return (
                <div 
                  key={item.id} 
                  className={clsx(
                    "flex items-center justify-between p-4 border-b border-gray-50 transition-colors hover:bg-[var(--color-brand-sand)]",
                    isPacked ? "opacity-50 bg-[var(--color-brand-sand)]/50" : ""
                  )}
                >
                  <div 
                    className="flex items-center space-x-4 flex-1 cursor-pointer"
                    onClick={() => toggleItemPacked(item.id)}
                  >
                    <div className={clsx(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                      isPacked ? "bg-green-500 border-green-500" : "border-gray-300"
                    )}>
                      {isPacked && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                    <div>
                      <h4 className={clsx("font-bold", isPacked ? "line-through text-[var(--color-brand-espresso)]/40" : "text-[var(--color-brand-espresso)]")}>{item.name}</h4>
                      <p className="text-xs text-[var(--color-brand-espresso)]/40">{item.category} • {item.subCategory}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 ml-4">
                    {item.image && (
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg grayscale opacity-70" />
                    )}
                    {item.isDiscardable && !isPacked && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemRemoved(item.id);
                        }}
                        className="text-red-400 hover:text-red-600 p-2 rounded-full hover:bg-red-50 transition-colors"
                        title="捨棄此物品"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
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
