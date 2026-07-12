import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IdentityProvider } from '@/lib/auth/identity-provider';
import { OSShellProvider } from '@/lib/shell/os-shell-provider';
import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { hasPin } from '@/lib/security/pin-engine';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } },
});

function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { user, initialized, isLoading } = useAuthStore();
  const [pinSet, setPinSet] = useState<boolean | null>(null);
  const [bootComplete, setBootComplete] = useState(false);

  // Initialize auth on mount
  useEffect(() => {
    let cancelled = false;
    useAuthStore.getState().initialize().then(() => {
      if (!cancelled) setBootComplete(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Check PIN state whenever user changes
  useEffect(() => {
    if (!user) {
      setPinSet(null);
      return;
    }
    hasPin().then(setPinSet);
  }, [user?.id]);

  // Route guards
  useEffect(() => {
    if (!bootComplete || isLoading) return;

    const inAuthGroup = segments[0] === 'auth' || segments[0] === '(auth)';
    const inOsGroup = segments[0] === '(os)' || segments[0] === 'os';
    const inPinScreen = segments.some((s: string) => s.includes('pin'));

    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
      return;
    }

    if (user && inAuthGroup) {
      if (pinSet === false) {
        router.replace('/auth/set-pin');
      } else if (pinSet === true) {
        router.replace('/(os)');
      }
      return;
    }

    if (user && pinSet === false && !inPinScreen) {
      router.replace('/auth/set-pin');
      return;
    }

    if (user && pinSet === true && !inOsGroup && !inAuthGroup && !inPinScreen) {
      router.replace('/(os)');
    }
  }, [bootComplete, isLoading, user, pinSet, segments, router]);

  if (!bootComplete || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0f' }}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={{ color: '#9ca3af', marginTop: 16 }}>Booting MTAA OS...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <IdentityProvider>
        <OSShellProvider>
          <AuthGate>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(os)" />
              <Stack.Screen name="(boda)" />
              <Stack.Screen name="(civic)" />
              <Stack.Screen name="(commerce)" />
              <Stack.Screen name="(communication)" />
              <Stack.Screen name="(education)" />
              <Stack.Screen name="(finance)" />
              <Stack.Screen name="(local)" />
              <Stack.Screen name="(media)" />
              <Stack.Screen name="(mtaxi)" />
              <Stack.Screen name="(mtruck)" />
              <Stack.Screen name="(productivity)" />
              <Stack.Screen name="(social)" />
              <Stack.Screen name="(system)" />
              <Stack.Screen name="(transport)" />
              <Stack.Screen name="(tribes)" />
              <Stack.Screen name="(utility)" />
              <Stack.Screen name="(work)" />
              <Stack.Screen name="(business)" />
              <Stack.Screen name="auth" />
              <Stack.Screen name="os" />
              <Stack.Screen name="regulatory" />
            </Stack>
          </AuthGate>
        </OSShellProvider>
      </IdentityProvider>
    </QueryClientProvider>
  );
}
