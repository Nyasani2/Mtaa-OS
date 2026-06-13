import { Stack } from 'expo-router';

export default function CivicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="police/index" />
      <Stack.Screen name="courts/index" />
      <Stack.Screen name="prisons/index" />
      <Stack.Screen name="revenue/index" />
      <Stack.Screen name="treasury/index" />
      <Stack.Screen name="land/index" />
      <Stack.Screen name="health/index" />
      {/* NEW: Sub-module routes */}
      <Stack.Screen name="agriculture/index" />
      <Stack.Screen name="border/index" />
      <Stack.Screen name="customs/index" />
      <Stack.Screen name="immigration/index" />
      <Stack.Screen name="transport/index" />
    </Stack>
  );
}
