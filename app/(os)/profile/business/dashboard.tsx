import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function BusinessDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user?.id) return; supabase.from('profiles').select('display_name, bio, city, country, is_verified').eq('user_id', user.id).single().then(({ data }) => { setProfile(data); setLoading(false); }); }, [user?.id]);
  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const tools = [
    { label: 'Business Verification', icon: 'shield-checkmark-outline', route: '/profile/business/verification' },
    { label: 'Employees', icon: 'people-outline', route: '/profile/business/employees' },
    { label: 'Branches', icon: 'business-outline', route: '/profile/business/branches' },
    { label: 'Services', icon: 'construct-outline', route: '/profile/business/services' },
    { label: 'Products', icon: 'cube-outline', route: '/profile/business/products' },
    { label: 'Orders', icon: 'cart-outline', route: '/profile/business/orders' },
    { label: 'Invoices', icon: 'receipt-outline', route: '/profile/business/invoices' },
    { label: 'Business Analytics', icon: 'stats-chart-outline', route: '/profile/business/analytics' },
    { label: 'Reviews', icon: 'star-outline', route: '/profile/business/reviews' },
    { label: 'Opening Hours', icon: 'time-outline', route: '/profile/business/hours' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Business Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <Text style={styles.businessName}>{profile?.display_name || 'Business Name'}</Text>
          <Text style={styles.location}>{[profile?.city, profile?.country].filter(Boolean).join(', ') || 'No location set'}</Text>
          <Text style={styles.bio}>{profile?.bio || 'No business description'}</Text>
          {profile?.is_verified && <View style={styles.verifiedBadge}><Ionicons name="shield-checkmark" size={14} color="#00d4ff" /><Text style={styles.verifiedText}>Verified Business</Text></View>}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Business Management</Text>
          {tools.map(t => <TouchableOpacity key={t.label} style={styles.row} onPress={() => router.push(t.route as any)}><Ionicons name={t.icon as any} size={20} color="#00d4ff" /><Text style={styles.rowText}>{t.label}</Text><Ionicons name="chevron-forward" size={16} color="#444" /></TouchableOpacity>)}
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
  summaryCard: { margin: 16, backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  businessName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  location: { color: '#888', fontSize: 13, marginTop: 4 },
  bio: { color: '#aaa', fontSize: 13, marginTop: 8, lineHeight: 18 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  verifiedText: { color: '#00d4ff', fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  rowText: { color: '#fff', fontSize: 14, flex: 1, marginLeft: 12 },
});
