import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface RevenueSource {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  estimatedRevenue: number;
}

export default function MonetizationSettingsScreen() {
  const router = useRouter();
  const [sources, setSources] = useState<RevenueSource[]>([
    { id: 'ads', name: 'Video Ads', description: 'Pre-roll and mid-roll ads on your videos', icon: 'videocam', enabled: true, estimatedRevenue: 45000 },
    { id: 'memberships', name: 'Channel Memberships', description: 'Monthly subscriptions from fans', icon: 'people', enabled: false, estimatedRevenue: 12000 },
    { id: 'tips', name: 'Super Thanks / Tips', description: 'One-time tips from viewers', icon: 'heart', enabled: true, estimatedRevenue: 8500 },
    { id: 'sponsorships', name: 'Brand Sponsorships', description: 'Partner with brands for featured content', icon: 'briefcase', enabled: false, estimatedRevenue: 25000 },
    { id: 'merch', name: 'Merchandise', description: 'Sell branded products through your channel', icon: 'shirt', enabled: false, estimatedRevenue: 0 },
  ]);

  const [payoutMethod, setPayoutMethod] = useState<'wallet' | 'bank' | 'mpesa'>('wallet');
  const [minPayout, setMinPayout] = useState(1000);

  const toggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const totalEstimated = sources.filter((s) => s.enabled).reduce((sum, s) => sum + s.estimatedRevenue, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>💰 Monetization</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Revenue Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Estimated Monthly Revenue</Text>
          <Text style={styles.summaryValue}>KES {totalEstimated.toLocaleString()}</Text>
          <Text style={styles.summarySubtext}>Based on enabled revenue sources</Text>
        </View>

        {/* Revenue Sources */}
        <Text style={styles.sectionTitle}>Revenue Sources</Text>
        {sources.map((source) => (
          <View key={source.id} style={styles.sourceCard}>
            <View style={styles.sourceLeft}>
              <View style={[styles.sourceIcon, { backgroundColor: source.enabled ? '#22C55E20' : '#334155' }]}>
                <Ionicons name={source.icon as any} size={22} color={source.enabled ? '#22C55E' : '#64748B'} />
              </View>
              <View style={styles.sourceInfo}>
                <Text style={styles.sourceName}>{source.name}</Text>
                <Text style={styles.sourceDesc}>{source.description}</Text>
                <Text style={styles.sourceRevenue}>Est. KES {source.estimatedRevenue.toLocaleString()}/mo</Text>
              </View>
            </View>
            <Switch
              value={source.enabled}
              onValueChange={() => toggleSource(source.id)}
              trackColor={{ false: '#334155', true: '#22C55E' }}
            />
          </View>
        ))}

        {/* Payout Settings */}
        <Text style={styles.sectionTitle}>Payout Settings</Text>
        <View style={styles.payoutCard}>
          <Text style={styles.payoutLabel}>Payout Method</Text>
          <View style={styles.payoutRow}>
            {(['wallet', 'bank', 'mpesa'] as const).map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.payoutBtn, payoutMethod === method && styles.payoutBtnActive]}
                onPress={() => setPayoutMethod(method)}
              >
                <Ionicons
                  name={method === 'wallet' ? 'wallet' : method === 'bank' ? 'card' : 'phone-portrait'}
                  size={18}
                  color={payoutMethod === method ? '#3B82F6' : '#64748B'}
                />
                <Text style={[styles.payoutText, payoutMethod === method && styles.payoutTextActive]}>
                  {method.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.payoutLabel}>Minimum Payout (KES)</Text>
          <View style={styles.minPayoutRow}>
            {[500, 1000, 5000, 10000].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={[styles.minPayoutBtn, minPayout === amount && styles.minPayoutBtnActive]}
                onPress={() => setMinPayout(amount)}
              >
                <Text style={[styles.minPayoutText, minPayout === amount && styles.minPayoutTextActive]}>
                  {amount.toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Tax Info */}
        <View style={styles.taxCard}>
          <Ionicons name="document-text" size={20} color="#F59E0B" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.taxTitle}>Tax Information</Text>
            <Text style={styles.taxDesc}>KRA PIN required for payouts above KES 50,000/month</Text>
          </View>
          <TouchableOpacity style={styles.taxBtn}>
            <Text style={styles.taxBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { padding: 8, alignSelf: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginTop: 4 },
  summaryCard: {
    backgroundColor: '#1E293B', borderRadius: 16,
    marginHorizontal: 16, marginTop: 12, padding: 20,
    alignItems: 'center', borderWidth: 1, borderColor: '#22C55E40',
  },
  summaryLabel: { fontSize: 13, color: '#64748B', fontWeight: '600' },
  summaryValue: { fontSize: 32, fontWeight: '800', color: '#22C55E', marginTop: 8 },
  summarySubtext: { fontSize: 12, color: '#475569', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  sourceCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  sourceLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  sourceIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  sourceInfo: { marginLeft: 12, flex: 1 },
  sourceName: { fontSize: 15, fontWeight: '600', color: '#F1F5F9' },
  sourceDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2, lineHeight: 16 },
  sourceRevenue: { fontSize: 12, color: '#22C55E', marginTop: 4, fontWeight: '600' },
  payoutCard: {
    backgroundColor: '#1E293B', borderRadius: 14,
    marginHorizontal: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  payoutLabel: { fontSize: 14, fontWeight: '600', color: '#F1F5F9', marginBottom: 10 },
  payoutRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  payoutBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155',
  },
  payoutBtnActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F610' },
  payoutText: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  payoutTextActive: { color: '#3B82F6' },
  minPayoutRow: { flexDirection: 'row', gap: 8 },
  minPayoutBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#0F172A', alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  minPayoutBtnActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F610' },
  minPayoutText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  minPayoutTextActive: { color: '#3B82F6' },
  taxCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginTop: 16,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#F59E0B30',
  },
  taxTitle: { fontSize: 14, fontWeight: '600', color: '#F1F5F9' },
  taxDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  taxBtn: {
    backgroundColor: '#F59E0B20', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 8,
  },
  taxBtnText: { fontSize: 12, color: '#F59E0B', fontWeight: '700' },
});
