import { Stack } from 'expo-router';

export default function AccountantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="revenue/index" />
      <Stack.Screen name="budget/index" />
      <Stack.Screen name="procurement/index" />
      <Stack.Screen name="tax/index" />
      <Stack.Screen name="compliance/index" />
    </Stack>
  );
}
