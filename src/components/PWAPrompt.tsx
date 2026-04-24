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
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="flex-1 pr-4">
          <h3 className="font-bold text-[#2C3E50] mb-1">
            {needRefresh ? '新版本已就緒' : offlineReady ? '已支援離線使用' : '安裝 Pack AI'}
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            {needRefresh 
              ? '我們發布了新功能，點擊更新以獲取最新版本。' 
              : offlineReady
              ? '應用程式已快取，您可以在沒有網路的情況下繼續使用。'
              : '將 Pack AI 加入主畫面，獲得全螢幕、無廣告的 App 體驗，並支援離線打包。'}
          </p>
          
          <div className="flex space-x-2">
            {needRefresh ? (
              <button 
                onClick={() => updateServiceWorker(true)}
                className="bg-[#2C3E50] text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-[#1A252F] transition-colors"
              >
                立即更新
              </button>
            ) : showPrompt ? (
              <button 
                onClick={handleInstallClick}
                className="flex items-center space-x-1 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                <span>安裝到桌面</span>
              </button>
            ) : null}
            
            <button 
              onClick={close}
              className="bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-200 transition-colors"
            >
              關閉
            </button>
          </div>
        </div>
        <button onClick={close} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
