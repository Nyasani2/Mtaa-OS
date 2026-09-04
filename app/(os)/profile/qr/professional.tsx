import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';

export default function ProfessionalQRScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setQrValue(`mtaa://professional/${user.id}`);
      setLoading(false);
    }
  }, [user?.id]);

  const copyLink = async () => {
    await Clipboard.setStringAsync(qrValue);
    Alert.alert('Copied', 'Professional profile link copied to clipboard');
  };

  const shareQR = async () => {
    try {
      await Sharing.shareAsync(qrValue, { dialogTitle: 'Share MTAA Professional Profile' });
    } catch (err) {}
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional QR</Text>
        <TouchableOpacity onPress={shareQR}>
          <Ionicons name="share-outline" size={22} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrCard}>
          <QRCode value={qrValue} size={200} backgroundColor="#fff" color="#0f172a" />
          <Text style={styles.qrLabel}>Scan to view professional profile</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={copyLink}>
          <Ionicons name="copy-outline" size={20} color="#3b82f6" />
          <Text style={styles.actionText}>Copy Link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={shareQR}>
          <Ionicons name="share-social-outline" size={20} color="#10b981" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>This QR links to your professional profile — job title, company, skills, and experience</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  qrContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qrCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center' },
  qrLabel: { fontSize: 14, color: '#64748b', marginTop: 16 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 16, padding: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 8 },
  actionText: { color: '#f1f5f9', fontWeight: '600', fontSize: 14 },
  hint: { textAlign: 'center', color: '#64748b', fontSize: 12, paddingBottom: 32 },
});
