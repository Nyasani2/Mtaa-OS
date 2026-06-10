import { Stack } from 'expo-router';

export default function HealthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="records" />
      <Stack.Screen name="prescriptions" />
      <Stack.Screen name="lab-results" />
      <Stack.Screen name="emergency" />
      <Stack.Screen name="children" />
      <Stack.Screen name="find-care" />
      <Stack.Screen name="telemedicine" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="doctor" />
      <Stack.Screen name="insurance" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="biometric" />
      <Stack.Screen name="audit" />
    </Stack>
  );
}
