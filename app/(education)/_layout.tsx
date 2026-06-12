import { Stack } from 'expo-router';

export default function EducationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="feed" />
      <Stack.Screen name="schools" />
      <Stack.Screen name="teachers" />
      <Stack.Screen name="payroll" />
      <Stack.Screen name="messages" />
    </Stack>
  );
}
