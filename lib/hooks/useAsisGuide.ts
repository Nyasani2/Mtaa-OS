// @ts-nocheck
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define tips for each screen
const SCREEN_TIPS: Record<string, { title: string; message: string }[]> = {
  'Wallet': [
    { title: 'Welcome to MTAA Wallet', message: 'This is your secure digital wallet. You can send money, pay bills, and top up via M-Pesa.' },
    { title: 'Security First', message: 'All transactions require your PIN. Never share it with anyone, even ASIS.' }
  ],
  'MTaxi': [
    { title: 'Book a Ride', message: 'Enter your destination to see fare estimates. You can pay with Wallet, M-Pesa, or Cash.' }
  ],
  'Home': [
    { title: 'Your Command Centre', message: 'Swipe through categories to find apps. ASIS is always here to help if you get stuck.' }
  ]
};

export function useAsisGuide(screenName: string) {
  const { user } = useAuthStore();
  const [currentTip, setCurrentTip] = useState<any>(null);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (!user || !screenName) return;

    const checkFirstTime = async () => {
      const key = `asis_seen_${screenName}_${user.id}`;
      const seen = await AsyncStorage.getItem(key);
      
      if (!seen && SCREEN_TIPS[screenName]) {
        setCurrentTip(SCREEN_TIPS[screenName][0]);
      }
    };

    checkFirstTime();
  }, [user, screenName]);

  const handleNext = () => {
    const tips = SCREEN_TIPS[screenName] || [];
    if (tipIndex + 1 < tips.length) {
      setTipIndex(tipIndex + 1);
      setCurrentTip(tips[tipIndex + 1]);
    } else {
      handleDismiss();
    }
  };

  const handleDismiss = async () => {
    const key = `asis_seen_${screenName}_${user?.id}`;
    await AsyncStorage.setItem(key, 'true');
    setCurrentTip(null);
  };

  return {
    visible: !!currentTip,
    title: currentTip?.title || '',
    message: currentTip?.message || '',
    onNext: handleNext,
    onDismiss: handleDismiss
  };
}
