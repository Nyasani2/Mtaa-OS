import { Stack } from 'expo-router';

export default function MTaxiLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="request" />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="history" />
      <Stack.Screen name="schedule" />
    </Stack>
  );
}
