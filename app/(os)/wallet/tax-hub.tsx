import { useState, useEffect } from 'react';
// app/(os)/wallet/tax-hub.tsx
// MTAA Tax Hub -- Taxpayer registration, liability tracking, payment processing

import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { Alert,
  calculateTax,
  processTaxPayment,
  generateTaxpayerId,
  getTaxpayerByUser,
  getTaxRecords,
  getTaxLiabilities,
  getRevenuePayments,
} from '@/lib/services/tax-service';

export default function TaxHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [taxpayer, setTaxpayer] = useState<any>(null);
  const [taxRecords, setTaxRecords] = useState<any[]>([]);
  const [liabilities, setLiabilities] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'payments'>('overview');
  const [calcAmount, setCalcAmount] = useState('');
  const [calcResult, setCalcResult] = useState<any>(null);

  useEffect(() => { if (user?.id) loadData(); }, [user?.id]);

  async function loadData() {
    setLoading(true);
    try {
      const tp = await getTaxpayerByUser(user!.id);
      setTaxpayer(tp);
      if (tp) {
        const [records, liabs, pays] = await Promise.all([
          getTaxRecords(tp.id),
          getTaxLiabilities(user!.id),
          getRevenuePayments(tp.id),
        ]);
        setTaxRecords(records || []);
        setLiabilities(liabs || []);
        setPayments(pays || []);
      }
    } catch (err) { console.error('[TaxHub] Load error:', err); }
    finally { setLoading(false); }
  }

  async function handleRegister() {
    try {
      await generateTaxpayerId({
        user_id: user!.id,
        tax_type: 'income',
        jurisdiction: 'KE',
      });
      Alert.alert('Success', 'Taxpayer ID generated');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Registration failed');
    }
  }

  async function handleCalculate() {
    const amount = parseFloat(calcAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    try {
      const result = await calculateTax({
        module: 'mtaxi',
        amount,
        country: 'KE',
      });
      setCalcResult(result);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Calculation failed');
    }
  }

  async function handlePayTax(recordId: string, amount: number) {
    try {
      await processTaxPayment({
        tax_record_id: recordId,
        amount,
        payment_method: 'wallet',
      });
      Alert.alert('Success', 'Tax payment processed');
      loadData();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Payment failed');
    }
  }

  const totalDue = taxRecords.reduce((sum, r) => sum + (r.balance || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Hub</Text>
        <TouchableOpacity onPress={loadData}>
          <Ionicons name="refresh" size={22} color="#6366f1" />
        </TouchableOpacity>
      </View>

      {!taxpayer ? (
        <View style={styles.registerCard}>
          <Ionicons name="receipt-outline" size={48} color="#6366f1" />
          <Text style={styles.registerTitle}>Not Registered as Taxpayer</Text>
          <Text style={styles.registerDesc}>Register to manage your tax obligations, file returns, and make payments.</Text>
          <TouchableOpacity style={styles.registerBtn} onPress={handleRegister}>
            <Text style={styles.registerBtnText}>Generate Taxpayer ID</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.taxpayerCard}>
            <View style={styles.taxpayerRow}>
              <View>
                <Text style={styles.taxpayerLabel}>Taxpayer Number</Text>
                <Text style={styles.taxpayerValue}>{taxpayer.taxpayer_number}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: taxpayer.status === 'active' ? '#dcfce7' : '#fee2e2' }]}>
                <Text style={[styles.statusText, { color: taxpayer.status === 'active' ? '#059669' : '#dc2626' }]}>{taxpayer.status}</Text>
              </View>
            </View>
            <View style={styles.taxpayerRow}>
              <View>
                <Text style={styles.taxpayerLabel}>Total Due</Text>
                <Text style={[styles.taxpayerValue, { color: '#dc2626' }]}>KSh {totalDue.toLocaleString('en-KE')}</Text>
              </View>
              <View>
                <Text style={styles.taxpayerLabel}>Total Paid</Text>
                <Text style={[styles.taxpayerValue, { color: '#059669' }]}>KSh {totalPaid.toLocaleString('en-KE')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.calcCard}>
            <Text style={styles.calcTitle}>Tax Calculator</Text>
            <View style={styles.calcRow}>
              <TextInput
                style={[styles.calcInput, { flex: 1 }]}
                placeholder="Amount"
                value={calcAmount}
                onChangeText={setCalcAmount}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate}>
                <Text style={styles.calcBtnText}>Calculate</Text>
              </TouchableOpacity>
            </View>
            {calcResult && (
              <View style={styles.calcResult}>
                <Text style={styles.calcResultText}>Tax: KSh {(calcResult.tax_amount || 0).toLocaleString('en-KE')}</Text>
                <Text style={styles.calcResultText}>Rate: {calcResult.tax_rate || 0}%</Text>
                <Text style={styles.calcResultText}>Net: KSh {(calcResult.net_amount || 0).toLocaleString('en-KE')}</Text>
              </View>
            )}
          </View>

          <View style={styles.tabs}>
            {(['overview', 'records', 'payments'] as const).map((tab) => (
              <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {loading ? (
            <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#6366f1" />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {activeTab === 'overview' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Pending Liabilities</Text>
                  {liabilities.length === 0 ? (
                    <Text style={styles.emptyText}>No pending liabilities</Text>
                  ) : (
                    liabilities.map((l) => (
                      <View key={l.id} style={styles.listItem}>
                        <View style={styles.listInfo}>
                          <Text style={styles.listTitle}>{l.tax_type || 'Tax Liability'}</Text>
                          <Text style={styles.listMeta}>Due: {new Date(l.due_date).toLocaleDateString('en-KE')}</Text>
                        </View>
                        <Text style={[styles.listAmount, { color: '#dc2626' }]}>KSh {(l.amount || 0).toLocaleString('en-KE')}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}

              {activeTab === 'records' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tax Records</Text>
                  {taxRecords.map((r) => (
                    <View key={r.id} style={styles.listItem}>
                      <View style={styles.listInfo}>
                        <Text style={styles.listTitle}>{r.tax_type} &middot; {r.tax_period}</Text>
                        <Text style={styles.listMeta}>Status: {r.status} &middot; Due: {new Date(r.due_date).toLocaleDateString('en-KE')}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.listAmount, { color: '#dc2626' }]}>KSh {(r.balance || 0).toLocaleString('en-KE')}</Text>
                        {r.balance > 0 && (
                          <TouchableOpacity onPress={() => handlePayTax(r.id, r.balance)}>
                            <Text style={styles.payLink}>Pay Now</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {activeTab === 'payments' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Payment History</Text>
                  {payments.map((p) => (
                    <View key={p.id} style={styles.listItem}>
                      <View style={[styles.listIcon, { backgroundColor: '#dcfce7' }]}>
                        <Ionicons name="checkmark-circle" size={18} color="#059669" />
                      </View>
                      <View style={styles.listInfo}>
                        <Text style={styles.listTitle}>Tax Payment</Text>
                        <Text style={styles.listMeta}>{new Date(p.paid_at).toLocaleDateString('en-KE')} &middot; {p.payment_method}</Text>
                      </View>
                      <Text style={[styles.listAmount, { color: '#059669' }]}>KSh {(p.amount || 0).toLocaleString('en-KE')}</Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  registerCard: { margin: 24, padding: 24, backgroundColor: '#fff', borderRadius: 16, alignItems: 'center' },
  registerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 16 },
  registerDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 20 },
  registerBtn: { backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  registerBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  taxpayerCard: { margin: 16, padding: 16, backgroundColor: '#fff', borderRadius: 16 },
  taxpayerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  taxpayerLabel: { fontSize: 12, color: '#94a3b8' },
  taxpayerValue: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  calcCard: { marginHorizontal: 16, marginBottom: 16, padding: 16, backgroundColor: '#fff', borderRadius: 16 },
  calcTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  calcRow: { flexDirection: 'row', gap: 10 },
  calcInput: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  calcBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, justifyContent: 'center' },
  calcBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  calcResult: { marginTop: 12, padding: 12, backgroundColor: '#f1f5f9', borderRadius: 10 },
  calcResultText: { fontSize: 13, color: '#334155', marginBottom: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center' },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  section: { marginTop: 8, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8 },
  listIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  listMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  listAmount: { fontSize: 14, fontWeight: '700' },
  payLink: { fontSize: 12, color: '#6366f1', fontWeight: '700', marginTop: 4 },
  emptyText: { fontSize: 14, color: '#94a3b8', paddingVertical: 20 },
});

