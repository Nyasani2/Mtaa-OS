import { Stack } from 'expo-router';

export default function CivicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="police" />
      <Stack.Screen name="courts" />
      <Stack.Screen name="prisons" />
      <Stack.Screen name="revenue" />
      <Stack.Screen name="health-authority" />
    </Stack>
  );
}
