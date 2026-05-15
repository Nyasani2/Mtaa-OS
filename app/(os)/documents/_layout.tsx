import { Stack } from 'expo-router';

export default function DocumentsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0A0A0A' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="preview" options={{ presentation: 'modal' }} />
      <Stack.Screen name="folder" />
    </Stack>
  );
}
