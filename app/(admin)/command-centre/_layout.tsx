import { Stack } from 'expo-router';

export default function CommandCentreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="connections/index" />
      <Stack.Screen name="treasury/index" />
      <Stack.Screen name="treasury/central-bank" />
      <Stack.Screen name="treasury/credit-regulatory" />
      <Stack.Screen name="revenue/index" />
    </Stack>
  );
}
