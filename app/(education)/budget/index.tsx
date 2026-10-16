// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
export default function BudgetScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = async () => {
    try {
      const { data, error } = await supabase
        .from('education_budgets')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setBudgets(data || []);
    } catch (err) {
      console.error('[Budget] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(); };
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }
  const totalBudget = budgets.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Budgets</Text>
        <TouchableOpacity onPress={() => router.push('/(education)/budget/create' as any)}>
          <Ionicons name="add-circle" size={24} color="#f59e0b" />
        </TouchableOpacity>
      </View>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Budget</Text>
        <Text style={styles.summaryValue}>KES {totalBudget.toLocaleString()}</Text>
        <Text style={styles.summarySub}>{budgets.length} budget entries</Text>
      </View>
      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardAmount}>KES {(parseFloat(item.amount) || 0).toLocaleString()}</Text>
            <Text style={styles.cardBody}>{item.description || 'No description'}</Text>
            <Text style={styles.cardDate}>{item.fiscal_year || ''} · {new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calculator-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No budgets created</Text>
          </View>
        }
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, backgroundColor: '#1e293b' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  summaryCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#f59e0b' },
  summaryLabel: { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', fontWeight: '600' },
  summaryValue: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: 4 },
  summarySub: { color: '#64748b', fontSize: 13, marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cardAmount: { color: '#f59e0b', fontSize: 20, fontWeight: '800', marginTop: 4 },
  cardBody: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  cardDate: { color: '#64748b', fontSize: 12, marginTop: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#64748b', marginTop: 12, fontSize: 16 },
});
