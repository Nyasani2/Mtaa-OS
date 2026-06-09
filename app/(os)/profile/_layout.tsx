import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function ProfileLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: 'Profile' }} />
        <Stack.Screen name="edit" options={{ title: 'Edit Profile', presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings', presentation: 'modal' }} />
        <Stack.Screen name="qr" options={{ title: 'My QR Code', presentation: 'modal' }} />
        <Stack.Screen name="share" options={{ title: 'Share Profile', presentation: 'modal' }} />
        <Stack.Screen name="reputation" options={{ title: 'Trust & Reputation' }} />
        <Stack.Screen name="network" options={{ title: 'My Network' }} />
        <Stack.Screen name="portfolio" options={{ title: 'Portfolio' }} />
        <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
        <Stack.Screen name="businesses" options={{ title: 'My Businesses' }} />
        <Stack.Screen name="services" options={{ title: 'My Services' }} />
        <Stack.Screen name="analytics" options={{ title: 'Analytics Center' }} />
      </Stack>
      <StatusBar style="auto" />
    </>
  );
}
