import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
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
      try {
        if (user?.id) {
          exists = await pinEngine.hasPin(user.id);
          setHasPinSet(exists);
        }
      } catch (error) {
        console.error("Error checking PIN (SecureStore may be unavailable):", error);
        exists = false; // Fail safe: assume no PIN if check fails
      } finally {
        setChecking(false);
      }

      // Redirect to set-pin if authenticated but no PIN (and not already on that screen)
      const currentRoute = segments.join('/');
      if (!exists && !currentRoute.includes('set-pin') && !currentRoute.includes('(auth)')) {
        router.replace('/(auth)/set-pin' as any);
      }
    };
    
    if (!isLoading) {
      checkPin();
    }
  }, [user?.id, isLoading, JSON.stringify(segments), router]);  

  if (isLoading || checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return <>{children}</>;
};
