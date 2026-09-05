// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const STATUS_FLOW = {
  submitted: { next: 'under_review', label: 'Start Review', icon: 'eye-outline', color: '#f59e0b' },
  under_review: { next: 'approved', alt: 'rejected', label: 'Approve / Reject', icon: 'checkmark-circle-outline', color: '#10b981' },
  approved: null, rejected: null,
};

export default function ClaimDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [claim, setClaim] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [patient, setPatient] = useState(null);
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data: c } = await supabase.from('health_insurance_claims').select('*, policy:health_insurance_policies(*), patient:health_patients(*), invoice:health_invoices(*)').eq('id', id).single();
      setClaim(c);
      if (c?.policy) setPolicy(c.policy);
      if (c?.patient) setPatient(c.patient);
      if (c?.invoice) setInvoice(c.invoice);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const updateStatus = async (newStatus) => {
    setBusy(true);
    try {
      const { error } = await supabase.from('health_insurance_claims').update({
        status: newStatus,
        reviewer_notes: notes || claim?.reviewer_notes || null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
        rejection_reason: newStatus === 'rejected' ? (notes || 'No reason provided') : null,
      }).eq('id', id);
      if (error) throw error;
      Alert.alert('Success', `Claim marked as ${newStatus.replace('_', ' ')}`);
      load();
    } catch (err) {
      Alert.alert('Error', err?.message || 'Update failed');
    } finally { setBusy(false); }
  };

  if (loading) return <View style={[s.container, s.center]}><ActivityIndicator size="large" color="#8b5cf6" /></View>;
  if (!claim) return <View style={[s.container, s.center]}><Text>No claim found</Text></View>;

  const flow = STATUS_FLOW[claim.status];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <View style={[s.statusBanner, s['status_' + claim.status]]}>
        <Ionicons name={claim.status === 'approved' ? 'checkmark-circle' : claim.status === 'rejected' ? 'close-circle' : 'hourglass', size={22} color="#fff"} />
        <Text style={s.statusText}>{claim.status.replace('_', ' ').toUpperCase()}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Claim Details</Text>
        <View style={s.row}><Text style={s.rowLabel}>Claim ID</Text><Text style={s.rowValue}>{claim.id.slice(0, 8)}…</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Claimed Amount</Text><Text style={[s.rowValue, s.amount]}>KES {Number(claim.claimed_amount || 0).toLocaleString()}</Text></View>
        <View style={s.row}><Text style={s.rowLabel}>Submitted</Text><Text style={s.rowValue}>{new Date(claim.created_at).toLocaleString()}</Text></View>
        {claim.reviewed_at && <View style={s.row}><Text style={s.rowLabel}>Reviewed</Text><Text style={s.rowValue}>{new Date(claim.reviewed_at).toLocaleString()}</Text></View>}
      </View>

      {patient && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Patient</Text>
          <View style={s.row}><Text style={s.rowLabel}>Name</Text><Text style={s.rowValue}>{patient.first_name} {patient.last_name}</Text></View>
          <View style={s.row}><Text style={s.rowLabel}>Phone</Text><Text style={s.rowValue}>{patient.phone || '—'}</Text></View>
        </View>
      )}

      {policy && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Insurance Policy</Text>
          <View style={s.row}><Text style={s.rowLabel}>Provider</Text><Text style={s.rowValue}>{policy.provider_name || 'Policy'}</Text></View>
          <View style={s.row}><Text style={s.rowLabel}>Policy #</Text><Text style={s.rowValue}>{policy.policy_number || '—'}</Text></View>
          <View style={s.row}><Text style={s.rowLabel}>Coverage</Text><Text style={s.rowValue}>KES {Number(policy.coverage_limit || 0).toLocaleString()}</Text></View>
          <View style={s.row}><Text style={s.rowLabel}>Used</Text><Text style={s.rowValue}>KES {Number(policy.used_amount || 0).toLocaleString()}</Text></View>
          <View style={s.progressWrap}>
            <View style={[s.progressBar, { width: `${Math.min(100, ((policy.used_amount || 0) / (policy.coverage_limit || 1)) * 100)}%` }]} />
          </View>
        </View>
      )}

      {invoice && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Linked Invoice</Text>
          <View style={s.row}><Text style={s.rowLabel}>Total</Text><Text style={s.rowValue}>KES {Number(invoice.total_amount || 0).toLocaleString()}</Text></View>
          <View style={s.row}><Text style={s.rowLabel}>Method</Text><Text style={s.rowValue}>{invoice.payment_method || '—'}</Text></View>
          <View style={s.row}><Text style={s.rowLabel}>Items</Text><Text style={s.rowValue}>{(invoice.items || []).length} line(s)</Text></View>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.cardTitle}>Reviewer Notes</Text>
        <TextInput style={s.textarea} multiline numberOfLines={4} placeholder="Add notes for this decision…" value={notes} onChangeText={setNotes} />
        {claim.rejection_reason && <View style={s.rejectReason}><Ionicons name="alert-circle" size={16} color="#ef4444" /><Text style={s.rejectText}>Rejection: {claim.rejection_reason}</Text></View>}
      </View>

      {flow && (
        <View style={s.actions}>
          {flow.alt ? (
            <>
              <TouchableOpacity style={[s.actionBtn, s.approveBtn]} onPress={() => updateStatus(flow.next)} disabled={busy}>
                <Ionicons name="checkmark-circle" size={22} color="#fff" />
                <Text style={s.actionBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, s.rejectBtn]} onPress={() => updateStatus(flow.alt)} disabled={busy}>
                <Ionicons name="close-circle" size={22} color="#fff" />
                <Text style={s.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={[s.actionBtn, { backgroundColor: flow.color }]} onPress={() => updateStatus(flow.next)} disabled={busy}>
              <Ionicons name={flow.icon} size={22} color="#fff" />
              <Text style={s.actionBtnText}>{flow.label}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      {busy && <ActivityIndicator size="small" color="#8b5cf6" style={{ marginTop: 12 }} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  center: { justifyContent: 'center', alignItems: 'center' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, marginBottom: 12 },
  status_submitted: { backgroundColor: '#f59e0b' },
  status_under_review: { backgroundColor: '#3b82f6' },
  status_approved: { backgroundColor: '#10b981' },
  status_rejected: { backgroundColor: '#ef4444' },
  statusText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  rowLabel: { color: '#64748b' },
  rowValue: { color: '#0f172a', fontWeight: '600' },
  amount: { color: '#8b5cf6', fontSize: 16 },
  progressWrap: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressBar: { height: '100%', backgroundColor: '#8b5cf6' },
  textarea: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, padding: 12, minHeight: 90, textAlignVertical: 'top' },
  rejectReason: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, padding: 10, backgroundColor: '#fef2f2', borderRadius: 8 },
  rejectText: { flex: 1, color: '#991b1b', fontSize: 13 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, padding: 14 },
  approveBtn: { backgroundColor: '#10b981' },
  rejectBtn: { backgroundColor: '#ef4444' },
  actionBtnText: { color: '#fff', fontWeight: '700' },
});
