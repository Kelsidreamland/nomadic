import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserConfig, type Flight } from '../db';
import { Bot, Mail, ShieldCheck, Target, Plane, Upload, Sparkles, Save, Key, CheckCircle, Smartphone } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { checkLocalAIAvailability, analyzeTicketWithAI } from '../services/ai';
import { syncGmailFlights } from '../services/google';
import { useTranslation } from 'react-i18next';

export const Settings = () => {
  const { t } = useTranslation();
  const configs = useLiveQuery(() => db.user_configs.toArray()) || [];
  const flights = useLiveQuery(() => db.flights.toArray()) || [];
  const config = configs[0];
  const upcomingFlight = flights[0]; // Simplified for now, just edit the first flight

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [apiKey, setApiKey] = useState('');
  const [useLocalAi, setUseLocalAi] = useState(false);
  const [hasLocalAi, setHasLocalAi] = useState(false);
  const [saved, setSaved] = useState(false);
  
  const [flightData, setFlightData] = useState<Partial<Flight>>({
    airline: '',
    destination: '',
    departureDate: '',
    checkedAllowance: 20,
    carryOnAllowance: 7,
    personalAllowance: 0
  });
  const [isAiParsing, setIsAiParsing] = useState(false);

  useEffect(() => {
    setHasLocalAi(checkLocalAIAvailability());
    
    const loadConfig = async () => {
      const configs = await db.user_configs.toArray();
      if (configs.length > 0) {
        setApiKey(configs[0].geminiApiKey || '');
        setUseLocalAi(configs[0].useLocalAi || false);
      }
      
      const savedFlights = await db.flights.toArray();
      if (savedFlights.length > 0) {
        setFlightData(savedFlights[0]);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async () => {
    // Save AI Config
    const configs = await db.user_configs.toArray();
    if (configs.length > 0) {
      await db.user_configs.update(configs[0].id, {
        geminiApiKey: apiKey,
        useLocalAi
      });
    } else {
      await db.user_configs.add({
        id: uuidv4(),
        geminiApiKey: apiKey,
        useLocalAi,
        adPreferences: 'all'
      });
    }
    
    // Save Flight Data
    if (flightData.airline && flightData.departureDate) {
      const savedFlights = await db.flights.toArray();
      if (savedFlights.length > 0) {
        await db.flights.update(savedFlights[0].id, flightData);
      } else {
        await db.flights.add({
          ...flightData,
          id: uuidv4()
        } as Flight);
      }
    }
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTicketUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setIsAiParsing(true);
      try {
        const parsedData = await analyzeTicketWithAI(base64);
        setFlightData(prev => ({
          ...prev,
          ...parsedData,
          // ensure numbers
          checkedAllowance: Number(parsedData.checkedAllowance) || prev.checkedAllowance,
          carryOnAllowance: Number(parsedData.carryOnAllowance) || prev.carryOnAllowance,
          personalAllowance: Number(parsedData.personalAllowance) || prev.personalAllowance
        }));
      } catch (error) {
        alert('解析機票失敗，請確認 API Key 設定正確或手動填寫。');
      }
      setIsAiParsing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
          <Bot size={28} />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#2C3E50]">{t('settings.title')}</h2>
          <p className="text-gray-500 mt-1 font-medium">{t('settings.subtitle')}</p>
        </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-4">
          <label className="flex items-center space-x-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
            <Key size={16} />
            <span>{t('settings.geminiKey')}</span>
          </label>
          <p className="text-xs text-gray-500">
            {t('settings.geminiDesc')}
          </p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t('settings.geminiPlaceholder')}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border-none focus:ring-2 focus:ring-[#2C3E50] transition-all outline-none font-mono"
          />
        </div>

        {hasLocalAi && (
          <div className="flex items-center justify-between p-4 bg-green-50/50 rounded-2xl border border-green-100">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                <Smartphone size={20} />
              </div>
              <div>
                <h4 className="font-bold text-green-800 text-sm">{t('settings.localAi')}</h4>
                <p className="text-xs text-green-600 mt-0.5">{t('settings.localAiDesc')}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={useLocalAi}
                onChange={() => setUseLocalAi(!useLocalAi)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
          </div>
        )}

        <button
          onClick={handleSave}
          className="w-full py-4 bg-[#2C3E50] hover:bg-[#1A252F] text-white rounded-xl font-bold tracking-widest uppercase transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-gray-200"
        >
          {saved ? (
            <>
              <CheckCircle size={20} />
              <span>{t('settings.saved')}</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>{t('settings.save')}</span>
            </>
          )}
        </button>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6 mt-8">
        <div className="flex items-center justify-between border-b border-gray-50 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-2xl">
              <Plane size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#2C3E50]">{t('settings.flightSync')}</h3>
              <p className="text-xs text-gray-500">{t('settings.flightSyncDesc')}</p>
            </div>
          </div>
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isAiParsing}
            className="flex items-center space-x-2 bg-orange-50 hover:bg-orange-100 text-orange-600 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 shrink-0"
          >
            {isAiParsing ? (
              <Sparkles size={16} className="animate-spin" />
            ) : (
              <Upload size={16} />
            )}
            <span className="hidden sm:inline">{isAiParsing ? t('settings.uploadTicketAi') : t('settings.uploadTicket')}</span>
          </button>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleTicketUpload} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">{t('settings.flightAirline')}</label>
            <input 
              type="text" 
              value={flightData.airline || ''}
              onChange={e => setFlightData({...flightData, airline: e.target.value})}
              placeholder={t('settings.flightAirlinePlaceholder')}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-500">{t('settings.flightDate')}</label>
            <input 
              type="date" 
              value={flightData.departureDate || ''}
              onChange={e => setFlightData({...flightData, departureDate: e.target.value})}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50] text-gray-500"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-bold text-gray-500">{t('settings.flightDestination')}</label>
            <input 
              type="text" 
              value={flightData.destination || ''}
              onChange={e => setFlightData({...flightData, destination: e.target.value})}
              placeholder={t('settings.flightDestinationPlaceholder')}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-2 border-b border-gray-50 pb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">{t('settings.allowanceChecked')}</label>
            <input 
              type="number" 
              value={flightData.checkedAllowance || ''}
              onChange={e => setFlightData({...flightData, checkedAllowance: parseFloat(e.target.value)})}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">{t('settings.allowanceCarryOn')}</label>
            <input 
              type="number" 
              value={flightData.carryOnAllowance || ''}
              onChange={e => setFlightData({...flightData, carryOnAllowance: parseFloat(e.target.value)})}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500">{t('settings.allowancePersonal')}</label>
            <input 
              type="number" 
              value={flightData.personalAllowance || ''}
              onChange={e => setFlightData({...flightData, personalAllowance: parseFloat(e.target.value)})}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-[#2C3E50]"
            />
          </div>
        </div>
        
        <div className="pt-2">
          <h4 className="font-bold text-sm text-[#2C3E50] mb-2">{t('settings.syncOptions')}</h4>
          <p className="text-xs text-gray-500 mb-4">{t('settings.syncDesc')}</p>
          <button 
            onClick={async () => {
              await syncGmailFlights();
              alert(t('settings.syncSuccess'));
            }}
            className="w-full py-3 border-2 border-gray-200 hover:border-[#2C3E50] text-[#2C3E50] rounded-xl font-bold transition-colors flex items-center justify-center space-x-2"
          >
            <Mail size={18} />
            <span>{t('settings.syncButton')}</span>
          </button>
        </div>
        
        <button
          onClick={handleSave}
          className="w-full py-4 bg-[#2C3E50] hover:bg-[#1A252F] text-white rounded-xl font-bold tracking-widest uppercase transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-gray-200 mt-4"
        >
          {saved ? (
            <>
              <CheckCircle size={20} />
              <span>{t('settings.saved')}</span>
            </>
          ) : (
            <>
              <Save size={20} />
              <span>{t('settings.save')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
