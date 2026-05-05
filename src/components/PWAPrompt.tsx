import { useState, useEffect, useRef } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, RefreshCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { APP_VERSION, fetchRemoteAppVersion, shouldPromptForAppUpdate } from '../services/appVersion';

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

const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

export function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIosHint, setShowIosHint] = useState(shouldShowIosInstallHint);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState('');
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const { t } = useTranslation();

  const {
    offlineReady: [, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swScriptUrl: string, r: ServiceWorkerRegistration | undefined) {
      swRegistrationRef.current = r ?? null;
      r?.update().catch(error => {
        console.log('SW update check failed', error);
      });
      console.log('SW Registered: ', r);
    },
    onRegisterError(error: Error) {
      console.log('SW registration error', error);
    },
  });
  const remoteUpdateAvailable = shouldPromptForAppUpdate(APP_VERSION, remoteVersion);
  const hasAppUpdate = needRefresh || remoteUpdateAvailable;

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

  useEffect(() => {
    const checkForUpdate = async () => {
      if (document.visibilityState === 'visible') {
        swRegistrationRef.current?.update().catch(error => {
          console.log('SW update check failed', error);
        });

        const latestVersion = await fetchRemoteAppVersion().catch(error => {
          console.log('Version check failed', error);
          return '';
        });

        if (shouldPromptForAppUpdate(APP_VERSION, latestVersion)) {
          setRemoteVersion(latestVersion);
        }
      }
    };

    window.addEventListener('focus', checkForUpdate);
    document.addEventListener('visibilitychange', checkForUpdate);
    checkForUpdate();
    const intervalId = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);

    return () => {
      window.removeEventListener('focus', checkForUpdate);
      document.removeEventListener('visibilitychange', checkForUpdate);
      window.clearInterval(intervalId);
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

  const handleUpdateClick = async () => {
    setIsUpdating(true);
    const nextVersion = remoteVersion || APP_VERSION;
    try {
      await updateServiceWorker(true);
    } catch (error) {
      console.log('SW update failed', error);
    }

    try {
      const registrations = await navigator.serviceWorker?.getRegistrations?.() || [];
      await Promise.all(registrations.map(async registration => {
        await registration.update().catch(() => undefined);
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        await registration.unregister().catch(() => false);
      }));

      if ('caches' in window) {
        const cacheNames = await window.caches.keys();
        await Promise.all(cacheNames.map(cacheName => window.caches.delete(cacheName)));
      }
    } catch (error) {
      console.log('Forced app refresh cleanup failed', error);
    }

    const url = new URL(window.location.href);
    url.searchParams.set('appVersion', nextVersion);
    url.searchParams.set('refresh', String(Date.now()));
    window.location.replace(url.toString());
  };

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setShowPrompt(false);
    setShowIosHint(false);
  };

  if (!showPrompt && !showIosHint && !hasAppUpdate) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-[var(--color-brand-cream)] rounded-2xl shadow-xl border border-[var(--color-brand-stone)] p-4 z-50 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h3 className="font-bold text-[var(--color-brand-espresso)] mb-1">
            {hasAppUpdate ? t('pwa.updateAvailable') : t('pwa.installTitle')}
          </h3>
          <p className="text-sm text-[var(--color-brand-espresso)]/60 mb-3">
            {hasAppUpdate 
              ? t('pwa.updateDesc') 
              : showIosHint
              ? t('pwa.installIosDesc')
              : t('pwa.installDesc')}
          </p>
          {hasAppUpdate && (
            <p className="mb-3 rounded-xl bg-[var(--color-brand-sand)] px-3 py-2 text-xs font-bold text-[var(--color-brand-espresso)]/70">
              {t('pwa.versionStatus', { current: APP_VERSION, latest: remoteVersion || APP_VERSION })}
            </p>
          )}
          {showIosHint && !hasAppUpdate && (
            <p className="mb-3 rounded-xl bg-[var(--color-brand-sand)] px-3 py-2 text-xs font-bold text-[var(--color-brand-espresso)]/70">
              {t('pwa.installIosSteps')}
            </p>
          )}
          
          <div className="flex space-x-2">
            {hasAppUpdate ? (
              <button 
                onClick={handleUpdateClick}
                disabled={isUpdating}
                className="flex items-center space-x-1 rounded-xl bg-[var(--color-brand-espresso)] px-4 py-2 text-sm font-bold text-white shadow-md transition-colors hover:bg-black disabled:cursor-wait disabled:opacity-70"
              >
                <RefreshCw size={16} className={isUpdating ? 'animate-spin' : ''} />
                <span>{isUpdating ? t('pwa.btnUpdating') : t('pwa.btnUpdate')}</span>
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
