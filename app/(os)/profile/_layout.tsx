import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="achievements" />
      <Stack.Screen name="professional" />
      <Stack.Screen name="portfolio" />
      <Stack.Screen name="earnings" />
      <Stack.Screen name="family" />
      <Stack.Screen name="qr-code" />
    </Stack>
  );
}
