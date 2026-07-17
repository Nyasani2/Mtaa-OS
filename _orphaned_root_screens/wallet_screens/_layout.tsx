import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="phone-verify" />
      <Stack.Screen name="email-verify" />
      <Stack.Screen name="pin-create" />
      <Stack.Screen name="pin-confirm" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
