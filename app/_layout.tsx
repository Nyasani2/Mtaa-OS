import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IdentityProvider } from '@/lib/auth/identity-provider';
import { OSShellProvider } from '@/lib/shell/os-shell-provider';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <IdentityProvider>
        <OSShellProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(os)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
          </Stack>
          <StatusBar style="auto" />
        </OSShellProvider>
      </IdentityProvider>
    </QueryClientProvider>
  );
}
