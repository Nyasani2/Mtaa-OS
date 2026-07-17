import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, Alert, ActivityIndicator, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { useWalletStore } from '@/lib/wallet/state/wallet.store';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';

interface ClaimRequest {
  id: string;
  claim_type: string;
  status: string;
  description: string;
  phone_last_digits: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  agent_id: string | null;
}

const CLAIM_TYPES = [
  { key: 'lost_phone', label: 'Lost / Stolen Phone', icon: 'phone-portrait-outline', desc: 'Recover access after device loss' },
  { key: 'forgot_pin', label: 'Forgot PIN', icon: 'key-outline', desc: 'Reset your wallet PIN securely' },
  { key: 'suspicious_activity', label: 'Suspicious Activity', icon: 'warning-outline', desc: 'Report unauthorized transactions' },
  { key: 'account_lock', label: 'Account Locked', icon: 'lock-closed-outline', desc: 'Unlock after too many failed attempts' },
  { key: 'other', label: 'Other Issue', icon: 'help-circle-outline', desc: 'Describe your situation' },
];

export default function ClaimScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const [claims, setClaims] = useState<ClaimRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [processing, setProcessing] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ClaimRequest | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const fetchClaims = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('wallet_claims')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setClaims(data);
  }, [user]);

  useEffect(() => {
    fetchClaims().then(() => setLoading(false));
  }, [fetchClaims]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchClaims();
    setRefreshing(false);
  }, [fetchClaims]);

  const handleSubmitClaim = async () => {
    if (!user || !selectedType || !description.trim()) {
      Alert.alert('Error', 'Select a claim type and describe your issue'); return;
    }
    setProcessing(true);
    const { error } = await supabase.from('wallet_claims').insert({
      user_id: user.id,
      claim_type: selectedType,
      description: description.trim(),
      phone_last_digits: phoneDigits || null,
      status: 'pending',
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Submitted', 'Your claim has been submitted. An agent will contact you within 24 hours.');
    setCreateModalVisible(false);
    setSelectedType(null); setDescription(''); setPhoneDigits('');
    fetchClaims();
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      pending: '#FF9500', under_review: '#007AFF', approved: '#34C759',
      rejected: '#FF3B30', resolved: '#8E8E93'
    };
    return map[status] || '#8E8E93';
  };

  const getStatusIcon = (status: string) => {
    const map: Record<string, string> = {
      pending: 'time-outline', under_review: 'search-outline', approved: 'checkmark-circle-outline',
      rejected: 'close-circle-outline', resolved: 'shield-checkmark-outline'
    };
    return map[status] || 'help-circle-outline';
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading claims...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Account Recovery</Text>
        <TouchableOpacity style={styles.newBtn} onPress={() => setCreateModalVisible(true)}><Ionicons name="add" size={24} color="#007AFF" /></TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        <View style={styles.emergencyBanner}>
          <Ionicons name="shield-checkmark" size={24} color="#fff" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.emergencyTitle}>Secure Recovery Process</Text>
            <Text style={styles.emergencyDesc}>All claims are verified by trained agents. Response time: under 24 hours.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Claims ({claims.length})</Text>
        {claims.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="shield-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyText}>No claims yet</Text>
            <Text style={styles.emptySub}>Tap + to start a recovery request</Text>
          </View>
        ) : (
          claims.map(claim => (
            <TouchableOpacity key={claim.id} style={styles.claimCard}
              onPress={() => { setSelectedClaim(claim); setDetailModalVisible(true); }} activeOpacity={0.85}>
              <View style={styles.claimHeader}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(claim.status) }]} />
                <Text style={styles.claimType}>{CLAIM_TYPES.find(t => t.key === claim.claim_type)?.label || claim.claim_type}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(claim.status) + '20' }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(claim.status) }]}>{claim.status.replace('_', ' ').toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.claimDesc} numberOfLines={2}>{claim.description}</Text>
              <View style={styles.claimFooter}>
                <Text style={styles.claimDate}>{new Date(claim.created_at).toLocaleDateString()}</Text>
                {claim.agent_id && <Text style={styles.agentBadge}>Agent Assigned</Text>}
              </View>
            </TouchableOpacity>
          ))
        )}

        <Text style={styles.sectionTitle}>Quick Recovery Options</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickCard} onPress={() => { setSelectedType('forgot_pin'); setCreateModalVisible(true); }}>
            <View style={[styles.quickIcon, { backgroundColor: '#007AFF20' }]}><Ionicons name="key" size={24} color="#007AFF" /></View>
            <Text style={styles.quickLabel}>Forgot PIN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => { setSelectedType('lost_phone'); setCreateModalVisible(true); }}>
            <View style={[styles.quickIcon, { backgroundColor: '#FF3B3020' }]}><Ionicons name="phone-portrait" size={24} color="#FF3B30" /></View>
            <Text style={styles.quickLabel}>Lost Phone</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => router.push('/(os)/wallet/support')}>
            <View style={[styles.quickIcon, { backgroundColor: '#34C75920' }]}><Ionicons name="chatbubbles" size={24} color="#34C759" /></View>
            <Text style={styles.quickLabel}>Live Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={createModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Recovery Request</Text>
              <Text style={styles.modalSubtitle}>Select the type of issue you are experiencing</Text>
              {!selectedType ? (
                CLAIM_TYPES.map(type => (
                  <TouchableOpacity key={type.key} style={styles.typeCard} onPress={() => setSelectedType(type.key)}>
                    <View style={styles.typeIcon}><Ionicons name={type.icon as any} size={24} color="#007AFF" /></View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.typeLabel}>{type.label}</Text>
                      <Text style={styles.typeDesc}>{type.desc}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                ))
              ) : (
                <>
                  <TouchableOpacity style={styles.typeSelected} onPress={() => setSelectedType(null)}>
                    <Ionicons name="arrow-back" size={18} color="#8E8E93" />
                    <Text style={styles.typeSelectedText}>{CLAIM_TYPES.find(t => t.key === selectedType)?.label}</Text>
                  </TouchableOpacity>
                  <TextInput style={[styles.input, styles.textArea]} placeholder="Describe your issue in detail..." multiline value={description} onChangeText={setDescription} />
                  <TextInput style={styles.input} placeholder="Last 4 digits of registered phone (optional)" keyboardType="numeric" maxLength={4} value={phoneDigits} onChangeText={setPhoneDigits} />
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setCreateModalVisible(false)}><Text style={styles.modalBtnSecondaryText}>Cancel</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleSubmitClaim} disabled={processing}>
                      {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Submit Claim</Text>}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </BlurView>
      </Modal>

      <Modal visible={detailModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              {selectedClaim && (
                <>
                  <View style={styles.detailHeader}>
                    <View style={[styles.statusDotLarge, { backgroundColor: getStatusColor(selectedClaim.status) }]} />
                    <Text style={styles.detailTitle}>{CLAIM_TYPES.find(t => t.key === selectedClaim.claim_type)?.label}</Text>
                  </View>
                  <View style={[styles.statusBanner, { backgroundColor: getStatusColor(selectedClaim.status) + '15' }]}>
                    <Ionicons name={getStatusIcon(selectedClaim.status) as any} size={20} color={getStatusColor(selectedClaim.status)} />
                    <Text style={[styles.statusBannerText, { color: getStatusColor(selectedClaim.status) }]}>Status: {selectedClaim.status.replace('_', ' ').toUpperCase()}</Text>
                  </View>
                  <Text style={styles.detailLabel}>Your Description</Text>
                  <Text style={styles.detailText}>{selectedClaim.description}</Text>
                  {selectedClaim.resolution_notes && (
                    <>
                      <Text style={styles.detailLabel}>Agent Response</Text>
                      <View style={styles.responseBox}><Text style={styles.responseText}>{selectedClaim.resolution_notes}</Text></View>
                    </>
                  )}
                  <View style={styles.detailMeta}>
                    <Text style={styles.detailMetaText}>Submitted: {new Date(selectedClaim.created_at).toLocaleString()}</Text>
                    {selectedClaim.resolved_at && <Text style={styles.detailMetaText}>Resolved: {new Date(selectedClaim.resolved_at).toLocaleString()}</Text>}
                    {selectedClaim.agent_id && <Text style={styles.detailMetaText}>Agent ID: {selectedClaim.agent_id}</Text>}
                  </View>
                  <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailModalVisible(false)}><Text style={styles.closeBtnText}>Close</Text></TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </BlurView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0A0F' },
  loadingText: { color: '#8E8E93', marginTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#1C1C1E' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  newBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  emergencyBanner: { flexDirection: 'row', backgroundColor: '#007AFF', borderRadius: 16, padding: 16, marginBottom: 20, alignItems: 'center' },
  emergencyTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  emergencyDesc: { fontSize: 12, color: '#fff', opacity: 0.8, marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 8 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#8E8E93', marginTop: 4 },
  claimCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 12 },
  claimHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  claimType: { fontSize: 14, fontWeight: '600', color: '#fff', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  claimDesc: { fontSize: 13, color: '#8E8E93', marginBottom: 10, lineHeight: 18 },
  claimFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimDate: { fontSize: 11, color: '#8E8E93' },
  agentBadge: { fontSize: 10, color: '#34C759', backgroundColor: '#34C75915', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  quickGrid: { flexDirection: 'row', gap: 12 },
  quickCard: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, alignItems: 'center' },
  quickIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#fff' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  typeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16, marginBottom: 10 },
  typeIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#007AFF15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  typeLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
  typeDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  typeSelected: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  typeSelectedText: { fontSize: 15, fontWeight: '600', color: '#fff', marginLeft: 8 },
  input: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 12 },
  textArea: { height: 100, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#007AFF', alignItems: 'center' },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  detailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  statusDotLarge: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statusBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 16 },
  statusBannerText: { fontSize: 14, fontWeight: '700', marginLeft: 8 },
  detailLabel: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 6, marginTop: 12 },
  detailText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  responseBox: { backgroundColor: '#34C75915', borderRadius: 12, padding: 12, borderLeftWidth: 3, borderLeftColor: '#34C759' },
  responseText: { fontSize: 14, color: '#fff', lineHeight: 20 },
  detailMeta: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#2C2C2E' },
  detailMetaText: { fontSize: 12, color: '#8E8E93', marginBottom: 4 },
  closeBtn: { backgroundColor: '#2C2C2E', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  closeBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
