/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  OS GATE — PURE UI CONSUMER ONLY                             ║
 * ║  MTAA_OS_V10 — NO internal state machine                     ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * RULES:
 * 1. NO boot logic
 * 2. NO duplicate auth checks
 * 3. NO router logic (use Expo Router middleware)
 * 4. NO useEffect state machine
 * 5. ONLY consumes osShell state
 * 6. Renders based on osShell.phase ONLY
 */

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useOSShell } from "@/lib/shell/os-shell";
import { LockScreen } from "./lock-screen";
import { useEffect } from "react";

export function OSGate({ children }: { children: React.ReactNode }) {
  const { phase, user } = useOSShell();
  const router = useRouter();
  const segments = useSegments();

  // Redirect when no session — ONLY if not already on auth route
  useEffect(() => {
    if (phase === "no_session") {
      const isAuthRoute = segments[0] === "auth" || segments[0] === "(auth)";
      if (!isAuthRoute) {
        router.replace("/auth/login");
      }
    }
  }, [phase, segments, router]);

  // Render based on phase ONLY
  if (phase === "booting") {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (phase === "no_session") {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (phase === "locked") {
    return (
      <LockScreen
        onUnlock={() => {}}
        userEmail={user?.email || undefined}
      />
    );
  }

  if (phase === "safe_mode") {
    return (
      <View style={styles.safeModeScreen}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  // unlocked
  return <>{children}</>;
}

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
  safeModeScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
});
