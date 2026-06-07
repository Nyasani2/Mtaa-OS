import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Core wallet screens */}
      <Stack.Screen name="index" />
      <Stack.Screen name="send" />
      <Stack.Screen name="receive" />
      <Stack.Screen name="deposit" />
      <Stack.Screen name="withdraw" />
      <Stack.Screen name="escrow" />
      <Stack.Screen name="qr" />
      <Stack.Screen name="qr-pay" />
      <Stack.Screen name="qr-scan" />
      <Stack.Screen name="qr-action" />
      <Stack.Screen name="business" />
      <Stack.Screen name="business-register" />
      <Stack.Screen name="business-documents" />
      <Stack.Screen name="banks" />
      <Stack.Screen name="tax" />
      <Stack.Screen name="savings-loans" />
      <Stack.Screen name="credit" />
      <Stack.Screen name="agent" />
      <Stack.Screen name="history" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="settings" />

      {/* V2 Hub Screens */}
      <Stack.Screen name="banking-hub" />
      <Stack.Screen name="gofund-hub" />
      <Stack.Screen name="savings-hub" />
      <Stack.Screen name="sacco-hub" />
      <Stack.Screen name="insurance-hub" />
      <Stack.Screen name="government-hub" />
      <Stack.Screen name="partner-ecosystem" />
    </Stack>
  );
}
