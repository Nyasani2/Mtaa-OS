// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Send, Wallet as WalletIcon, History, Shield, PiggyBank, Users, Bitcoin } from 'lucide-react-native';

export default function WalletScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [balance, setBalance] = useState(0);
  const [currency, setCurrency] = useState('KES');
  const [txs, setTxs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setError(null);
    try {
      let acc = (await supabase.from('wallet_accounts').select('balance, currency').eq('user_id', user.id).maybeSingle()).data;
      if (!acc) {
        for (const params of [{ p_user_id: user.id }, { user_id: user.id }]) {
          const r = await supabase.rpc('mtaa_get_or_create_wallet', params);
          if (!r.error) break;
        }
        acc = (await supabase.from('wallet_accounts').select('balance, currency').eq('user_id', user.id).maybeSingle()).data;
      }
      setBalance(acc?.balance || 0);
      setCurrency(acc?.currency || 'KES');
      const t = await supabase.from('wallet_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
      setTxs(t.data || []);
    } catch (e) { setError(String(e?.message || e)); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { if (isAuthenticated && user?.id) load(); else setLoading(false); }, [isAuthenticated, user?.id, load]);

  const deposit = async () => {
    const amt = parseFloat(window.prompt('Amount (KES) to deposit (M-Pesa):', '100') || '0');
    if (!amt || amt <= 0) return;
    const r = await supabase.rpc('mtaa_credit_wallet', { p_user_id: user.id, p_amount: amt, p_description: 'Wallet deposit', p_reference: null, p_topup_method: null });
    if (r.error) return Alert.alert('Deposit failed', r.error.message);
    Alert.alert('Deposited', `KES ${amt.toFixed(2)} added to wallet`);
    load();
  };

  const withdraw = async () => {
    const amt = parseFloat(window.prompt('Amount (KES) to withdraw to M-Pesa:', '100') || '0');
    if (!amt || amt <= 0) return;
    const r = await supabase.rpc('wallet_withdraw', { p_user: user.id, p_amount: amt });
    if (r.error) return Alert.alert('Withdraw failed', r.error.message);
    Alert.alert('Withdrawn', `KES ${amt.toFixed(2)} sent to M-Pesa`);
    load();
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0f1a' }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#22d3ee" />}>
      <View style={{ padding: 20, paddingTop: 56 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <WalletIcon size={22} color="#22d3ee" />
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800' }}>Wallet</Text>
        </View>

        {error ? <View style={{ backgroundColor: '#3a1a1a', borderRadius: 10, padding: 12, marginBottom: 12 }}><Text style={{ color: '#ff6b6b', fontSize: 13 }}>{error}</Text></View> : null}
        {!isAuthenticated ? <Text style={{ color: '#888', fontSize: 14, marginBottom: 12 }}>Sign in to use your wallet.</Text> : null}

        <View style={{ backgroundColor: '#101826', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#1e293b', marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12 }}>Available balance</Text>
          {loading ? <ActivityIndicator color="#22d3ee" style={{ marginTop: 10 }} /> : (
            <Text style={{ color: '#fff', fontSize: 34, fontWeight: '800', marginTop: 4 }}>{currency} {Number(balance || 0).toFixed(2)}</Text>
          )}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity onPress={deposit} style={{ flex: 1, backgroundColor: '#06b6d4', borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <ArrowDownLeft size={16} color="#04222b" /><Text style={{ color: '#04222b', fontWeight: '700' }}>Deposit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={withdraw} style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <ArrowUpRight size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700' }}>Withdraw</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/wallet/send')} style={{ flex: 1, backgroundColor: '#1e293b', borderRadius: 10, paddingVertical: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <Send size={16} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700' }}>Send</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {[
            { icon: Shield, label: 'Escrow', route: '/wallet/escrow' },
            { icon: PiggyBank, label: 'Savings', route: '/wallet/savings-loans' },
            { icon: Users, label: 'Agent', route: '/wallet/agent' },
            { icon: Bitcoin, label: 'Crypto', route: '/wallet/crypto' },
          ].map((q) => (
            <TouchableOpacity key={q.label} onPress={() => router.push(q.route)} style={{ flex: 1, backgroundColor: '#101826', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' }}>
              <q.icon size={18} color="#22d3ee" /><Text style={{ color: '#bbb', fontSize: 11, marginTop: 6 }}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <History size={16} color="#888" /><Text style={{ color: '#fff', fontWeight: '700' }}>Recent transactions</Text>
        </View>
        {loading ? <ActivityIndicator color="#22d3ee" /> : txs.length === 0 ? (
          <View style={{ backgroundColor: '#101826', borderRadius: 12, padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#888', fontSize: 13 }}>No transactions yet. Deposit to get started.</Text>
          </View>
        ) : txs.map((t) => (
          <View key={t.id} style={{ backgroundColor: '#101826', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{t.description || t.type}</Text>
              <Text style={{ color: '#666', fontSize: 11, marginTop: 2 }}>{t.created_at ? new Date(t.created_at).toLocaleString() : ''} · {t.status}</Text>
            </View>
            <Text style={{ color: (t.type === 'credit' || t.type === 'top_up' || t.type === 'deposit') ? '#4ade80' : '#ff6b6b', fontWeight: '700' }}>
              {(t.type === 'credit' || t.type === 'top_up' || t.type === 'deposit') ? '+' : '-'}{Number(t.amount || 0).toFixed(2)}
            </Text>
          </View>
        ))}
        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}
