import { Stack } from 'expo-router';

export default function GalleryLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="viewer" options={{ presentation: 'modal' }} />
      <Stack.Screen name="editor" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
