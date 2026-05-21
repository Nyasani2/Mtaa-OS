// app/(os)/settings/_layout.tsx
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="tx-alerts" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="payment-methods" />
      <Stack.Screen name="help" />
      <Stack.Screen name="bug-report" />
      <Stack.Screen name="about" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="terms" />
    </Stack>
  );
}
