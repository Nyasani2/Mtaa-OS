import { Stack } from 'expo-router';

export default function ReceptionistLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="register/index" />
      <Stack.Screen name="checkin/index" />
      <Stack.Screen name="queue/index" />
    </Stack>
  );
}
