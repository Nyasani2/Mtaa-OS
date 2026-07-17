import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';

export default function ProfileQRScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrValue, setQrValue] = useState('');

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    supabase.from('profiles').select('user_id, display_name, username, avatar_url, mtaa_id').eq('user_id', user.id).single()
      .then(({ data, error }) => {
        if (error) console.warn('[ProfileQR]', error.message);
        setProfile(data);
        const payload = JSON.stringify({
          type: 'profile',
          user_id: data?.user_id || user.id,
          username: data?.username || '',
          mtaa_id: data?.mtaa_id || '',
        });
        setQrValue(payload);
        setLoading(false);
      });
  }, [user?.id]);

  const handleShare = async () => {
    if (!qrValue) return;
    try {
      const fileUri = FileSystem.cacheDirectory + 'profile-qr.png';
      // Note: QRCode svg capture requires view shot — for now share the text
      await Sharing.shareAsync(fileUri, { mimeType: 'image/png' }).catch(() => {
        Alert.alert('Share Profile', `Scan this QR to view profile: ${profile?.username || 'MTAA User'}`);
      });
    } catch {
      Alert.alert('Share Profile', `MTAA Profile: ${profile?.username || 'MTAA User'}`);
    }
  };

  const handleScan = () => {
    router.push('/(os)/wallet/qr-scan');
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <TouchableOpacity onPress={handleShare}><Ionicons name="share-outline" size={24} color="#2563EB" /></TouchableOpacity>
      </View>

      <View style={styles.center}>
        <View style={styles.qrCard}>
          {profile?.avatar_url && (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          )}
          <Text style={styles.name}>{profile?.display_name || profile?.username || 'MTAA User'}</Text>
          <Text style={styles.handle}>@{profile?.username || 'username'}</Text>

          <View style={styles.qrContainer}>
            {qrValue ? (
              <QRCode value={qrValue} size={200} color="#0f172a" backgroundColor="#fff" />
            ) : (
              <ActivityIndicator color="#2563EB" />
            )}
          </View>

          <Text style={styles.hint}>Scan to view profile</Text>
        </View>

        <TouchableOpacity style={styles.scanBtn} onPress={handleScan}>
          <Ionicons name="scan-outline" size={20} color="#fff" />
          <Text style={styles.scanBtnText}>Scan QR Code</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  qrCard: { alignItems: 'center', backgroundColor: '#f8fafc', padding: 32, borderRadius: 24, width: '100%', borderWidth: 1, borderColor: '#e2e8f0' },
  avatar: { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
  name: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  handle: { fontSize: 14, color: '#64748b', marginTop: 4 },
  qrContainer: { marginTop: 20, padding: 16, backgroundColor: '#fff', borderRadius: 16 },
  hint: { fontSize: 13, color: '#94a3b8', marginTop: 16 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 24, marginTop: 24, gap: 8 },
  scanBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
