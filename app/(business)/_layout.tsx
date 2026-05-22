import { Stack } from 'expo-router';

export default function BusinessLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ads" />
      <Stack.Screen name="analytics" />
    </Stack>
  );
}
