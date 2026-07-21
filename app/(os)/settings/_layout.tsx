import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="network" />
      <Stack.Screen name="display" />
      <Stack.Screen name="sound" />
      <Stack.Screen name="battery" />
      <Stack.Screen name="storage" />
      <Stack.Screen name="apps" />
      <Stack.Screen name="language" />
      <Stack.Screen name="datetime" />
      <Stack.Screen name="accessibility" />
      <Stack.Screen name="privacy" />
      <Stack.Screen name="change-pin" />
      <Stack.Screen name="biometric" />
      <Stack.Screen name="security-center" />
      <Stack.Screen name="backup" />
      <Stack.Screen name="developer-options" />
      <Stack.Screen name="about" />
      <Stack.Screen name="help" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="security" />
    </Stack>
  );
}
