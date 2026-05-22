import { Stack } from 'expo-router';

export default function ProductivityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="documents" />
      <Stack.Screen name="scheduler" />
    </Stack>
  );
}
