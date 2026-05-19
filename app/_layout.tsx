import { Stack, usePathname } from "expo-router";
import { useEffect } from "react";

import { useOSShell } from "@/lib/shell/use-os-shell";
import { bootstrapAuth, subscribeAuth } from "@/lib/auth/auth-bridge";
import { routeGuard } from "@/lib/kernel/route-guard";

/**
 * ==========================================
 * MTAA ROOT OS LAYOUT (KERNEL CONTROLLED)
 * SINGLE SOURCE OF TRUTH FOR NAVIGATION
 * ==========================================
 */

export default function RootLayout() {
  const { isBooting, isLocked } = useOSShell();
  const pathname = usePathname();

  useEffect(() => {
    bootstrapAuth();
    subscribeAuth();
    routeGuard.init();
  }, []);

  useEffect(() => {
    // 🧠 HARD KERNEL ENFORCEMENT
    routeGuard.enforce(pathname);
  }, [pathname]);

  // 🔵 BOOT STATE → LOADING OS
  if (isBooting) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(os)/clock" />
      </Stack>
    );
  }

  // 🔒 LOCKED STATE → AUTH ONLY
  if (isLocked) {
    return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
      </Stack>
    );
  }

  // 🟢 UNLOCKED STATE → HOME IS ENTRY POINT
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(os)/home" />
      <Stack.Screen name="(os)" />
    </Stack>
  );
}
