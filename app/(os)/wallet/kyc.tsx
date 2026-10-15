import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WalletKYC() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Ionicons name="shield-checkmark-outline" size={64} color="#3b82f6" />
      <Text style={styles.title}>Identity Verification</Text>
      <Text style={styles.text}>
        To complete your purchase and comply with regional financial regulations, 
        please verify your identity. This feature is currently being finalized.
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => router.back()}>
        <Text style={styles.buttonText}>Return to Checkout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: '#0f172a' },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8 },
  text: { fontSize: 16, color: '#94a3b8', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  button: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
