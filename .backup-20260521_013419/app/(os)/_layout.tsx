// app/(os)/_layout.tsx
import { Stack } from 'expo-router';
import { BootGate } from '@/lib/kernel/runtime/BootGate';

export default function OSLayout() {
  return (
    <BootGate>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="health" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="appstore" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
      </Stack>
    </BootGate>
  );
}
