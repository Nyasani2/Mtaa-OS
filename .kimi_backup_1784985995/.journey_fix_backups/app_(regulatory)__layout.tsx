import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RegulatoryLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Regulatory' }} />
        <Stack.Screen name="tax-revenue" options={{ title: 'Tax Revenue' }} />
        <Stack.Screen name="business-lookup" options={{ title: 'Business Lookup' }} />
        <Stack.Screen name="tax-payments" options={{ title: 'Tax Payments' }} />
        <Stack.Screen name="compliance" options={{ title: 'Compliance' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
