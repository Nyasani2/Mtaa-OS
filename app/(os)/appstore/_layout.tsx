// app/(os)/appstore/_layout.tsx
import { Stack } from 'expo-router';

export default function AppStoreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="app/[id]" />
      <Stack.Screen name="installed" />
      <Stack.Screen name="updates" />
    </Stack>
  );
}
