import { Stack } from 'expo-router';
export default function HealthLayout() {
return (
<Stack screenOptions={{ headerShown: false }}>
<Stack.Screen name="landing" />
<Stack.Screen name="patient/dashboard" />
<Stack.Screen name="staff/dashboard" />
<Stack.Screen name="records" />
<Stack.Screen name="appointments" />
<Stack.Screen name="find-care" />
<Stack.Screen name="doctor" />
<Stack.Screen name="pharmacy" />
<Stack.Screen name="lab" />
<Stack.Screen name="emergency" />
<Stack.Screen name="telemedicine" />
<Stack.Screen name="ambulance" />
<Stack.Screen name="insurance" />
<Stack.Screen name="facility-register" />
</Stack>
);
}
