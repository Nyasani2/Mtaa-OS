import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Platform, Alert, ActivityIndicator } from 'react-native';
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
  const [qrType, setQrType] = useState<'profile'|'business'|'resume'|'creator'>('profile');

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('username, mtaa_id, display_name').eq('user_id', user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user?.id]);

  const getQrData = () => {
    const base = `https://mtaa.app/u/${profile?.username || profile?.mtaa_id || user?.id}`;
    const types: Record<string, string> = { profile: base, business: `${base}?type=business`, resume: `${base}?type=resume`, creator: `${base}?type=creator` };
    return types[qrType] || base;
  };

  const handleShare = async () => {
    const message = `Check out my MTAA profile: ${getQrData()}`;
    if (Platform.OS === 'web') { Alert.alert('Share Profile', message, [{ text: 'OK' }]); return; }
    try { await Share.share({ message, title: 'My MTAA Profile' }); } catch { Alert.alert('Error', 'Could not share'); }
  };

  const handleScan = () => { Alert.alert('Scan QR', 'QR scanner coming soon'); };
  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#2563EB" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My QR Code</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.content}>
        <View style={styles.qrContainer}><QRCode value={getQrData()} size={200} backgroundColor="#fff" color="#0f172a" /></View>
        <Text style={styles.username}>@{profile?.username || 'username'}</Text>
        <Text style={styles.scanText}>Scan to view profile</Text>
        <View style={styles.typeRow}>
          {(['profile','business','resume','creator'] as const).map(type => (
            <TouchableOpacity key={type} style={[styles.typeBtn, qrType === type && styles.typeBtnActive]} onPress={() => setQrType(type)}>
              <Ionicons name={type==='profile'?'person':type==='business'?'business':type==='resume'?'document':'sparkles'} size={16} color={qrType===type?'#fff':'#64748b'} />
              <Text style={[styles.typeText, qrType===type&&styles.typeTextActive]}>{type.charAt(0).toUpperCase()+type.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerBtn} onPress={handleShare}><Ionicons name="share-outline" size={20} color="#2563EB" /><Text style={styles.footerText}>Share Profile</Text></TouchableOpacity>
        <TouchableOpacity style={styles.footerBtn} onPress={handleScan}><Ionicons name="scan-outline" size={20} color="#2563EB" /><Text style={styles.footerText}>Scan QR</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  qrContainer: { backgroundColor: '#fff', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 20 },
  username: { color: '#0f172a', fontSize: 18, fontWeight: '700', marginTop: 8 },
  scanText: { color: '#64748b', fontSize: 13, marginTop: 4 },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 24 },
  typeBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f8fafc', gap: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  typeBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  typeText: { color: '#64748b', fontSize: 12, fontWeight: '500' },
  typeTextActive: { color: '#fff', fontWeight: '600' },
  footer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  footerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', paddingVertical: 14, borderRadius: 12, gap: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  footerText: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
});
