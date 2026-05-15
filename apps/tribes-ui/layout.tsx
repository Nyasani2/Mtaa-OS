import { Stack } from 'expo-router';

export default function TribesUILayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0A0A0A' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Tribes' }} />
      <Stack.Screen name="screens/TribesHome" options={{ title: 'Tribes Home' }} />
      <Stack.Screen name="screens/TribeProfile" options={{ title: 'Tribe Profile' }} />
      <Stack.Screen name="screens/Governance" options={{ title: 'Governance' }} />
      <Stack.Screen name="museum/MuseumHome" options={{ title: 'Museum' }} />
    </Stack>
  );
}
