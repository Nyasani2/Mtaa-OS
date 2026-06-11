import { Stack } from 'expo-router';

export default function ShopDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="products" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="customers" />
      <Stack.Screen name="inventory" />
      <Stack.Screen name="suppliers" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="accounting" />
      <Stack.Screen name="analytics" />
      <Stack.Screen name="staff" />
      <Stack.Screen name="pos" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
