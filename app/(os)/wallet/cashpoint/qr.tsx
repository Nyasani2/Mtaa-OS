import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import QRCode from 'react-native-qrcode-svg';

export default function CashPointQRScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const agentData = JSON.stringify({
    type: 'cashpoint',
    agent_id: user?.id,
    timestamp: Date.now(),
  });

  const shareQR = async () => {
    await Share.share({ message: 'Scan to pay at my MTAA CashPoint!' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>CashPoint QR</Text>
        <TouchableOpacity onPress={shareQR}><Ionicons name="share-outline" size={22} color="#00d4ff" /></TouchableOpacity>
      </View>
      <View style={styles.qrContainer}>
        <View style={styles.qrCard}>
          <QRCode value={agentData} size={200} color="#000" backgroundColor="#fff" />
          <Text style={styles.qrLabel}>Scan to pay at this CashPoint</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  qrContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  qrCard: { backgroundColor: '#fff', borderRadius: 20, padding: 32, alignItems: 'center' },
  qrLabel: { color: '#333', fontSize: 14, fontWeight: '600', marginTop: 16 },
});

