import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function WalletProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('profiles').select('display_name, avatar_url, is_verified').eq('user_id', user.id).single()
      .then(({ data }) => { setProfile(data); setLoading(false); });
  }, [user?.id]);

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const walletItems = [
    { label: 'Balance', value: 'KES 0.00', icon: 'wallet-outline', color: '#00d4ff', route: '/wallet/balance' },
    { label: 'Savings', value: 'KES 0.00', icon: 'save-outline', color: '#00ff88', route: '/wallet/savings' },
    { label: 'Escrow', value: 'KES 0.00', icon: 'lock-closed-outline', color: '#ffaa00', route: '/wallet/escrow' },
    { label: 'Loans', value: 'KES 0.00', icon: 'cash-outline', color: '#ff4444', route: '/wallet/loans' },
    { label: 'Transactions', value: '0', icon: 'swap-horizontal-outline', color: '#aa66ff', route: '/wallet/transactions' },
    { label: 'Cards', value: '0', icon: 'card-outline', color: '#00d4ff', route: '/wallet/cards' },
    { label: 'Linked Banks', value: '0', icon: 'business-outline', color: '#ff00ff', route: '/wallet/banks' },
    { label: 'Crypto', value: '0', icon: 'logo-bitcoin', color: '#ffaa00', route: '/wallet/crypto' },
    { label: 'Rewards', value: '0 pts', icon: 'gift-outline', color: '#00ff88', route: '/wallet/rewards' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <TouchableOpacity onPress={() => router.push('/wallet/settings')}><Ionicons name="settings-outline" size={22} color="#fff" /></TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          {profile?.avatar_url ? <Text style={styles.avatarText}>👤</Text> : <Ionicons name="person-circle" size={48} color="#00d4ff" />}
          <Text style={styles.profileName}>{profile?.display_name || 'User'}</Text>
          {profile?.is_verified && <Ionicons name="shield-checkmark" size={14} color="#00d4ff" />}
          <Text style={styles.profileSub}>Private wallet — only you can see this</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceValue}>KES 0.00</Text>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.balanceBtn} onPress={() => router.push('/wallet/send')}>
              <Ionicons name="arrow-up-outline" size={18} color="#000" />
              <Text style={styles.balanceBtnText}>Send</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.balanceBtn} onPress={() => router.push('/wallet/receive')}>
              <Ionicons name="arrow-down-outline" size={18} color="#000" />
              <Text style={styles.balanceBtnText}>Receive</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.balanceBtn} onPress={() => router.push('/wallet/qr')}>
              <Ionicons name="qr-code-outline" size={18} color="#000" />
              <Text style={styles.balanceBtnText}>QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wallet</Text>
          {walletItems.map(item => (
            <TouchableOpacity key={item.label} style={styles.row} onPress={() => router.push(item.route as any)}>
              <Ionicons name={item.icon as any} size={20} color={item.color} />
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={[styles.rowValue, { color: item.color }]}>{item.value}</Text>
              <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  profileHeader: { alignItems: 'center', padding: 24 },
  avatarText: { fontSize: 48 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 8 },
  profileSub: { color: '#888', fontSize: 12, marginTop: 4 },
  balanceCard: { margin: 16, backgroundColor: '#00d4ff11', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#00d4ff33', alignItems: 'center' },
  balanceLabel: { color: '#888', fontSize: 12 },
  balanceValue: { color: '#fff', fontSize: 32, fontWeight: '700', marginTop: 8 },
  balanceActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  balanceBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00d4ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, gap: 6 },
  balanceBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  rowLabel: { color: '#fff', fontSize: 14, flex: 1, marginLeft: 12 },
  rowValue: { fontSize: 14, fontWeight: '600', marginRight: 8 },
});
