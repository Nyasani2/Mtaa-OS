// ASIS v1 - Expo Router Page
// Route: app/(os)/asis/index.tsx
// Full-screen ASIS chat interface accessible from home button

import React from 'react';
import { View, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { Stack } from 'expo-router';
import { AsisChatScreen } from '@/lib/asis/components/AsisChatScreen';
import { useAuth } from '@/hooks/useAuth';

export default function AsisPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'ASIS', headerShown: false }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Please sign in to use ASIS</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'ASIS',
          headerShown: false,
          gestureEnabled: false,
        }}
      />
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <AsisChatScreen userId={user.id} />
    </SafeAreaView>
  );
}

import { Text } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#8e8e93',
    fontSize: 16,
  },
});
