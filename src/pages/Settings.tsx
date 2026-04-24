import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type UserConfig } from '../db';
import { Bot, ShieldCheck, Target, Sparkles, Save, CheckCircle, Smartphone } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { checkLocalAIAvailability } from '../services/ai';
import { useTranslation } from 'react-i18next';

export const Settings = () => {
  const { t } = useTranslation();
  const configs = useLiveQuery(() => db.user_configs.toArray()) || [];
  const config = configs[0];

  const [apiKey, setApiKey] = useState('');
  const [useLocalAi, setUseLocalAi] = useState(false);
  const [hasLocalAi, setHasLocalAi] = useState(false);
  const [saved, setSaved] = useState(false);
  
  useEffect(() => {
    setHasLocalAi(checkLocalAIAvailability());
    
    const loadConfig = async () => {
      const configs = await db.user_configs.toArray();
      if (configs.length > 0) {
        setApiKey(configs[0].geminiApiKey || '');
        setUseLocalAi(configs[0].useLocalAi || false);
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
    
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#2C3E50] tracking-wider">{t('app.settings')}</h2>
        <button 
          onClick={handleSave}
          className="flex items-center space-x-2 bg-[#2C3E50] text-white px-6 py-2 rounded-full font-bold shadow-md hover:bg-[#1A252F] transition-all"
        >
          {saved ? <CheckCircle size={18} className="text-green-400" /> : <Save size={18} />}
          <span>{saved ? 'Saved' : 'Save Config'}</span>
        </button>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="font-bold text-xl text-[#2C3E50] flex items-center space-x-2">
          <ShieldCheck size={20} className="text-green-500" />
          <span>{t('settings.aiConfig')}</span>
        </h3>
        
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
    </div>
  );
};
