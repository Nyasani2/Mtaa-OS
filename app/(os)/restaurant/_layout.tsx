import { Stack } from 'expo-router';

export default function RestaurantLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pos" />
      <Stack.Screen name="kds" />
      <Stack.Screen name="tables" />
      <Stack.Screen name="menu" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="staff" />
      <Stack.Screen name="payroll" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="delivery" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="asis" />
    </Stack>
  );
}
