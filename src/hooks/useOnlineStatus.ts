import { useState, useEffect, useCallback } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Clear the "was offline" flag after a delay
      setTimeout(() => setWasOffline(false), 3000);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const checkOnline = useCallback(async (): Promise<boolean> => {
    if (!navigator.onLine) return false;
    // Double-check with a fetch
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      await fetch('https://www.google.com/favicon.ico', {
        mode: 'no-cors',
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return true;
    } catch {
      return false;
    }
  }, []);

  return { isOnline, wasOffline, checkOnline };
};
