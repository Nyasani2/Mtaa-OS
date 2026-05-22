import { Stack } from 'expo-router';

export default function SocialLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="hookup" />
      <Stack.Screen name="tribes" />
    </Stack>
  );
}
