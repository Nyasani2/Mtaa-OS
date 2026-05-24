/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  LAYER 3: OS GATE — Navigation Guard                         ║
 * ║  MTAA_OS_V10 — The ONLY gate controlling (os) routes       ║
 * ╚══════════════════════════════════════════════════════════════╝
 *
 * RULES:
 * 1. This is the ONLY component that decides if (os) routes render
 * 2. Checks: (a) Supabase session exists, (b) PIN verified (if enabled)
 * 3. Blocks rendering until both checks pass
 * 4. Shows loading spinner during boot, login redirect if no session,
 *    lock screen if PIN needed
 * 5. No business logic — delegates to IdentityEngine + PinEngine
 */

import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { identityEngine, useIdentity } from "./identity";
import { pinEngine, usePinVerified } from "@/lib/security/pin-engine";
import { LockScreen } from "./lock-screen";

// ─── Boot States ───────────────────────────────────────────

type BootPhase =
  | "loading"      // Checking Supabase session
  | "no_session"   // No session → redirect to login
  | "locked"       // Session exists, PIN enabled but not verified
  | "unlocked";    // Session + PIN verified → render children

// ─── OS Gate Component ───────────────────────────────────────

export function OSGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segments = useSegments();
  const identity = useIdentity();
  const pin = usePinVerified();

  const [phase, setPhase] = useState<BootPhase>("loading");
  const [bootComplete, setBootComplete] = useState(false);

  // ─── Boot Sequence ───────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const runBoot = async () => {
      // Step 1: Ensure identity engine is booted
      if (identity.isLoading) {
        // Wait for identity boot to complete
        return;
      }

      if (!mounted) return;

      // Step 2: Check session
      if (!identity.session || !identity.user) {
        setPhase("no_session");
        setBootComplete(true);
        return;
      }

      // Step 3: Check PIN
      const pinEnabled = await pinEngine.isEnabled();
      if (!mounted) return;

      if (pinEnabled && !pinEngine.isVerified()) {
        setPhase("locked");
        setBootComplete(true);
        return;
      }

      // All checks passed
      setPhase("unlocked");
      setBootComplete(true);
    };

    runBoot();
  }, [identity.isLoading, identity.session, identity.user]);

  // ─── Redirect when no session ────────────────────────────
  useEffect(() => {
    if (phase === "no_session" && bootComplete) {
      // Only redirect if we're not already in auth routes
      const isAuthRoute = segments[0] === "auth";
      if (!isAuthRoute) {
        router.replace("/auth/login");
      }
    }
  }, [phase, bootComplete, segments, router]);

  // ─── Render ──────────────────────────────────────────────

  // Still booting — show spinner (blocks everything)
  if (!bootComplete || identity.isLoading) {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // No session — don't render children, redirect handled above
  if (phase === "no_session") {
    return (
      <View style={styles.bootScreen}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Locked — show lock screen
  if (phase === "locked") {
    return (
      <LockScreen
        onUnlock={() => setPhase("unlocked")}
        userEmail={identity.user?.email || undefined}
      />
    );
  }

  // Unlocked — render the OS
  return <>{children}</>;
}

// ─── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  bootScreen: {
    flex: 1,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
  },
});
