import { Stack } from 'expo-router';

export default function FinanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="credit" />
      <Stack.Screen name="binance" />
    </Stack>
  );
}
