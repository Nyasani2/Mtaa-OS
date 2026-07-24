import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function AuthIndexScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading) {
        if (isAuthenticated) {
          // FIXED: router.replace('/') -> router.replace('/(os)') since app/index.tsx was archived
          router.replace('/(os)');
        } else {
          router.replace('/auth/login');
        }
        setChecking(false);
      }
    };
    checkAuth();
  }, [isAuthenticated, isLoading]);

  if (isLoading || checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4aa" />
        <Text style={styles.text}>Checking authentication...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Redirecting...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    color: '#888',
    fontSize: 14,
  },
});
