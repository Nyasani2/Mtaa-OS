import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';

type QRMode = 'social' | 'professional';

export default function QRIndexScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mode, setMode] = useState<QRMode>('social');
  const [qrValue, setQrValue] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      setQrValue(mode === 'social'
        ? `mtaa://profile/${user.id}`
        : `mtaa://professional/${user.id}`
      );
      setLoading(false);
    }
  }, [user?.id, mode]);

  const copyLink = async () => {
    await Clipboard.setStringAsync(qrValue);
    Alert.alert('Copied', `${mode === 'social' ? 'Profile' : 'Professional'} link copied to clipboard`);
  };

  const shareQR = async () => {
    try {
      await Sharing.shareAsync(qrValue, {
        dialogTitle: mode === 'social' ? 'Share MTAA Profile' : 'Share MTAA Professional Profile'
      });
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
        <Text style={styles.headerTitle}>My QR Code</Text>
        <TouchableOpacity onPress={shareQR}>
          <Ionicons name="share-outline" size={22} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeRow}>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'social' && styles.modeBtnActive]}
          onPress={() => setMode('social')}
        >
          <Ionicons name="person-outline" size={16} color={mode === 'social' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.modeText, mode === 'social' && styles.modeTextActive]}>Social</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, mode === 'professional' && styles.modeBtnActive]}
          onPress={() => setMode('professional')}
        >
          <Ionicons name="briefcase-outline" size={16} color={mode === 'professional' ? '#fff' : '#94a3b8'} />
          <Text style={[styles.modeText, mode === 'professional' && styles.modeTextActive]}>Professional</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.qrContainer}>
        <View style={styles.qrCard}>
          <QRCode value={qrValue} size={200} backgroundColor="#fff" color="#0f172a" />
          <Text style={styles.qrLabel}>
            {mode === 'social'
              ? 'Scan to view social profile'
              : 'Scan to view professional profile'
            }
          </Text>
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

      <Text style={styles.hint}>
        {mode === 'social'
          ? 'Your social QR links to your MTAA profile — posts, followers, bio'
          : 'Your professional QR links to your career profile — job title, skills, experience'
        }
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  modeRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, padding: 16 },
  modeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  modeBtnActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  modeText: { fontSize: 13, color: '#94a3b8', fontWeight: '600' },
  modeTextActive: { color: '#fff' },
  qrContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  qrCard: { backgroundColor: '#fff', padding: 24, borderRadius: 16, alignItems: 'center' },
  qrLabel: { fontSize: 14, color: '#64748b', marginTop: 16 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 16, padding: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 8 },
  actionText: { color: '#f1f5f9', fontWeight: '600', fontSize: 14 },
  hint: { textAlign: 'center', color: '#64748b', fontSize: 12, paddingBottom: 32, paddingHorizontal: 24 },
});
