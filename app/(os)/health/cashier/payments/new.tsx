// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: 'cash-outline', color: '#10b981' },
  { key: 'wallet', label: 'MTAA Wallet', icon: 'wallet-outline', color: '#0ea5e9' },
  { key: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline', color: '#8b5cf6' },
  { key: 'mpesa', label: 'M-Pesa', icon: 'phone-portrait-outline', color: '#22c55e' },
];

export default function NewPaymentScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [policies, setPolicies] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [items, setItems] = useState([{ name: '', quantity: '1', price: '0' }]);
  const [method, setMethod] = useState('cash');
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  useEffect(() => {
    supabase.from('health_insurance_policies').select('*, holder:user_profiles(first_name, last_name)').eq('status', 'active').limit(50)
      .then(({ data }) => setPolicies(data || []));
  }, []);

  const searchPatients = async () => {
    if (patientSearch.length < 2) return;
    const { data } = await supabase.from('health_patients')
      .select('*, user_profiles!inner(first_name, last_name, phone)')
      .or(`user_profiles.first_name.ilike.%${patientSearch}%,user_profiles.last_name.ilike.%${patientSearch}%`)
      .limit(10);
    setPatients(data || []);
  };

  const addItem = () => setItems([...items, { name: '', quantity: '1', price: '0' }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i, k, v) => {
    const copy = [...items]; copy[i] = { ...copy[i], [k]: v }; setItems(copy);
  };

  const subtotal = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.price) || 0), 0);
  const coPay = selectedPolicy ? (subtotal * Number(selectedPolicy.co_pay_percent || 0)) / 100 : 0;
  const insuranceCovered = method === 'insurance' ? Math.min(subtotal - coPay, Number(selectedPolicy?.coverage_limit || 0) - Number(selectedPolicy?.used_amount || 0)) : 0;
  const patientPaid = method === 'insurance' ? subtotal - Math.max(insuranceCovered, 0) : subtotal;

  const submit = async () => {
    if (!selectedPatient) { Alert.alert('Error', 'Select a patient first'); return; }
    if (items.every((i) => !i.name.trim())) { Alert.alert('Error', 'Add at least one service/item'); return; }
    if (method === 'insurance' && !selectedPolicy) { Alert.alert('Error', 'Select an insurance policy'); return; }

    setLoading(true);
    try {
      const { data: invoice, error: invErr } = await supabase.from('health_invoices').insert({
        patient_id: selectedPatient.id,
        facility_id: selectedPatient.facility_id || null,
        total_amount: subtotal,
        subtotal, insurance_covered: insuranceCovered, patient_paid: patientPaid,
        payment_method: method,
        items: items.filter((i) => i.name.trim()),
        status: 'paid',
        created_by: user?.id,
      }).select().single();
      if (invErr) throw invErr;

      if (method === 'insurance' && selectedPolicy) {
        const { data: claim, error: clErr } = await supabase.from('health_insurance_claims').insert({
          policy_id: selectedPolicy.id,
          invoice_id: invoice.id,
          patient_id: selectedPatient.id,
          claimed_amount: insuranceCovered,
          status: 'submitted',
        }).select().single();
        if (clErr) throw clErr;
        await supabase.from('health_invoices').update({ insurance_claim_id: claim.id }).eq('id', invoice.id);
        await supabase.from('health_insurance_policies').update({
          used_amount: Number(selectedPolicy.used_amount || 0) + insuranceCovered
        }).eq('id', selectedPolicy.id);
      }

      Alert.alert('Success', `Invoice KES ${subtotal.toLocaleString()} created`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', err?.message || 'Failed to create invoice');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>New Payment</Text>

      {/* Patient selector */}
      <Text style={s.label}>Patient *</Text>
      <TextInput style={s.input} placeholder="Search by name…" value={patientSearch} onChangeText={setPatientSearch} onSubmitEditing={searchPatients} />
      {selectedPatient && (
        <View style={s.pill}>
          <Ionicons name="person" size={18} color="#0ea5e9" />
          <Text style={s.pillText}>{selectedPatient.user_profiles?.first_name} {selectedPatient.user_profiles?.last_name}</Text>
        </View>
      )}
      {patients.length > 0 && !selectedPatient && (
        <View style={s.list}>
          {patients.map((p) => (
            <TouchableOpacity key={p.id} style={s.listItem} onPress={() => { setSelectedPatient(p); setPatients([]); }}>
              <Text style={s.listItemText}>{p.user_profiles?.first_name} {p.user_profiles?.last_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Line items */}
      <Text style={[s.label, { marginTop: 16 }]}>Service Items</Text>
      {items.map((it, i) => (
        <View key={i} style={s.itemRow}>
          <TextInput style={[s.input, { flex: 2 }]} placeholder="Item name" value={it.name} onChangeText={(v) => updateItem(i, 'name', v)} />
          <TextInput style={[s.input, { flex: 0.7 }]} placeholder="Qty" value={it.quantity} onChangeText={(v) => updateItem(i, 'quantity', v)} keyboardType="numeric" />
          <TextInput style={[s.input, { flex: 1 }]} placeholder="Price" value={it.price} onChangeText={(v) => updateItem(i, 'price', v)} keyboardType="numeric" />
          <TouchableOpacity onPress={() => removeItem(i)} style={s.removeBtn}>
            <Ionicons name="close-circle" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={addItem} style={s.addBtn}>
        <Ionicons name="add-circle-outline" size={18} color="#0ea5e9" />
        <Text style={s.addBtnText}>Add item</Text>
      </TouchableOpacity>

      {/* Payment method */}
      <Text style={[s.label, { marginTop: 16 }]}>Payment Method</Text>
      <View style={s.methodRow}>
        {PAYMENT_METHODS.map((m) => (
          <TouchableOpacity key={m.key} style={[s.methodBtn, method === m.key && s.methodBtnActive]} onPress={() => setMethod(m.key)}>
            <Ionicons name={m.icon} size={22} color={method === m.key ? '#fff' : m.color} />
            <Text style={[s.methodText, method === m.key && s.methodTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Insurance policy picker */}
      {method === 'insurance' && (
        <>
          <Text style={[s.label, { marginTop: 16 }]}>Insurance Policy</Text>
          {policies.length === 0 && <Text style={s.hint}>No active policies found</Text>}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {policies.map((p) => (
              <TouchableOpacity key={p.id} style={[s.policyCard, selectedPolicy?.id === p.id && s.policyCardActive]} onPress={() => setSelectedPolicy(p)}>
                <Text style={s.policyName}>{p.provider_name || 'Policy'}</Text>
                <Text style={s.policyMember}>{p.holder?.first_name} {p.holder?.last_name}</Text>
                <Text style={s.policyLimit}>Limit: KES {Number(p.coverage_limit || 0).toLocaleString()}</Text>
                <Text style={s.policyUsed}>Used: KES {Number(p.used_amount || 0).toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Summary */}
      <View style={s.summary}>
        <View style={s.summaryRow}><Text style={s.summaryLabel}>Subtotal</Text><Text style={s.summaryValue}>KES {subtotal.toLocaleString()}</Text></View>
        {method === 'insurance' && <View style={s.summaryRow}><Text style={s.summaryLabel}>Insurance covers</Text><Text style={[s.summaryValue, { color: '#8b5cf6' }]}>KES {insuranceCovered.toLocaleString()}</Text></View>}
        {method === 'insurance' && <View style={s.summaryRow}><Text style={s.summaryLabel}>Co-pay ({selectedPolicy?.co_pay_percent || 0}%)</Text><Text style={s.summaryValue}>KES {coPay.toLocaleString()}</Text></View>}
        <View style={[s.summaryRow, s.summaryTotal]}><Text style={s.summaryLabelTotal}>Patient pays</Text><Text style={s.summaryValueTotal}>KES {patientPaid.toLocaleString()}</Text></View>
      </View>

      <TouchableOpacity style={s.submitBtn} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <><Ionicons name="checkmark-circle" size={22} color="#fff" /><Text style={s.submitText}>Create Invoice</Text></>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#475569', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e0f2fe', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, alignSelf: 'flex-start', marginTop: 8 },
  pillText: { color: '#0369a1', fontWeight: '600' },
  list: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, marginTop: 8 },
  listItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  listItemText: { color: '#0f172a' },
  itemRow: { flexDirection: 'row', gap: 6, marginBottom: 8, alignItems: 'center' },
  removeBtn: { padding: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, alignSelf: 'flex-start' },
  addBtnText: { color: '#0ea5e9', fontWeight: '600' },
  methodRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  methodBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  methodBtnActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  methodText: { color: '#475569', fontWeight: '600', fontSize: 13 },
  methodTextActive: { color: '#fff' },
  hint: { color: '#94a3b8', fontSize: 13, fontStyle: 'italic' },
  policyCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginRight: 10, width: 180, borderWidth: 1, borderColor: '#e2e8f0' },
  policyCardActive: { borderColor: '#8b5cf6', backgroundColor: '#f5f3ff' },
  policyName: { fontWeight: '700', color: '#0f172a' },
  policyMember: { fontSize: 12, color: '#64748b', marginTop: 2 },
  policyLimit: { fontSize: 12, color: '#10b981', marginTop: 6 },
  policyUsed: { fontSize: 12, color: '#f59e0b' },
  summary: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 20 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { color: '#64748b' },
  summaryValue: { color: '#0f172a', fontWeight: '600' },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, marginTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  summaryLabelTotal: { color: '#0f172a', fontWeight: '700', fontSize: 16 },
  summaryValueTotal: { color: '#0f172a', fontWeight: '800', fontSize: 18 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0ea5e9', borderRadius: 12, padding: 16, marginTop: 20 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
