import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function SchedulerLayout() {
  return (
    <>
      <Stack
        screenOptions={
          headerShown: false,
          contentStyle: { backgroundColor: '#F8FAFC' },
          animation: 'slide_from_right',
        }
      >
        <Stack.Screen name="index" options={ title: 'Scheduler' } />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
