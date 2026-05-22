import { Stack } from 'expo-router';

export default function OsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="launcher" />
      <Stack.Screen name="appstore" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="developer" />
    </Stack>
  );
}
