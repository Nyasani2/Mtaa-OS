// app/(os)/wallet/_layout.tsx
import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="deposit" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="transfer" />
      <Stack.Screen name="escrow" />
      <Stack.Screen name="transactions" />
      <Stack.Screen name="transaction/[id]" />
      <Stack.Screen name="payment-methods" />
    </Stack>
  );
}
