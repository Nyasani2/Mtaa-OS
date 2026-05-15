import { Stack } from 'expo-router';

export default function StreetsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="feed" />
      <Stack.Screen name="discover" />
      <Stack.Screen name="create" />
      <Stack.Screen name="inbox" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="search" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="share" />
      <Stack.Screen name="gift" />
      <Stack.Screen name="comments/[id]" />
      <Stack.Screen name="live/[id]" />
      <Stack.Screen name="live/start" />
    </Stack>
  );
}
