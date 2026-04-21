import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { generateSmartInsights } from '../services/ai';
import { getGeoIpLocation } from '../services/google';
import { Bot, Plane, ShoppingBag, AlertTriangle, Package, ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

export const Dashboard = () => {
  const { t } = useTranslation();
  const luggages = useLiveQuery(() => db.luggages.toArray()) || [];
  const items = useLiveQuery(() => db.items.toArray()) || [];
  const flights = useLiveQuery(() => db.flights.toArray()) || [];
  const configs = useLiveQuery(() => db.user_configs.toArray()) || [];
  
  const [insights, setInsights] = useState<any>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [location, setLocation] = useState('Global');

  const upcomingFlight = flights.sort((a, b) => new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime())[0];
  
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

  const totalWeight = checkedWeight + carryOnWeight + personalWeight;

  useEffect(() => {
    getGeoIpLocation().then(loc => setLocation(loc));
  }, []);

  useEffect(() => {
    const fetchInsights = async () => {
      if (configs.length > 0 && (configs[0].geminiApiKey || configs[0].useLocalAi)) {
        setIsThinking(true);
        const contextData = {
          totalWeight,
          checkedWeight,
          carryOnWeight,
          personalWeight,
          upcomingFlight,
          itemsCount: items.length,
          location,
          luggages
        };
        const result = await generateSmartInsights(contextData);
        setInsights(result);
        setIsThinking(false);
      }
    };
    
    // Only fetch if we have data to avoid empty insights
    if (luggages.length > 0 || items.length > 0) {
      fetchInsights();
    }
  }, [luggages.length, items.length, flights.length, location, configs]);

  const daysToFlight = upcomingFlight 
    ? Math.ceil((new Date(upcomingFlight.departureDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black text-[#2C3E50] tracking-wider">{t('app.dashboard')}</h2>
          <p className="text-gray-500 font-medium mt-1">{t('dashboard.greeting')} {location}</p>
        </div>
      </div>

      {upcomingFlight ? (
        <div className="bg-[#2C3E50] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
          <div className="absolute -right-6 -bottom-10 opacity-10">
            <Plane size={160} />
          </div>
          <div className="relative z-10 flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-blue-200 tracking-widest uppercase mb-1">{t('dashboard.nextFlight')}</p>
              <h3 className="text-2xl font-black">{upcomingFlight.destination}</h3>
              <p className="text-blue-100 mt-2">{upcomingFlight.airline} • {t('dashboard.allowance')} {upcomingFlight.checkedAllowance}kg</p>
            </div>
            <div className="text-center bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/20">
              <div className="text-4xl font-black">{daysToFlight}</div>
              <div className="text-xs font-bold uppercase tracking-widest mt-1">{t('dashboard.days')}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 bg-gray-50 rounded-2xl">
            <Plane size={24} className="text-gray-400" />
          </div>
          <div>
            <h3 className="font-bold text-[#2C3E50]">{t('dashboard.noFlights')}</h3>
            <p className="text-sm text-gray-500">{t('dashboard.noFlightsSub')}</p>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="font-bold text-lg text-[#2C3E50]">{t('dashboard.weights')}</h3>
        
        {/* Checked Luggage */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">{t('dashboard.checked')}</p>
              <h4 className="text-xl font-black text-[#2C3E50]">{checkedWeight.toFixed(1)} <span className="text-sm text-gray-400">kg</span></h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{t('dashboard.allowance')}</p>
              <p className="text-sm font-bold text-[#2C3E50]">{upcomingFlight ? upcomingFlight.checkedAllowance : '--'} kg</p>
            </div>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={clsx(
                "h-full transition-all duration-1000", 
                upcomingFlight && checkedWeight > upcomingFlight.checkedAllowance ? 'bg-red-500' : 'bg-[#2C3E50]'
              )}
              style={{ width: `${upcomingFlight && upcomingFlight.checkedAllowance > 0 ? Math.min((checkedWeight / upcomingFlight.checkedAllowance) * 100, 100) : 0}%` }}
            />
          </div>
        </div>

        {/* Carry On Luggage */}
        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-1">{t('dashboard.carryOn')}</p>
              <h4 className="text-xl font-black text-[#2C3E50]">{carryOnWeight.toFixed(1)} <span className="text-sm text-gray-400">kg</span></h4>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase">{t('dashboard.allowance')}</p>
              <p className="text-sm font-bold text-[#2C3E50]">{upcomingFlight ? upcomingFlight.carryOnAllowance : '--'} kg</p>
            </div>
          </div>
          <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={clsx(
                "h-full transition-all duration-1000", 
                upcomingFlight && carryOnWeight > upcomingFlight.carryOnAllowance ? 'bg-red-500' : 'bg-blue-400'
              )}
              style={{ width: `${upcomingFlight && upcomingFlight.carryOnAllowance > 0 ? Math.min((carryOnWeight / upcomingFlight.carryOnAllowance) * 100, 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-black text-xl text-[#2C3E50] flex items-center space-x-2">
          <Bot size={24} className="text-blue-500" />
          <span>{t('dashboard.aiAssistant')}</span>
        </h3>

        {isThinking ? (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex justify-center items-center space-x-2">
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            <span className="ml-4 font-bold text-gray-400 text-sm">{t('dashboard.analyzing')}</span>
          </div>
        ) : insights ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Warnings */}
            {insights.warnings && insights.warnings.length > 0 && (
              <div className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-3">
                <div className="flex items-center space-x-2 text-red-600 font-bold">
                  <AlertTriangle size={18} />
                  <span>{t('dashboard.warnings')}</span>
                </div>
                <ul className="space-y-2 text-sm text-red-800">
                  {insights.warnings.map((w: string, i: number) => <li key={i}>• {w}</li>)}
                </ul>
              </div>
            )}

            {/* Restock */}
            {insights.restock && insights.restock.length > 0 && (
              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 space-y-3">
                <div className="flex items-center space-x-2 text-orange-600 font-bold">
                  <Package size={18} />
                  <span>{t('dashboard.restock')}</span>
                </div>
                <ul className="space-y-2 text-sm text-orange-800">
                  {insights.restock.map((r: string, i: number) => <li key={i}>• {r}</li>)}
                </ul>
              </div>
            )}

            {/* Ads / Dropshipping */}
            {insights.ads && insights.ads.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100 md:col-span-2 space-y-4">
                <div className="flex items-center space-x-2 text-indigo-600 font-bold">
                  <ShoppingBag size={18} />
                  <span>{t('dashboard.ads')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {insights.ads.map((ad: any, i: number) => (
                    <a key={i} href={ad.link} target="_blank" rel="noreferrer" className="block bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition-shadow group">
                      <h4 className="font-bold text-[#2C3E50] group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                        <span>{ad.name}</span>
                        <ExternalLink size={14} className="text-gray-300" />
                      </h4>
                      <p className="text-xs text-gray-500 mt-2 leading-relaxed">{ad.reason}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center text-gray-400 text-sm">
            {t('dashboard.noAiConfig')}
          </div>
        )}
      </div>
    </div>
  );
};
