import { Stack } from 'expo-router';

export default function MTruckLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dispatch/index" />
      <Stack.Screen name="tracking/index" />
      <Stack.Screen name="fleet/index" />
      <Stack.Screen name="marketplace/index" />
      <Stack.Screen name="loads/index" />
      <Stack.Screen name="routes/index" />
      <Stack.Screen name="analytics/index" />
      <Stack.Screen name="drivers/index" />
      <Stack.Screen name="maintenance/index" />
      <Stack.Screen name="fuel/index" />
      <Stack.Screen name="documents/index" />
      <Stack.Screen name="settings/index" />
    </Stack>
  );
}
