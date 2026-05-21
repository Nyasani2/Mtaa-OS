import { Stack } from 'expo-router';

export default function TribesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[slug]" />
      <Stack.Screen name="create" />
      <Stack.Screen name="events/[id]" />
      <Stack.Screen name="settings/[slug]" />
    </Stack>
  );
}
