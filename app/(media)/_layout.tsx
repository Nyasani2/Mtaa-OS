import { Stack } from 'expo-router';

export default function MediaLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="gallery" />
    </Stack>
  );
}
