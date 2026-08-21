import { Stack } from 'expo-router';
export default function OSLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="appstore" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="phone" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="health" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="property" />
      <Stack.Screen name="restaurant" />
      <Stack.Screen name="studio" />
      <Stack.Screen name="streets" />
      <Stack.Screen name="tribes" />
      <Stack.Screen name="calculator" />
      <Stack.Screen name="clock" />
      <Stack.Screen name="calendar" />
      <Stack.Screen name="network" />
      <Stack.Screen name="wifi" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="reader" />
      <Stack.Screen name="regulatory" />
      <Stack.Screen name="command" />
      <Stack.Screen name="asis" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="developer" />
      <Stack.Screen name="kernel-audit" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="coming-soon" />
      <Stack.Screen name="launcher" />
    </Stack>
  );
}
