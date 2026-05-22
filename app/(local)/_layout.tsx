import { Stack } from 'expo-router';

export default function LocalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="streets" />
    </Stack>
  );
}
