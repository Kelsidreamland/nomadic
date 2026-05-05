import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner = () => {
  const { isOnline, wasOffline } = useOnlineStatus();

  if (isOnline && !wasOffline) return null;

  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-brand-terracotta)] text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center space-x-2 animate-fade-in">
        <WifiOff size={16} />
        <span>網路連線已中斷 — 部分功能可能無法使用</span>
      </div>
    );
  }

  // Was offline, now back online
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-brand-olive)] text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center space-x-2 animate-fade-in">
      <Wifi size={16} />
      <span>網路已恢復連線</span>
    </div>
  );
};
