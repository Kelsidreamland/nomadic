import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import { db } from '../db';
import { Calendar, CheckCircle2, ChevronRight, Mail, Map, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';

interface OnboardingProps {
  onComplete: () => void;
  onManualSkip: () => void;
}

export const Onboarding = ({ onComplete, onManualSkip }: OnboardingProps) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const { t } = useTranslation();

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsSyncing(true);
      try {
        // Store access token for manual sync later
        await db.user_configs.put({ id: '1', gmailToken: tokenResponse.access_token, geminiApiKey: '', useLocalAi: false, adPreferences: '' });
        alert('授權成功！你可以在 Dashboard 點擊「同步航班」按鈕來抓取 Gmail/Calendar 的航班資訊。');
        onComplete();
      } catch (error) {
        console.error("Failed to store authorization:", error);
        const message = error instanceof Error ? error.message : String(error);
        alert(`授權失敗: ${message}`);
      } finally {
        setIsSyncing(false);
      }
    },
    scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.readonly',
    onError: (errorResponse: any) => {
      console.error('Login Failed', errorResponse);
      if (errorResponse?.error === 'redirect_uri_mismatch') {
        alert(t('onboarding.errorMismatch'));
      } else {
        alert(t('onboarding.errorGeneral'));
      }
    }
  });

  return (
    <div className="fixed inset-0 bg-[var(--color-brand-sand)] z-50 overflow-y-auto animate-fade-in flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto w-full px-6 py-12 flex flex-col justify-center">
        
        <div className="text-center space-y-4 mb-16">
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-[var(--color-brand-espresso)]">
            {t('onboarding.title')} <span className="text-[var(--color-brand-olive)] font-light block md:inline text-3xl md:text-6xl mt-2 md:mt-0 font-sans">{t('onboarding.subtitle')}</span>
          </h1>
          <p className="text-xl text-[var(--color-brand-espresso)]/60 max-w-2xl mx-auto font-medium">
            {t('onboarding.description')}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Feature 1: Auto Sync */}
          <div className="bg-[var(--color-brand-cream)] rounded-3xl p-8 border border-[var(--color-brand-stone)] hover:border-[var(--color-brand-terracotta)] transition-colors">
            <div className="w-12 h-12 bg-[var(--color-brand-terracotta)] text-white rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-brand-espresso)] mb-3">{t('onboarding.feature1Title')}</h3>
            <p className="text-[var(--color-brand-espresso)]/60 mb-6">
              {t('onboarding.feature1Desc')}
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]">
                <CheckCircle2 size={16} className="text-[var(--color-brand-terracotta)]" /> <span>{t('onboarding.feature1Point1')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]">
                <CheckCircle2 size={16} className="text-[var(--color-brand-terracotta)]" /> <span>{t('onboarding.feature1Point2')}</span>
              </div>
            </div>
          </div>

          {/* Feature 2: Manual Control */}
          <div className="bg-[var(--color-brand-cream)] rounded-3xl p-8 border border-[var(--color-brand-stone)] hover:border-[var(--color-brand-olive)] transition-colors">
            <div className="w-12 h-12 bg-[var(--color-brand-olive)] text-white rounded-2xl flex items-center justify-center mb-6">
              <Map size={24} />
            </div>
            <h3 className="text-xl font-bold text-[var(--color-brand-espresso)] mb-3">{t('onboarding.feature2Title')}</h3>
            <p className="text-[var(--color-brand-espresso)]/60 mb-6">
              {t('onboarding.feature2Desc')}
            </p>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]/80">
                <CheckCircle2 size={16} className="text-[var(--color-brand-olive)]" /> <span>{t('onboarding.feature2Point1')}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm font-bold text-[var(--color-brand-espresso)]/80">
                <CheckCircle2 size={16} className="text-[var(--color-brand-olive)]" /> <span>{t('onboarding.feature2Point2')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-xl mx-auto w-full space-y-4">
          <button
            onClick={() => login()}
            disabled={isSyncing}
            className={clsx(
              "w-full py-5 px-6 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 transition-all transform hover:scale-[1.02]",
              isSyncing ? "bg-[var(--color-brand-stone)] text-[var(--color-brand-espresso)]/50" : "bg-[var(--color-brand-terracotta)] text-white shadow-xl hover:shadow-2xl hover:bg-[var(--color-brand-terracotta-hover)]"
            )}
          >
            {isSyncing ? (
              <span>{t('onboarding.syncing')}</span>
            ) : (
              <>
                <Calendar size={20} />
                <Mail size={20} />
                <span>{t('onboarding.btnAuth')}</span>
              </>
            )}
          </button>
          
          <button
            onClick={onManualSkip}
            className="w-full py-5 px-6 rounded-2xl font-bold text-lg text-[var(--color-brand-espresso)]/60 bg-[var(--color-brand-cream)] border-2 border-[var(--color-brand-stone)] hover:border-[var(--color-brand-olive)] hover:text-[var(--color-brand-espresso)] transition-all flex items-center justify-center space-x-2"
          >
            <span>{t('onboarding.btnSkip')}</span>
            <ChevronRight size={20} />
          </button>
        </div>

      </div>
    </div>
  );
};
