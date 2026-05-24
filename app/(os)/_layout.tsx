/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  OS LAYOUT — Operating System Shell                          ║
 * ║  Wrapped in OSGate — blocks access until auth + PIN pass     ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

import { Stack } from "expo-router";
import { OSGate } from "@/lib/auth/os-gate";

export default function OsLayout() {
  return (
    <OSGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="launcher" />
        <Stack.Screen name="appstore" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="developer" />
      </Stack>
    </OSGate>
  );
}
