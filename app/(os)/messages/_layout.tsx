import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function MessagesLayout() {
  return (
    <>
      <Stack
        screenOptions={
          headerShown: false,
          contentStyle: { backgroundColor: '#F8FAFC' },
          animation: 'slide_from_right',
        }
      >
        <Stack.Screen name="index" options={ title: 'Messages' } />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
