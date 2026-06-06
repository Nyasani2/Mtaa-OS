import { Stack } from "expo-router";

export default function WalletLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="deposit" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="qr-pay" />
      <Stack.Screen name="send" />
      <Stack.Screen name="receive" />
      <Stack.Screen name="history" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="agent" />
      <Stack.Screen name="banks" />
      <Stack.Screen name="business" />
      <Stack.Screen name="business-documents" />
      <Stack.Screen name="business-register" />
      <Stack.Screen name="credit" />
      <Stack.Screen name="escrow" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="qr" />
      <Stack.Screen name="qr-action" />
      <Stack.Screen name="qr-scan" />
      <Stack.Screen name="savings-loans" />
      <Stack.Screen name="merchant-dashboard" />
      <Stack.Screen name="gofund" />
      <Stack.Screen name="claim" />
      <Stack.Screen name="agent-map" />
      <Stack.Screen name="rewards" />
      <Stack.Screen name="group-savings" />
      <Stack.Screen name="regulatory" />
      <Stack.Screen name="partner" />
      <Stack.Screen name="crypto" />
      <Stack.Screen name="daraja" />
      <Stack.Screen name="email-verify" />
      <Stack.Screen name="tax" />
    </Stack>
  );
}
