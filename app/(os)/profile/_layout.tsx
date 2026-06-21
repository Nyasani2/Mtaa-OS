import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit Profile', presentation: 'modal' }} />
      <Stack.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Stack.Screen name="professional" options={{ title: 'Professional Profile' }} />
      <Stack.Screen name="business" options={{ title: 'Business Profile' }} />
      <Stack.Screen name="family" options={{ title: 'Family' }} />
      <Stack.Screen name="creator" options={{ title: 'Creator Dashboard' }} />
      <Stack.Screen name="reputation" options={{ title: 'Reputation' }} />
      <Stack.Screen name="documents" options={{ title: 'Documents' }} />
      <Stack.Screen name="assets" options={{ title: 'Assets' }} />
      <Stack.Screen name="qr" options={{ title: 'QR Identity', presentation: 'modal' }} />
    </Stack>
  );
}
