import React from 'react';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pin" />
      <Stack.Screen name="biometric" />
      <Stack.Screen name="devices" />
      <Stack.Screen name="blocked" />
      <Stack.Screen name="security-audit" />
    </Stack>
  );
}
