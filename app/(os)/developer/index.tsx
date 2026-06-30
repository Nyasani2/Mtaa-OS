import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function DeveloperScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [devMode, setDevMode] = useState(profile?.is_developer || false);

  // Mock data for developer dashboard
  const apps = [
    { id: '1', name: 'MyShop App', status: 'published', earnings: 45000, downloads: 1200, commission: 4500 },
    { id: '2', name: 'Kisumu Delivery', status: 'pending_review', earnings: 0, downloads: 0, commission: 0 },
    { id: '3', name: 'School Manager', status: 'draft', earnings: 0, downloads: 0, commission: 0 },
  ];

  const totalEarnings = apps.reduce((sum, a) => sum + a.earnings, 0);
  const totalCommission = apps.reduce((sum, a) => sum + a.commission, 0);
  const mtaaShare = totalEarnings * 0.10; // 10% platform commission

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Developer</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Dev Mode Toggle */}
        <View style={styles.devModeCard}>
          <View style={{ flex: 1 }}>
            <Text style={styles.devModeTitle}>Developer Mode</Text>
            <Text style={styles.devModeSub}>Enable to submit apps and view earnings</Text>
          </View>
          <Switch value={devMode} onValueChange={setDevMode} trackColor={{ false: '#64748b', true: '#6366F1' }} />
        </View>

        {/* Earnings Summary */}
        <View style={styles.earningsRow}>
          <View style={[styles.earningsCard, { backgroundColor: '#10B98115' }]}>
            <Text style={[styles.earningsValue, { color: '#10B981' }]}>KES {totalEarnings.toLocaleString()}</Text>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
          </View>
          <View style={[styles.earningsCard, { backgroundColor: '#6366F115' }]}>
            <Text style={[styles.earningsValue, { color: '#6366F1' }]}>KES {totalCommission.toLocaleString()}</Text>
            <Text style={styles.earningsLabel}>Your 90%</Text>
          </View>
        </View>

        <View style={[styles.mtaaCard, { backgroundColor: '#F59E0B15' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="wallet-outline" size={20} color="#F59E0B" />
            <Text style={[styles.mtaaText, { color: '#F59E0B' }]}>
              MTAA Treasury (10%): KES {mtaaShare.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.mtaaSub}>$15 per app + 10% of all transactions</Text>
        </View>

        {/* Submit New App */}
        <TouchableOpacity style={styles.submitBtn} onPress={() => {}}>
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.submitBtnText}>Submit New App ($15)</Text>
        </TouchableOpacity>

        {/* My Apps */}
        <Text style={styles.sectionTitle}>My Apps</Text>
        {apps.map((app) => (
          <View key={app.id} style={styles.appCard}>
            <View style={styles.appHeader}>
              <View style={[styles.statusDot, { backgroundColor: app.status === 'published' ? '#10B981' : app.status === 'pending_review' ? '#F59E0B' : '#94A3B8' }]} />
              <Text style={styles.appName}>{app.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: app.status === 'published' ? '#10B98120' : app.status === 'pending_review' ? '#F59E0B20' : '#94A3B820' }]}>
                <Text style={[styles.statusText, { color: app.status === 'published' ? '#10B981' : app.status === 'pending_review' ? '#F59E0B' : '#94A3B8' }]}>
                  {app.status.replace('_', ' ')}
                </Text>
              </View>
            </View>
            <View style={styles.appStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>KES {app.earnings.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Earnings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{app.downloads}</Text>
                <Text style={styles.statLabel}>Downloads</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>KES {app.commission.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Your Cut</Text>
              </View>
            </View>
          </View>
        ))}

        {/* ASIS Review Info */}
        <View style={styles.asisCard}>
          <Ionicons name="sparkles-outline" size={24} color="#6366F1" />
          <Text style={styles.asisTitle}>ASIS AI Review</Text>
          <Text style={styles.asisText}>
            All apps are checked by ASIS for security, performance, and consistency before publishing. 
            Review takes 24-48 hours. Fee: $15 per submission.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  content: { padding: 16 },
  devModeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 },
  devModeTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  devModeSub: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  earningsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  earningsCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  earningsValue: { fontSize: 18, fontWeight: 'bold' },
  earningsLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  mtaaCard: { borderRadius: 12, padding: 14, marginBottom: 16 },
  mtaaText: { fontSize: 14, fontWeight: '600' },
  mtaaSub: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6366F1', borderRadius: 12, padding: 16, marginBottom: 20 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  appCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10 },
  appHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  appName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  appStats: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  asisCard: { backgroundColor: '#6366F110', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 },
  asisTitle: { fontSize: 15, fontWeight: '600', color: '#6366F1', marginTop: 8 },
  asisText: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
