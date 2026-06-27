import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface FeeStatement {
  id: string;
  fee_type: string;
  amount: number;
  amount_paid: number;
  balance: number;
  due_date: string;
  status: string;
  term: string;
  year: number;
}

interface Child {
  id: string;
  full_name: string;
  school_name: string;
  grade_level: string;
  admission_number: string;
}

export default function SchoolFeesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [children, setChildren] = useState<Child[]>([]);
  const [statements, setStatements] = useState<FeeStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [walletBalance, setWalletBalance] = useState(0);

  const fetchChildren = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('education_student_parents')
      .select('student_id')
      .eq('parent_id', user.id);

    if (!data || data.length === 0) { setChildren([]); setLoading(false); return; }

    const studentIds = data.map(d => d.student_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', studentIds);

    const { data: enrollments } = await supabase
      .from('education_enrollments')
      .select('student_id, class_id, schools:school_id(name)')
      .in('student_id', studentIds)
      .eq('status', 'active');

    const mapped = (profiles || []).map(p => {
      const enrollment = enrollments?.find(e => e.student_id === p.id);
      return {
        id: p.id,
        full_name: p.display_name || 'Student',
        school_name: enrollment?.schools?.name || 'Unknown School',
        grade_level: '',
        admission_number: p.id.slice(0, 8).toUpperCase(),
      };
    });

    setChildren(mapped);
    if (mapped.length > 0) setSelectedChild(mapped[0].id);
  }, [user?.id]);

  const fetchStatements = useCallback(async () => {
    if (!selectedChild) return;
    const { data } = await supabase
      .from('education_fee_statements')
      .select('*')
      .eq('student_id', selectedChild)
      .order('due_date', { ascending: false })
      .limit(20);
    setStatements(data || []);
  }, [selectedChild]);

  const fetchWallet = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('wallets')
      .select('balance')
      .eq('user_id', user.id)
      .single();
    setWalletBalance(data?.balance || 0);
  }, [user?.id]);

  useEffect(() => { fetchChildren(); fetchWallet(); }, [fetchChildren, fetchWallet]);
  useEffect(() => { fetchStatements(); }, [fetchStatements]);

  const handlePay = async (statementId: string, amount: number) => {
    if (walletBalance < amount) {
      Alert.alert('Insufficient Balance', `You need KES ${amount.toLocaleString()} but have KES ${walletBalance.toLocaleString()}`);
      return;
    }
    Alert.alert('Confirm Payment', `Pay KES ${amount.toLocaleString()}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Pay',
        onPress: async () => {
          try {
            const { error } = await supabase.rpc('pay_school_fee', {
              p_statement_id: statementId,
              p_user_id: user!.id,
              p_amount: amount,
            });
            if (error) throw error;
            Alert.alert('Success', 'Payment processed');
            fetchStatements();
            fetchWallet();
          } catch (e: any) {
            Alert.alert('Error', e.message);
          }
        },
      },
    ]);
  };

  const totalOwed = statements.filter(s => s.status !== 'paid').reduce((sum, s) => sum + s.balance, 0);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>School Fees</Text>
        <TouchableOpacity onPress={() => router.push('/education/fees/history')}>
          <Ionicons name="time-outline" size={24} color="#00d4ff" />
        </TouchableOpacity>
      </View>

      {/* Wallet Balance */}
      <View style={styles.walletCard}>
        <View>
          <Text style={styles.walletLabel}>Wallet Balance</Text>
          <Text style={styles.walletAmount}>KES {walletBalance.toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
        </View>
        <TouchableOpacity style={styles.topUpBtn} onPress={() => router.push('/wallet/deposit')}>
          <Ionicons name="add-circle" size={16} color="#000" />
          <Text style={styles.topUpText}>Top Up</Text>
        </TouchableOpacity>
      </View>

      {/* Child Selector */}
      {children.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScroll}>
          {children.map(child => (
            <TouchableOpacity
              key={child.id}
              style={[styles.childChip, selectedChild === child.id && styles.childChipActive]}
              onPress={() => setSelectedChild(child.id)}
            >
              <Text style={[styles.childChipText, selectedChild === child.id && styles.childChipTextActive]}>
                {child.full_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Total Due */}
      {totalOwed > 0 && (
        <View style={styles.dueBanner}>
          <Ionicons name="alert-circle" size={20} color="#ffaa00" />
          <Text style={styles.dueText}>Total Due: KES {totalOwed.toLocaleString()}</Text>
        </View>
      )}

      {/* Fee Statements */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {statements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#333" />
            <Text style={styles.emptyText}>No fee statements</Text>
          </View>
        ) : (
          statements.map(stmt => (
            <View key={stmt.id} style={styles.statementCard}>
              <View style={styles.statementHeader}>
                <View>
                  <Text style={styles.statementType}>{stmt.fee_type}</Text>
                  <Text style={styles.statementTerm}>{stmt.term} · {stmt.year}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(stmt.status) + '22', borderColor: getStatusColor(stmt.status) + '44' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(stmt.status) }]}>{stmt.status}</Text>
                </View>
              </View>

              <View style={styles.amountRow}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Amount</Text>
                  <Text style={styles.amountValue}>KES {stmt.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Paid</Text>
                  <Text style={[styles.amountValue, { color: '#00ff88' }]}>KES {stmt.amount_paid.toLocaleString()}</Text>
                </View>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Balance</Text>
                  <Text style={[styles.amountValue, { color: stmt.balance > 0 ? '#ff4444' : '#00ff88' }]}>KES {stmt.balance.toLocaleString()}</Text>
                </View>
              </View>

              <Text style={styles.dueDate}>Due: {new Date(stmt.due_date).toLocaleDateString()}</Text>

              {stmt.status !== 'paid' && stmt.balance > 0 && (
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={() => handlePay(stmt.id, stmt.balance)}
                >
                  <Ionicons name="card-outline" size={16} color="#000" />
                  <Text style={styles.payButtonText}>Pay KES {stmt.balance.toLocaleString()}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: '#00ff88', pending: '#ffaa00', overdue: '#ff4444',
    partial: '#00d4ff', waived: '#888',
  };
  return colors[status] || '#888';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  walletCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111', marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  walletLabel: { color: '#888', fontSize: 12 },
  walletAmount: { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 4 },
  topUpBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00d4ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4 },
  topUpText: { color: '#000', fontSize: 13, fontWeight: '600' },
  childScroll: { maxHeight: 44, paddingHorizontal: 16, marginTop: 12 },
  childChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a', marginRight: 8 },
  childChipActive: { backgroundColor: '#00d4ff15', borderColor: '#00d4ff' },
  childChipText: { color: '#888', fontSize: 13 },
  childChipTextActive: { color: '#00d4ff', fontWeight: '600' },
  dueBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffaa0011', marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 10, gap: 8, borderWidth: 1, borderColor: '#ffaa0022' },
  dueText: { color: '#ffaa00', fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingTop: 12 },
  statementCard: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  statementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statementType: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statementTerm: { color: '#888', fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  amountRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  amountItem: { alignItems: 'center' },
  amountLabel: { color: '#666', fontSize: 11, marginBottom: 2 },
  amountValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  dueDate: { color: '#666', fontSize: 12, marginBottom: 10 },
  payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00d4ff', borderRadius: 10, paddingVertical: 12, gap: 6 },
  payButtonText: { color: '#000', fontSize: 14, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 16, marginTop: 12 },
});
