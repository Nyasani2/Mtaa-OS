// app/(mtruck)/_layout.tsx
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useIdentity } from '@/lib/auth/identity';
import { useShipperStore } from '@/lib/mtruck/stores/useShipperStore';

export default function MTruckLayout() {
  const { user } = useIdentity();
  const { loadRequests, loadJobs } = useShipperStore();

  useEffect(() => {
    if (user?.id) {
      loadRequests(user.id);
      loadJobs(user.id);
    }
  }, [user?.id]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: '#0f0f23' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'MTruck', headerShown: false }} />
      <Stack.Screen name="request-haul" options={{ title: 'Request Haul', presentation: 'modal' }} />
      <Stack.Screen name="haul-tracking" options={{ title: 'Track Delivery' }} />
      <Stack.Screen name="haul-history" options={{ title: 'Haul History' }} />
      <Stack.Screen name="equipment" options={{ title: 'Heavy Equipment' }} />
      <Stack.Screen name="equipment-book" options={{ title: 'Book Equipment', presentation: 'modal' }} />
    </Stack>
  );
}
