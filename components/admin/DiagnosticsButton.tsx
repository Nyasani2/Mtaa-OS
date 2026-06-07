// components/admin/DiagnosticsButton.tsx
// Drop-in admin diagnostics button for home screen

import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/hooks/useAuthStore';

export function DiagnosticsButton() {
  const router = useRouter();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'admin' || user?.email?.includes('admin') || user?.is_super_admin;

  if (!isAdmin) return null;

  return (
    <TouchableOpacity 
      style={styles.button}
      onPress={() => router.push('/(os)/admin/diagnostics')}
    >
      <Text style={styles.text}>🔧 Diagnostics</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { 
    backgroundColor: '#7C3AED', 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 8,
    marginTop: 12,
    alignSelf: 'center'
  },
  text: { 
    color: '#FFFFFF', 
    fontWeight: '700', 
    fontSize: 13 
  }
});
