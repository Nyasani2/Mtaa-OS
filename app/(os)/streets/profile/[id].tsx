// app/(os)/streets/profile/[id].tsx
// View other user's profile from feed tap

import { Stack } from 'expo-router';
import ProfileScreen from '@/domains/streets/screens/ProfileScreen';

export default function UserProfileRoute() {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ProfileScreen />
    </>
  );
}
