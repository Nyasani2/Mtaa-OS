import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase/config';

export default function HistoryScreen() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data: wt } = await supabase.from('wallet_transactions').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    const { data: mt } = await supabase.from('mpesa_transactions').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
    const combined = [
      ...(wt || []).map((t: any) => ({ id: t.id, dir: t.direction === 'debit' ? 'debit' : 'credit', description: t.description || t.transaction_type || 'Transaction', created_at: t.created_at, amount: t.amount, code: t.reference || String(t.id).replace(/-/g, '').slice(0, 8).toUpperCase(), status: t.status })),
      ...(mt || []).map((t: any) => ({ id: t.id, dir: t.status === 'completed' ? 'credit' : 'pending', description: 'M-Pesa ' + (t.transaction_type || 'deposit'), created_at: t.created_at, amount: t.amount, code: t.mpesa_receipt || String(t.checkout_request_id || t.id).replace(/-/g, '').slice(-8).toUpperCase(), status: t.status })),
    ].sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    setRows(combined);
    setLoading(false);
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 15000); return () => clearInterval(iv); }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transaction History</Text>
      {loading ? <ActivityIndicator color="#007AFF" /> : (
        <FlatList
          data={rows}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} tintColor="#fff" />}
          keyExtractor={(item) => String(item.id)}
          ListEmptyComponent={<Text style={styles.empty}>No transactions yet</Text>}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.desc}>{item.description}</Text>
                <Text style={styles.meta}>#{item.code} • {new Date(item.created_at).toLocaleString('en-KE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} • {item.status}</Text>
              </View>
              <Text style={[styles.amount, { color: item.dir === 'credit' ? '#34C759' : '#FF3B30' }]}>
                {item.dir === 'credit' ? '+' : '-'}KSh {Number(item.amount).toLocaleString('en-KE')}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 16, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 16 },
  empty: { color: '#8E8E93', textAlign: 'center', marginTop: 40 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, marginBottom: 8 },
  desc: { color: '#fff', fontWeight: '600', fontSize: 15 },
  meta: { color: '#8E8E93', fontSize: 11, marginTop: 4 },
  amount: { fontWeight: '800', fontSize: 15 },
});
