import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IdentityProvider } from '@/lib/auth/identity-provider';
import { OSShellProvider, useOSShell } from '@/lib/shell/os-shell-provider';
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

  // Initialize auth
  useEffect(() => {
    let cancelled = false;
    useAuthStore.getState().initialize().then(() => {
      if (!cancelled) setBootComplete(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Check PIN state
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
    const inLockScreen = segments.some((s: string) => s.includes('lock'));
    const inPinScreen = segments.some((s: string) => s.includes('pin'));

    // No session → login
    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
      return;
    }

    // Session + on auth screen → redirect based on PIN
    if (user && inAuthGroup) {
      if (pinSet === false) {
        router.replace('/auth/set-pin');
      } else if (pinSet === true) {
        router.replace('/(os)');
      }
      return;
    }

    // Session + no PIN → force PIN setup
    if (user && pinSet === false && !inPinScreen) {
      router.replace('/auth/set-pin');
      return;
    }

    // Session + PIN set + not in OS → redirect to lock screen or home
    if (user && pinSet === true && !inOsGroup && !inAuthGroup && !inLockScreen && !inPinScreen) {
      router.replace('/(os)/lock-screen');
      return;
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

function LockGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const { isLocked, isPinSet } = useOSShell();

  useEffect(() => {
    const inLockScreen = segments.some((s: string) => s.includes('lock'));
    const inAuthGroup = segments[0] === 'auth';

    if (isPinSet && isLocked && !inLockScreen && !inAuthGroup) {
      router.replace('/(os)/lock-screen');
    }
  }, [isLocked, isPinSet, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <IdentityProvider>
        <OSShellProvider>
          <AuthGate>
            <LockGate>
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
            </LockGate>
          </AuthGate>
        </OSShellProvider>
      </IdentityProvider>
    </QueryClientProvider>
  );
}
