import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppState } from "react-native";
import * as Linking from "expo-linking";

import { handleAuthDeepLink } from "@/lib/auth/deep-link-auth";
import { identityEngine } from "@/lib/auth/identity";
import { pinEngine } from "@/lib/security/pin-engine";
import { osShell } from "@/lib/shell/os-shell";

export default function RootLayout() {
  const [booted, setBooted] = useState(false);

  // ─────────────────────────────────────────────
  // DEEP LINK HANDLER (FIXED)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const handleUrl = (url?: string | null) => {
      if (!url) return;
      handleAuthDeepLink(url);
    };

    const sub = Linking.addEventListener("url", ({ url }) => {
      handleUrl(url);
    });

    Linking.getInitialURL().then((url) => {
      handleUrl(url);
    });

    return () => sub.remove();
  }, []);

  // ─────────────────────────────────────────────
  // BOOT SEQUENCE
  // ─────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    let cleanup: (() => void) | null = null;

    const boot = async () => {
      try {
        await identityEngine.boot();
        if (!mounted) return;

        cleanup = identityEngine.startListener();
        if (!mounted) return;

        await osShell.init();
        if (!mounted) return;

        setBooted(true);
      } catch (e) {
        console.log("[BOOT ERROR]", e);
      }
    };

    boot();

    return () => {
      mounted = false;
      if (cleanup) cleanup();
    };
  }, []);

  // ─────────────────────────────────────────────
  // APP STATE (PIN LOCK)
  // ─────────────────────────────────────────────
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      pinEngine.onAppStateChange(state);
    });

    return () => sub.remove();
  }, []);

  if (!booted) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(os)" />
          <Stack.Screen name="auth" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
