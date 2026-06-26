import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import QRCode from 'react-native-qrcode-svg';

export default function QRProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [qrType, setQrType] = useState<'profile' | 'business' | 'resume' | 'creator'>('profile');

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('username, mtaa_id, display_name').eq('user_id', user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user?.id]);

  const getQRData = () => {
    const base = `mtaa://profile/${user?.id}`;
    switch (qrType) {
      case 'business': return `${base}?mode=business`;
      case 'resume': return `${base}?mode=resume`;
      case 'creator': return `${base}?mode=creator`;
      default: return base;
    }
  };

  const handleShare = async () => {
    await Share.share({ message: `Check out my MTAA profile: mtaa.app/@${profile?.username || profile?.mtaa_id}` });
  };

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const types = [
    { key: 'profile', label: 'Profile', icon: 'person-outline' },
    { key: 'business', label: 'Business', icon: 'business-outline' },
    { key: 'resume', label: 'Resume', icon: 'document-text-outline' },
    { key: 'creator', label: 'Creator', icon: 'sparkles-outline' },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <TouchableOpacity onPress={handleShare}><Ionicons name="share-outline" size={22} color="#fff" /></TouchableOpacity>
      </View>

      <View style={styles.qrCard}>
        <View style={styles.qrWrap}>
          <QRCode value={getQRData()} size={200} backgroundColor="#111" color="#00d4ff" />
        </View>
        <Text style={styles.qrLabel}>@{profile?.username || profile?.mtaa_id || 'user'}</Text>
        <Text style={styles.qrSub}>Scan to view {qrType} profile</Text>
      </View>

      <View style={styles.typeSelector}>
        {types.map(t => (
          <TouchableOpacity key={t.key} style={[styles.typeBtn, qrType === t.key && styles.typeBtnActive]} onPress={() => setQrType(t.key as any)}>
            <Ionicons name={t.icon as any} size={18} color={qrType === t.key ? '#00d4ff' : '#888'} />
            <Text style={[styles.typeText, qrType === t.key && styles.typeTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={18} color="#000" />
          <Text style={styles.actionText}>Share Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.secondaryBtn]} onPress={() => router.push('/profile/qr/scan')}>
          <Ionicons name="scan-outline" size={18} color="#fff" />
          <Text style={[styles.actionText, { color: '#fff' }]}>Scan QR</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  qrCard: { margin: 24, backgroundColor: '#111', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  qrWrap: { padding: 16, backgroundColor: '#fff', borderRadius: 12 },
  qrLabel: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 16 },
  qrSub: { color: '#888', fontSize: 12, marginTop: 4 },
  typeSelector: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, backgroundColor: '#111', gap: 6, borderWidth: 1, borderColor: '#222' },
  typeBtnActive: { backgroundColor: '#00d4ff22', borderColor: '#00d4ff' },
  typeText: { color: '#888', fontSize: 12 },
  typeTextActive: { color: '#00d4ff', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, padding: 24, marginTop: 'auto' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00d4ff', paddingVertical: 14, borderRadius: 20, gap: 8 },
  secondaryBtn: { backgroundColor: '#222', borderWidth: 1, borderColor: '#333' },
  actionText: { color: '#000', fontWeight: '700', fontSize: 14 },
});
