import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="followers" />
      <Stack.Screen name="following" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="qr" />
      <Stack.Screen name="verification" />
    </Stack>
  );
}
