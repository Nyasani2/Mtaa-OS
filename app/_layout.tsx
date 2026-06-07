import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { IdentityProvider } from '@/lib/auth/identity-provider';
import { OSShellProvider } from '@/lib/shell/os-shell-provider';

export default function RootLayout() {
  return (
    <IdentityProvider>
      <OSShellProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(os)" />
          <Stack.Screen name="(boda)" />
          <Stack.Screen name="(mtaxi)" />
          <Stack.Screen name="auth" />
        </Stack>
      </OSShellProvider>
    </IdentityProvider>
  );
}
