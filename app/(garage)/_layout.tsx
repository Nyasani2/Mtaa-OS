import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function GarageLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="dashboard/index" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="appointments/index" />
        <Stack.Screen name="appointments/[id]/index" />
        <Stack.Screen name="diagnostics/index" />
        <Stack.Screen name="inventory/index" />
        <Stack.Screen name="fleet/index" />
        <Stack.Screen name="customer/index" />
      </Stack>
    </>
  );
}
