// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  TextInput, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { requestWithdrawal, getUserWithdrawals, WalletWithdrawal } from '@/lib/services/wallet-deposit-service';

const TABS = ['dashboard', 'submit', 'my-apps', 'earnings'] as const;

interface DeveloperApp {
  id: string; name: string; description: string; category: string;
  price: number; status: 'pending' | 'approved' | 'rejected';
  downloads: number; created_at: string;
}

export default function DeveloperScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>('dashboard');
  const [isDeveloper, setIsDeveloper] = useState(profile?.is_developer || false);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<DeveloperApp[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [withdrawals, setWithdrawals] = useState<WalletWithdrawal[]>([]);
  const [appName, setAppName] = useState('');
  const [appDesc, setAppDesc] = useState('');
  const [appCategory, setAppCategory] = useState('tools');
  const [appPrice, setAppPrice] = useState('0');
  const [isPaid, setIsPaid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: devProfile } = await supabase.from('user_profiles').select('is_developer').eq('user_id', user.id).single();
      setIsDeveloper(devProfile?.is_developer || false);
      if (devProfile?.is_developer) {
        const { data: appData } = await supabase.from('developer_apps').select('*').eq('developer_id', user.id).order('created_at', { ascending: false });
        setApps((appData || []) as DeveloperApp[]);
        const { data: earningsData } = await supabase.from('developer_earnings').select('total_earnings').eq('developer_id', user.id).single();
        setEarnings(Number(earningsData?.total_earnings) || 0);
        const wdData = await getUserWithdrawals(user.id);
        setWithdrawals(wdData);
      }
    } catch (e) { console.error('Failed to load developer data:', e); }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleApplyDeveloper() {
    if (!user?.id) { Alert.alert('Error', 'You must be logged in to apply'); return; }
    setApplying(true);
    try {
      const { error } = await supabase.from('developer_applications').insert({
        user_id: user.id, status: 'pending', applied_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert('Application Submitted', 'Your developer application is under review. You will be notified within 24-48 hours.', [{ text: 'OK' }]);
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setApplying(false); }
  }

  async function handleSubmit() {
    if (!appName.trim()) { Alert.alert('Error', 'App name is required'); return; }
    if (!appDesc.trim()) { Alert.alert('Error', 'Description is required'); return; }
    if (!user?.id) { Alert.alert('Error', 'Not logged in'); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('developer_apps').insert({
        developer_id: user.id, name: appName.trim(), description: appDesc.trim(),
        category: appCategory, price: isPaid ? Number(appPrice) || 0 : 0,
        status: 'pending', downloads: 0,
      });
      if (error) throw error;
      Alert.alert('App Submitted', 'Your app has been submitted for review. You will be notified once it is approved.', [
        { text: 'OK', onPress: () => { setActiveTab('my-apps'); setAppName(''); setAppDesc(''); setAppPrice('0'); setIsPaid(false); } }
      ]);
      loadData();
    } catch (e: any) { Alert.alert('Submission Failed', e.message); }
    finally { setSubmitting(false); }
  }

  async function handleWithdraw() {
    if (earnings <= 0) { Alert.alert('No Earnings', 'You have no earnings to withdraw yet.'); return; }
    if (!user?.id) return;
    const phone = profile?.phone || '';
    if (!phone) { Alert.alert('Phone Required', 'Please add a phone number to your profile first.'); return; }
    try {
      const result = await requestWithdrawal(user.id, earnings, phone);
      Alert.alert('Withdrawal Initiated', `KES ${result.net_amount.toLocaleString()} will be sent to ${phone}. Fee: KES ${result.fee}`);
      loadData();
    } catch (e: any) { Alert.alert('Withdrawal Failed', e.message); }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!isDeveloper) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.push('/(os)' as any)} style={styles.backBtn}>
            <Ionicons name="home-outline" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Developer Portal</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.lockedState}>
          <Ionicons name="lock-closed-outline" size={48} color="#475569" />
          <Text style={styles.lockedTitle}>Developer Access Required</Text>
          <Text style={styles.lockedDesc}>Apply to become an MTAA developer to submit apps and earn 70% revenue share on paid apps.</Text>
          <TouchableOpacity style={styles.applyBtn} onPress={handleApplyDeveloper} disabled={applying}>
            <Text style={styles.applyText}>{applying ? 'Submitting...' : 'Apply to be a Developer'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/(os)' as any)} style={styles.backBtn}>
          <Ionicons name="home-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Developer Portal</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {TABS.map((tab: any) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        {activeTab === 'dashboard' && (
          <View style={styles.tabContent}>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="apps" size={24} color="#3B82F6" />
                <Text style={styles.statValue}>{apps.filter((a: any) => a.status === 'approved').length}</Text>
                <Text style={styles.statLabel}>Published Apps</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="download" size={24} color="#10B981" />
                <Text style={styles.statValue}>{apps.reduce((s, a) => s + (a.downloads || 0), 0)}</Text>
                <Text style={styles.statLabel}>Total Downloads</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="cash" size={24} color="#F59E0B" />
                <Text style={styles.statValue}>KES {earnings.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Total Earnings</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="star" size={24} color="#EC4899" />
                <Text style={styles.statValue}>0.0</Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
              </View>
            </View>
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>Welcome to the MTAA Developer Portal. Submit your apps, track performance, and earn 70% revenue share on paid apps.</Text>
            </View>
          </View>
        )}
        {activeTab === 'submit' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Submit New App</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>App Name *</Text>
              <TextInput style={styles.input} value={appName} onChangeText={setAppName} placeholder="My Awesome App" placeholderTextColor="#64748b" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description *</Text>
              <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={appDesc} onChangeText={setAppDesc} multiline numberOfLines={3} placeholder="What does your app do?" placeholderTextColor="#64748b" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryRow}>
                {['tools', 'social', 'commerce', 'productivity', 'entertainment', 'lifestyle'].map((c: any) => (
                  <TouchableOpacity key={c} style={[styles.categoryChip, appCategory === c && styles.categoryChipActive]} onPress={() => setAppCategory(c)}>
                    <Text style={[styles.categoryChipText, appCategory === c && styles.categoryChipTextActive]}>{c.charAt(0).toUpperCase() + c.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.label}>Paid App</Text>
              <Switch value={isPaid} onValueChange={setIsPaid} trackColor={{ false: '#334155', true: '#3B82F6' }} />
            </View>
            {isPaid && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Price (KES)</Text>
                <TextInput style={styles.input} value={appPrice} onChangeText={setAppPrice} keyboardType="number-pad" placeholder="100" placeholderTextColor="#64748b" />
              </View>
            )}
            <TouchableOpacity style={[styles.submitBtn, submitting && styles.submittingBtn]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit for Review'}</Text>
            </TouchableOpacity>
            <Text style={styles.feeText}>Developer fee: KES 1,500 per submission. 70% revenue share.</Text>
          </View>
        )}
        {activeTab === 'my-apps' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>My Submissions</Text>
            {apps.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="cube-outline" size={40} color="#475569" />
                <Text style={styles.emptyText}>No apps submitted yet</Text>
              </View>
            ) : (
              apps.map((app: any) => (
                <View key={app.id} style={styles.appCard}>
                  <View style={styles.appHeader}>
                    <Text style={styles.appName}>{app.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: app.status === 'approved' ? '#10B98120' : app.status === 'rejected' ? '#EF444420' : '#F59E0B20' }]}>
                      <Text style={[styles.statusText, { color: app.status === 'approved' ? '#10B981' : app.status === 'rejected' ? '#EF4444' : '#F59E0B' }]}>{app.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.appDesc}>{app.description}</Text>
                  <Text style={styles.appMeta}>Category: {app.category} | Price: KES {app.price.toLocaleString()} | Downloads: {app.downloads}</Text>
                </View>
              ))
            )}
          </View>
        )}
        {activeTab === 'earnings' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionTitle}>Earnings</Text>
            <View style={styles.earningsCard}>
              <Text style={styles.earningsLabel}>Available Balance</Text>
              <Text style={styles.earningsValue}>KES {earnings.toLocaleString()}</Text>
              <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
                <Text style={styles.withdrawText}>Withdraw to M-Pesa</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            {withdrawals.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={40} color="#475569" />
                <Text style={styles.emptyText}>No withdrawals yet</Text>
              </View>
            ) : (
              withdrawals.map((w: any) => (
                <View key={w.id} style={styles.txCard}>
                  <View style={styles.txHeader}>
                    <Text style={styles.txAmount}>KES {w.amount.toLocaleString()}</Text>
                    <Text style={[styles.txStatus, { color: w.status === 'completed' ? '#10B981' : w.status === 'failed' ? '#EF4444' : '#F59E0B' }]}>{w.status}</Text>
                  </View>
                  <Text style={styles.txDetail}>Net: KES {w.net_amount.toLocaleString()} | Fee: KES {w.fee}</Text>
                  <Text style={styles.txDate}>{new Date(w.created_at).toLocaleDateString()}</Text>
                </View>
              ))
            )}
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff', flex: 1, marginLeft: 12 },
  tabScroll: { paddingHorizontal: 20, marginBottom: 12 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, marginRight: 8, borderRadius: 20, backgroundColor: '#1e293b' },
  tabActive: { backgroundColor: '#3B82F6' },
  tabText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabContent: { paddingHorizontal: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: { width: '47%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 8 },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  infoCard: { flexDirection: 'row', backgroundColor: '#1e3a5f', borderRadius: 12, padding: 14, gap: 10 },
  infoText: { flex: 1, color: '#93C5FD', fontSize: 13, lineHeight: 18 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  inputGroup: { marginBottom: 16 },
  label: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: { backgroundColor: '#1e293b', borderRadius: 10, borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 15 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' },
  categoryChipActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  categoryChipText: { color: '#94a3b8', fontSize: 12 },
  categoryChipTextActive: { color: '#fff', fontWeight: '600' },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  submitBtn: { backgroundColor: '#3B82F6', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  submittingBtn: { backgroundColor: '#1e3a5f' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  feeText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 12 },
  emptyCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  emptyText: { color: '#64748b', fontSize: 14, marginTop: 12 },
  appCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  appName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  appDesc: { color: '#94a3b8', fontSize: 13, marginBottom: 6 },
  appMeta: { color: '#64748b', fontSize: 12 },
  earningsCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#334155', marginBottom: 16 },
  earningsLabel: { color: '#94a3b8', fontSize: 13 },
  earningsValue: { color: '#fff', fontSize: 32, fontWeight: '800', marginTop: 8 },
  withdrawBtn: { backgroundColor: '#10B981', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
  withdrawText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  txCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  txAmount: { color: '#fff', fontSize: 16, fontWeight: '600' },
  txStatus: { fontSize: 12, fontWeight: '600', textTransform: 'capitalize' },
  txDetail: { color: '#94a3b8', fontSize: 12 },
  txDate: { color: '#64748b', fontSize: 11, marginTop: 4 },
  lockedState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  lockedTitle: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: 16 },
  lockedDesc: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  applyBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, marginTop: 24 },
  applyText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
