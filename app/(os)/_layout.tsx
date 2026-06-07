import { Stack } from 'expo-router';

export default function OSLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="appstore" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
