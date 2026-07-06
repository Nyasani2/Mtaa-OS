import { Stack } from 'expo-router';

export default function AmbulanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dispatch/index" />
      <Stack.Screen name="handover/index" />
      <Stack.Screen name="dispatches/index" />
      <Stack.Screen name="location/index" />
      <Stack.Screen name="log/index" />
    </Stack>
  );
}
