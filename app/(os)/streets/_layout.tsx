import { Stack } from 'expo-router';

export default function StreetsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="comments/[postId]" />
      <Stack.Screen name="share" />
      <Stack.Screen name="ads" />
      <Stack.Screen name="live" />
      <Stack.Screen name="live/[roomId]" />
      <Stack.Screen name="creator" />
      <Stack.Screen name="creator/[userId]" />
      <Stack.Screen name="shop" />
      <Stack.Screen name="jobs" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="post/[postId]" />
      <Stack.Screen name="edit/[id]" />
      <Stack.Screen name="chat/[userId]" />
      <Stack.Screen name="hashtag/[tag]" />
      <Stack.Screen name="search" />
      <Stack.Screen name="sound/[soundId]" />
    </Stack>
  );
}
