import { useState, useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Download, X } from 'lucide-react';

export function PWAPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ', r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI to notify the user they can add to home screen
      setShowPrompt(true);
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
  };

  if (!showPrompt && !needRefresh && !offlineReady) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-[var(--color-brand-cream)] rounded-2xl shadow-xl border border-[var(--color-brand-stone)] p-4 z-50 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h3 className="font-bold text-[var(--color-brand-espresso)] mb-1">
            {needRefresh ? 'Update Available' : offlineReady ? 'Ready for Offline Use' : 'Install Nomadic : my luggage'}
          </h3>
          <p className="text-sm text-[var(--color-brand-espresso)]/60 mb-3">
            {needRefresh 
              ? 'A new version is available. Click to update.' 
              : offlineReady
              ? 'The app is cached and ready to be used offline.'
              : 'Add Nomadic to your home screen for a seamless, full-screen experience and offline packing.'}
          </p>
          
          <div className="flex space-x-2">
            {needRefresh ? (
              <button 
                onClick={() => updateServiceWorker(true)}
                className="bg-[var(--color-brand-espresso)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[var(--color-brand-espresso)] transition-colors"
              >
                立即更新
              </button>
            ) : showPrompt ? (
              <button 
                onClick={handleInstallClick}
                className="flex items-center space-x-1 bg-[var(--color-brand-terracotta)] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[var(--color-brand-terracotta-hover)] transition-colors"
              >
                <Download size={16} />
                <span>安裝到桌面</span>
              </button>
            ) : null}
            
            <button 
              onClick={close}
              className="bg-[var(--color-brand-stone)] text-[var(--color-brand-espresso)] px-4 py-2 rounded-xl text-sm font-bold hover:opacity-80 transition-colors"
            >
              關閉
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
