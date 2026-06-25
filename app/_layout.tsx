import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IdentityProvider } from '@/lib/auth/identity-provider';
import { OSShellProvider } from '@/lib/shell/os-shell-provider';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } } });

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <IdentityProvider>
        <OSShellProvider>
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
        </OSShellProvider>
      </IdentityProvider>
    </QueryClientProvider>
  );
}
