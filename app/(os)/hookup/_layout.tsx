import { Stack } from 'expo-router';

export default function HookupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="discovery" />
      <Stack.Screen name="profile-setup" />
      <Stack.Screen name="profile-detail" />
      <Stack.Screen name="likes" />
      <Stack.Screen name="matches" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="safety" />
    </Stack>
  );
}
