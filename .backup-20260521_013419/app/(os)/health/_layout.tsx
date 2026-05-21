// app/(os)/health/_layout.tsx
import { Stack } from 'expo-router';

export default function HealthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="hospitals" />
      <Stack.Screen name="ambulance" />
      <Stack.Screen name="records" />
      <Stack.Screen name="lab-tests" />
      <Stack.Screen name="insurance" />
      <Stack.Screen name="vaccinations" />
      <Stack.Screen name="pharmacy" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="book-appointment" />
      <Stack.Screen name="hospital/[id]" />
      <Stack.Screen name="appointment/[id]" />
    </Stack>
  );
}
