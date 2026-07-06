import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? true);
    });
    return () => unsubscribe();
  }, []);

  const retry = async (retryFn: () => Promise<void>) => {
    setIsRetrying(true);
    try {
      await retryFn();
    } finally {
      setIsRetrying(false);
    }
  };

  return { isOnline, isRetrying, retry };
}
