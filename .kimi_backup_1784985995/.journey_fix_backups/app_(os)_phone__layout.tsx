import { Stack } from 'expo-router';

export default function PhoneLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="dialer" />
      <Stack.Screen name="contacts" />
      <Stack.Screen name="call" />
    </Stack>
  );
}
