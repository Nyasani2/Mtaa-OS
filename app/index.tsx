import React from 'react';
import { View, Image, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useOSShell } from '@/lib/shell/use-os-shell';

export default function Index() {
  const { isBooting, bootError, isAuthenticated, isPinSet, isUnlocked } = useOSShell();

  if (bootError) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{bootError}</Text>
      </View>
    );
  }

  if (!isBooting) {
    if (!isAuthenticated) return <Redirect href="/auth/login" />;
    if (!isPinSet) return <Redirect href="/auth/set-pin" />;
    if (!isUnlocked) return <Redirect href="/auth/lock-screen" />;
    return <Redirect href="/(os)" />;
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/mtaa_splashscreen.jpeg')}
        style={styles.logo}
        resizeMode="contain"
      />
      <ActivityIndicator size="large" color="#fff" style={styles.spinner} />
      <Text style={styles.text}>Africa is connected</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
  },
  logo: {
    width: 280,
    height: 400,
  },
  spinner: {
    marginTop: 24,
  },
  text: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: 1,
  },
  error: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
    fontWeight: '600',
  },
});
