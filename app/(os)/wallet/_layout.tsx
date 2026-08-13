import React from 'react';
import { Stack } from 'expo-router';

export default function WalletLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="send" />
      <Stack.Screen name="scan-qr" />
    </Stack>
  );
}
