import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { pinEngine } from '@/lib/security/pin-engine';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export const PinSetupGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();
  const [checking, setChecking] = useState(true);
  const [hasPinSet, setHasPinSet] = useState(false);

  useEffect(() => {
    const checkPin = async () => {
      let exists = false;
      if (user?.id) {
        exists = await pinEngine.hasPin(user.id);
        setHasPinSet(exists);
      }
      setChecking(false);
      // Redirect to set-pin if authenticated but no PIN (and not already there)
      if (!exists && segments[0] !== '(auth)' && segments[1] !== ('set-pin' as any)) {
        router.replace('/set-pin' as any);
      }
    };
    checkPin();
  }, [user?.id, JSON.stringify(segments)]);  

  if (isLoading || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return <>{children}</>;
};
