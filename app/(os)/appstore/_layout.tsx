import { Stack } from 'expo-router';

export default function AppStoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="my-apps" />
      <Stack.Screen name="updates" />
    </Stack>
  );
}
