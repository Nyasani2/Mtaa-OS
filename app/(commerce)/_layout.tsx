import { Stack } from 'expo-router';

export default function CommerceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="marketplace" />
      <Stack.Screen name="shop" />
    </Stack>
  );
}
