import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const shouldShowIosInstallHint = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return isIosDevice && !isStandalone;
};

export function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosHint, setShowIosHint] = useState(shouldShowIosInstallHint);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const { t } = useTranslation();

  const {
    offlineReady: [, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r: ServiceWorkerRegistration | undefined) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error: Error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
      setShowIosHint(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
    setShowIosHint(false);
  };

  if (!showPrompt && !showIosHint && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-[var(--color-brand-cream)] rounded-2xl shadow-xl border border-[var(--color-brand-stone)] p-4 z-50 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h3 className="font-bold text-[var(--color-brand-espresso)] mb-1">
            {needRefresh ? t('pwa.updateAvailable') : t('pwa.installTitle')}
          </h3>
          <p className="text-sm text-[var(--color-brand-espresso)]/60 mb-3">
            {needRefresh 
              ? t('pwa.updateDesc') 
              : showIosHint
              ? t('pwa.installIosDesc')
              : t('pwa.installDesc')}
          </p>
          {showIosHint && !needRefresh && (
            <p className="mb-3 rounded-xl bg-[var(--color-brand-sand)] px-3 py-2 text-xs font-bold text-[var(--color-brand-espresso)]/70">
              {t('pwa.installIosSteps')}
            </p>
          )}
          
          <div className="flex space-x-2">
            {needRefresh ? (
              <button 
                onClick={() => updateServiceWorker(true)}
                className="bg-[var(--color-brand-espresso)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[var(--color-brand-espresso)] transition-colors"
              >
                {t('pwa.btnUpdate')}
              </button>
            ) : showPrompt ? (
              <button 
                onClick={handleInstallClick}
                className="flex items-center space-x-1 bg-[var(--color-brand-terracotta)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[var(--color-brand-terracotta-hover)] transition-colors"
              >
                <Download size={16} />
                <span>{t('pwa.btnInstall')}</span>
              </button>
            ) : null}
            
            <button 
              onClick={close}
              className="bg-[var(--color-brand-stone)] text-[var(--color-brand-espresso)] px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-colors"
            >
              {t('pwa.btnClose')}
            </button>
          </div>
        </div>
        <button onClick={close} className="text-[var(--color-brand-espresso)]/40 hover:text-[var(--color-brand-espresso)]/80">
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
