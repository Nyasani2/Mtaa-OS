/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  ROOT LAYOUT — App Entry Point                               ║
 * ║  MTAA_OS_V10 — Single boot authority, osShell initialization   ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * RULES:
 * 1. ONE supabase.auth.onAuthStateChange listener ONLY
 * 2. Boot identity engine on mount
 * 3. Initialize osShell (sole boot/lock authority)
 * 4. No auth state in Zustand — use identityEngine.subscribe
 * 5. Render (os) and auth routes — OSGate handles the guard
 * 6. AppState triggers PIN check on ACTIVE (foreground)
 */

import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { identityEngine } from "@/lib/auth/identity";
import { pinEngine } from "@/lib/security/pin-engine";
import { osShell } from "@/lib/shell/os-shell";
import { AppState } from "react-native";

export default function RootLayout() {
  const [booted, setBooted] = useState(false);

  // ─── BOOT SEQUENCE ───────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    let cleanupListener: (() => void) | null = null;

    const boot = async () => {
      // Step 1: Boot identity engine (check Supabase session)
      await identityEngine.boot();

      if (!mounted) return;

      // Step 2: Start the SINGLE auth state listener
      cleanupListener = identityEngine.startListener();

      if (!mounted) return;

      // Step 3: Initialize osShell (sole boot/lock authority)
      // This subscribes to identityEngine + pinEngine
      await osShell.init();

      if (!mounted) return;

      // Step 4: Mark boot complete — now we can render
      setBooted(true);
    };

    boot();

    return () => {
      mounted = false;
      if (cleanupListener) cleanupListener();
    };
  }, []);

  // ─── APP STATE LISTENER ──────────────────────────────────
  // FIX: Trigger on ACTIVE (foreground) to require PIN re-verify
  // Record timestamp on BACKGROUND for inactivity check
  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      async (nextAppState) => {
        await pinEngine.onAppStateChange(nextAppState);
      }
    );

    return () => subscription.remove();
  }, []);

  // ─── Render ──────────────────────────────────────────────
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
