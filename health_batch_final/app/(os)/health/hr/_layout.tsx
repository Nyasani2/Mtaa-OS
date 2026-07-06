import { Stack } from 'expo-router';

export default function HRLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="payroll/index" />
      <Stack.Screen name="attendance/index" />
      <Stack.Screen name="shifts/index" />
      <Stack.Screen name="leave/index" />
    </Stack>
  );
}
