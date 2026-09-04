import { useState } from 'react';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/config';
import { mtaaFee, fmtKES, TX_LIMIT } from '@/lib/wallet/fees';

export default function WithdrawScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState(0);
  const [busy, setBusy] = useState(false);
  const num = parseFloat(amount) || 0;
  const fee = mtaaFee(num);
  const total = num + fee;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: w } = await supabase.from('wallet_accounts').select('balance').eq('user_id', user.id).limit(1).maybeSingle();
      if (w) setBalance(Number(w.balance) || 0);
    })();
  }, []);

  const withdraw = async () => {
    if (num < 1) { window.alert('Withdraw: minimum KSh 1'); return; }
    if (num > TX_LIMIT) { window.alert('Withdraw: max KSh 500,000 per transaction'); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('mtaa_withdraw', { p_phone: phone.trim(), p_amount: num });
    setBusy(false);
    if (error) { window.alert('Withdraw Failed: ' + error.message); return; }
    const r: any = data;
    if (!r?.ok) { window.alert('Withdraw Failed: ' + String((r && r.error) || 'unknown')); return; }
    window.alert('Withdrawal of ' + fmtKES(num) + ' queued to ' + phone + ' | Ref ' + r.ref + ' | Fee ' + fmtKES(r.fee) + ' | Balance ' + fmtKES(Number(r.balance)));
    router.back();
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Withdraw</Text>
      <Text style={styles.sub}>Available: {fmtKES(balance)} • Free under KSh 1,000 • Max KSh 500,000</Text>
      <TextInput style={styles.input} placeholder="Amount (KSh) — any amount" placeholderTextColor="#8E8E93" value={amount} onChangeText={setAmount} keyboardType="numeric" />
      <View style={styles.chips}>
        {[100, 500, 1000, 2000, 5000].map(v => (
          <TouchableOpacity key={v} style={styles.chip} onPress={() => setAmount(String(v))}><Text style={styles.chipText}>KSh {v}</Text></TouchableOpacity>
        ))}
      </View>
      <TextInput style={styles.input} placeholder="Withdraw To (2547XXXXXXXX)" placeholderTextColor="#8E8E93" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <View style={styles.feeRow}>
        <Text style={styles.feeText}>Fee: {fmtKES(fee)}</Text>
        <Text style={styles.feeText}>Total debit: {fmtKES(total)}</Text>
      </View>
      <TouchableOpacity style={styles.btn} onPress={withdraw} disabled={busy}>
        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Withdraw {fmtKES(num)}</Text>}
      </TouchableOpacity>
      <Text style={styles.note}>Funds are sent to your M-Pesa number. Fees go to the MTAA Treasury.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F', padding: 16, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 4 },
  sub: { color: '#8E8E93', marginBottom: 16, fontSize: 12 },
  input: { backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, color: '#fff', marginBottom: 12, fontSize: 16 },
  chips: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  chip: { backgroundColor: '#2C2C2E', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  chipText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  feeText: { color: '#8E8E93', fontSize: 13 },
  btn: { backgroundColor: '#E11D48', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 10 },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  note: { color: '#8E8E93', fontSize: 11, textAlign: 'center' },
});
