// app/(education)/payroll/index.tsx — FIXED
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EducationPayrollScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [payrolls, setPayrolls] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadPayroll();
  }, [user?.id]);

  async function loadPayroll() {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('education_payroll')
        .select('*, teacher:education_teachers(name, email)')
        .eq('teacher_id', user.id)
        .order('pay_period', { ascending: false });
      setPayrolls(data || []);
    } catch (err) {
      console.error('[Edu Payroll] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>Sign in to view payroll</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/sign-in')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const totalEarnings = payrolls.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payroll</Text>
        <TouchableOpacity onPress={loadPayroll}>
          <Ionicons name="refresh" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Earnings</Text>
        <Text style={styles.summaryAmount}>${totalEarnings.toFixed(2)}</Text>
      </View>

      <Text style={styles.sectionTitle}>Pay History</Text>

      <FlatList
        data={payrolls}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="cash-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No payroll records yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.payCard}>
            <View style={styles.payHeader}>
              <Text style={styles.payPeriod}>{item.pay_period}</Text>
              <Text style={[styles.payStatus, { color: item.status === 'paid' ? '#34C759' : '#FF9500' }]}>
                {item.status?.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.payAmount}>${item.amount?.toFixed(2)}</Text>
            <Text style={styles.payDate}>Processed: {item.processed_at ? new Date(item.processed_at).toLocaleDateString() : 'Pending'}</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  summaryCard: { backgroundColor: '#34C759', margin: 16, padding: 24, borderRadius: 16, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginBottom: 8 },
  summaryAmount: { color: '#fff', fontSize: 32, fontWeight: '700' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1a1a1a', paddingHorizontal: 20, marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 8 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  payCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  payHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  payPeriod: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  payStatus: { fontSize: 12, fontWeight: '600' },
  payAmount: { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 4 },
  payDate: { fontSize: 12, color: '#999' },
});
