import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="edit" />
      <Stack.Screen name="assets/index" />
      <Stack.Screen name="business/index" />
      <Stack.Screen name="creator/index" />
      <Stack.Screen name="documents/index" />
      <Stack.Screen name="family/index" />
      <Stack.Screen name="professional/index" />
      <Stack.Screen name="qr/index" />
      <Stack.Screen name="reputation/index" />
    </Stack>
  );
}
