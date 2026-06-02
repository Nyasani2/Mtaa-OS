import { Stack } from 'expo-router';

export default function StreetsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="comments/[postId]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="share/[postId]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="live/[streamId]" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      <Stack.Screen name="wallet" options={{ presentation: 'modal' }} />
      <Stack.Screen name="shop" options={{ presentation: 'modal' }} />
      <Stack.Screen name="jobs" options={{ presentation: 'modal' }} />
      <Stack.Screen name="creator" options={{ presentation: 'modal' }} />
      <Stack.Screen name="ads" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
