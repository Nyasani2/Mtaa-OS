import { Stack } from 'expo-router';

export default function HealthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="records" />
      <Stack.Screen name="records/detail" />
      <Stack.Screen name="prescriptions" />
      <Stack.Screen name="lab-results" />
      <Stack.Screen name="find-care" />
      <Stack.Screen name="insurance" />
      <Stack.Screen name="wallet" />
      <Stack.Screen name="vitals" />
      <Stack.Screen name="appointments" />
      <Stack.Screen name="doctor" />
      <Stack.Screen name="lab" />
      <Stack.Screen name="pharmacy" />
      <Stack.Screen name="radiology" />
      <Stack.Screen name="telemedicine" />
      <Stack.Screen name="hospital-admin" />
      <Stack.Screen name="ambulance" />
      <Stack.Screen name="government" />
      <Stack.Screen name="children" />
      <Stack.Screen name="medications" />
      <Stack.Screen name="share" />
      <Stack.Screen name="emergency-card" />
      <Stack.Screen name="system" />
      <Stack.Screen name="system/roles" />
      <Stack.Screen name="system/retention" />
      <Stack.Screen name="system/integrations" />
      <Stack.Screen name="system/notifications" />
      <Stack.Screen name="facility-onboard" />
      <Stack.Screen name="facility-register" />
    </Stack>
  );
}
