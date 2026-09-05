// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { cryptoService } from '@/lib/services/crypto-service';

const CURRENCIES = ['BTC', 'ETH', 'USDT', 'BNB'];

export default function BinanceScreen() {
  const { user } = useAuthStore();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(null); // 'transfer' | 'convert' | 'create'
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ toAddress: '', amount: '', toCurrency: 'ETH', createCurrency: 'BTC' });

  const load = async () => { if (user?.id) setWallets(await cryptoService.getWallets(user.id)); };
  useEffect(() => { load(); }, [user?.id]);

  const open = (type, wallet) => { setSelected(wallet); setModal(type); };

  const createWallet = async () => {
    setLoading(true);
    try { await cryptoService.createWallet(user.id, form.createCurrency, 'mainnet'); await load(); setModal(null); }
    finally { setLoading(false); }
  };

  const transfer = async () => {
    setLoading(true);
    try {
      await cryptoService.initiateTransfer(selected.id, form.toAddress, parseFloat(form.amount || '0'));
      await load(); setModal(null); setForm({ ...form, toAddress: '', amount: '' });
    } finally { setLoading(false); }
  };

  const convert = async () => {
    setLoading(true);
    try {
      await cryptoService.convertCrypto(selected.id, form.toCurrency, parseFloat(form.amount || '0'));
      await load(); setModal(null); setForm({ ...form, amount: '' });
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Crypto Wallet</Text>
      <Text style={s.subtitle}>Deposit, transfer and convert across chains</Text>

      {wallets.map((w) => (
        <View key={w.id} style={s.walletCard}>
          <View style={s.walletTop}>
            <Text style={s.walletCurrency}>{w.currency}</Text>
            <Text style={s.walletBalance}>{Number(w.balance || 0).toFixed(6)}</Text>
          </View>
          <Text style={s.walletAddress} numberOfLines={1}>{w.address}</Text>
          <View style={s.walletActions}>
            <TouchableOpacity style={s.actionBtn} onPress={() => open('transfer', w)}>
              <Ionicons name="paper-plane-outline" size={16} color="#0ea5e9" />
              <Text style={s.actionText}>Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.actionBtn} onPress={() => open('convert', w)}>
              <Ionicons name="swap-horizontal-outline" size={16} color="#f59e0b" />
              <Text style={s.actionText}>Convert</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <TouchableOpacity style={s.addBtn} onPress={() => setModal('create')}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={s.addBtnText}>Add Wallet</Text>
      </TouchableOpacity>

      {modal && (
        <View style={s.overlay}>
          <View style={s.modal}>
            {modal === 'create' && (
              <>
                <Text style={s.modalTitle}>Create Wallet</Text>
                <View style={s.currRow}>
                  {CURRENCIES.map((c) => (
                    <TouchableOpacity key={c} style={[s.chip, form.createCurrency === c && s.chipActive]} onPress={() => setForm({ ...form, createCurrency: c })}>
                      <Text style={[s.chipText, form.createCurrency === c && s.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={s.submitBtn} onPress={createWallet} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Create</Text>}
                </TouchableOpacity>
              </>
            )}
            {modal === 'transfer' && selected && (
              <>
                <Text style={s.modalTitle}>Send {selected.currency}</Text>
                <TextInput style={s.input} placeholder="Recipient address" value={form.toAddress} onChangeText={(v) => setForm({ ...form, toAddress: v })} />
                <TextInput style={s.input} placeholder="Amount" keyboardType="decimal-pad" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} />
                <TouchableOpacity style={s.submitBtn} onPress={transfer} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Send</Text>}
                </TouchableOpacity>
              </>
            )}
            {modal === 'convert' && selected && (
              <>
                <Text style={s.modalTitle}>Convert {selected.currency}</Text>
                <TextInput style={s.input} placeholder="Amount" keyboardType="decimal-pad" value={form.amount} onChangeText={(v) => setForm({ ...form, amount: v })} />
                <Text style={s.label}>To:</Text>
                <View style={s.currRow}>
                  {CURRENCIES.filter((c) => c !== selected.currency).map((c) => (
                    <TouchableOpacity key={c} style={[s.chip, form.toCurrency === c && s.chipActive]} onPress={() => setForm({ ...form, toCurrency: c })}>
                      <Text style={[s.chipText, form.toCurrency === c && s.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity style={s.submitBtn} onPress={convert} disabled={loading}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Convert</Text>}
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity style={s.cancelBtn} onPress={() => setModal(null)}>
              <Text style={s.cancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  content: { padding: 16, paddingTop: 48 },
  title: { fontSize: 24, fontWeight: '800', color: '#f8fafc' },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 20 },
  walletCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 16, marginBottom: 12 },
  walletTop: { flexDirection: 'row', justifyContent: 'space-between' },
  walletCurrency: { fontSize: 18, fontWeight: '700', color: '#f59e0b' },
  walletBalance: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  walletAddress: { fontSize: 12, color: '#64748b', marginVertical: 8 },
  walletActions: { flexDirection: 'row', gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  actionText: { color: '#e2e8f0', fontSize: 13, fontWeight: '600' },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f59e0b', borderRadius: 12, padding: 14, marginTop: 8 },
  addBtnText: { color: '#fff', fontWeight: '700' },
  overlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modal: { width: '88%', backgroundColor: '#1e293b', borderRadius: 14, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginBottom: 14 },
  input: { backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#f8fafc', marginBottom: 10 },
  label: { color: '#94a3b8', fontSize: 13, marginBottom: 6 },
  currRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#0f172a' },
  chipActive: { backgroundColor: '#f59e0b' },
  chipText: { color: '#94a3b8', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#0ea5e9', borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 10 },
  submitText: { color: '#fff', fontWeight: '700' },
  cancelBtn: { padding: 10, alignItems: 'center' },
  cancelText: { color: '#94a3b8' },
});
