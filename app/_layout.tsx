import React from 'react';
import { Stack } from 'expo-router';
import { ThemeProvider } from '@/lib/theme/theme-provider';
import { ToastProvider } from '@/lib/toast/toast-provider';
import { ASISProvider } from '@/lib/kernel/ai/asis-provider';
import { IdentityProvider } from '@/lib/auth/identity';
import { OSShellProvider } from '@/lib/shell/os-shell-provider';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ASISProvider>
          <IdentityProvider>
            <OSShellProvider>
              <Stack screenOptions={{ headerShown: false }}>
                {/* Splash + Auth */}
                <Stack.Screen name="index" />
                <Stack.Screen name="auth" />

                {/* OS Shell — Home, AppStore, Settings, Wallet */}
                <Stack.Screen name="(os)" />

                {/* All App Route Groups — MUST be registered at root */}
                <Stack.Screen name="(wallet)" />
                <Stack.Screen name="(civic)" />
                <Stack.Screen name="(health)" />
                <Stack.Screen name="(commerce)" />
                <Stack.Screen name="(education)" />
                <Stack.Screen name="(work)" />
                <Stack.Screen name="(social)" />
                <Stack.Screen name="(media)" />
                <Stack.Screen name="(communication)" />
                <Stack.Screen name="(utility)" />
                <Stack.Screen name="(system)" />
                <Stack.Screen name="(local)" />
                <Stack.Screen name="(productivity)" />
                <Stack.Screen name="(finance)" />
                <Stack.Screen name="(business)" />
                <Stack.Screen name="(boda)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="(settings)" />
                <Stack.Screen name="(mtaxi)" />
                <Stack.Screen name="(mtruck)" />
                <Stack.Screen name="(transport)" />
              </Stack>
            </OSShellProvider>
          </IdentityProvider>
        </ASISProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
