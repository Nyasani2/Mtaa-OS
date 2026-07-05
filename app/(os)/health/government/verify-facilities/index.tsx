import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, FlatList, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface FacilityRegistration {
  id: string;
  name: string;
  type: string;
  ownership: string;
  level: number;
  county: string;
  town: string;
  phone: string;
  bed_capacity: number;
  founder_name: string;
  founder_phone: string;
  license_number: string;
  license_body: string;
  status: string;
  submitted_at: string;
  verified_at: string | null;
  verification_notes: string | null;
  rejection_reason: string | null;
}

export default function GovernmentVerificationScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<FacilityRegistration[]>([]);
  const [filter, setFilter] = useState('all'); // all, pending, verified, rejected
  const [selectedRegistration, setSelectedRegistration] = useState<FacilityRegistration | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_facility_registrations')
        .select('*')
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setRegistrations(data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleVerify = async (action: 'verify' | 'reject') => {
    if (!selectedRegistration) return;

    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc('verify_health_facility', {
        p_registration_id: selectedRegistration.id,
        p_action: action,
        p_notes: verificationNotes,
      });

      if (error) throw error;

      if (data?.success) {
        Alert.alert(
          action === 'verify' ? 'Facility Verified' : 'Registration Rejected',
          data.message,
          [{ text: 'OK', onPress: () => {
            setSelectedRegistration(null);
            setVerificationNotes('');
            fetchRegistrations();
          }}]
        );
      } else {
        Alert.alert('Error', data?.error || 'Operation failed');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredRegistrations = registrations.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#27ae60';
      case 'rejected': return '#e74c3c';
      case 'submitted': return '#f39c12';
      case 'under_review': return '#3498db';
      default: return '#999';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified': return 'Verified';
      case 'rejected': return 'Rejected';
      case 'submitted': return 'Pending Review';
      case 'under_review': return 'Under Review';
      default: return status;
    }
  };

  const renderRegistrationCard = ({ item }: { item: FacilityRegistration }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => setSelectedRegistration(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>
          {item.type} • {item.ownership} • Level {item.level}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Location:</Text>
          <Text style={styles.infoValue}>{item.town}, {item.county}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Beds:</Text>
          <Text style={styles.infoValue}>{item.bed_capacity}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Founder:</Text>
          <Text style={styles.infoValue}>{item.founder_name}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>License:</Text>
          <Text style={styles.infoValue}>{item.license_number} ({item.license_body})</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Submitted:</Text>
          <Text style={styles.infoValue}>
            {new Date(item.submitted_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (selectedRegistration) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSelectedRegistration(null)}>
            <Text style={styles.backButton}>← Back to List</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Review Facility</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selectedRegistration.name}</Text>
          <View style={[styles.statusBadgeLarge, { backgroundColor: getStatusColor(selectedRegistration.status) + '20' }]}>
            <Text style={[styles.statusTextLarge, { color: getStatusColor(selectedRegistration.status) }]}>
              {getStatusLabel(selectedRegistration.status)}
            </Text>
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Facility Details</Text>
            <DetailRow label="Type" value={selectedRegistration.type} />
            <DetailRow label="Ownership" value={selectedRegistration.ownership} />
            <DetailRow label="Level" value={String(selectedRegistration.level)} />
            <DetailRow label="Country" value={selectedRegistration.country || 'Kenya'} />
            <DetailRow label="County" value={selectedRegistration.county} />
            <DetailRow label="Town" value={selectedRegistration.town} />
            <DetailRow label="Address" value={selectedRegistration.address} />
            <DetailRow label="Phone" value={selectedRegistration.phone} />
            <DetailRow label="Email" value={selectedRegistration.email} />
            <DetailRow label="Bed Capacity" value={String(selectedRegistration.bed_capacity)} />
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>Founder Information</Text>
            <DetailRow label="Name" value={selectedRegistration.founder_name} />
            <DetailRow label="ID Number" value={selectedRegistration.founder_id_number} />
            <DetailRow label="Phone" value={selectedRegistration.founder_phone} />
            <DetailRow label="Email" value={selectedRegistration.founder_email} />
          </View>

          <View style={styles.detailSection}>
            <Text style={styles.detailSectionTitle}>License Information</Text>
            <DetailRow label="License Number" value={selectedRegistration.license_number} />
            <DetailRow label="Issuing Body" value={selectedRegistration.license_body} />
          </View>

          {selectedRegistration.status === 'submitted' && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Verification Notes</Text>
              <TextInput
                style={styles.notesInput}
                multiline
                numberOfLines={4}
                value={verificationNotes}
                onChangeText={setVerificationNotes}
                placeholder="Add notes about this facility (optional)..."
              />

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleVerify('reject')}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionButtonText}>Reject</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.verifyButton]}
                  onPress={() => handleVerify('verify')}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.actionButtonText}>Verify & Activate</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {selectedRegistration.verification_notes && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Previous Notes</Text>
              <Text style={styles.notesText}>{selectedRegistration.verification_notes}</Text>
            </View>
          )}

          {selectedRegistration.rejection_reason && (
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Rejection Reason</Text>
              <Text style={styles.rejectionText}>{selectedRegistration.rejection_reason}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Facility Registrations</Text>
        <Text style={styles.headerSubtitle}>Government Verification Dashboard</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {[
          { key: 'all', label: 'All' },
          { key: 'submitted', label: 'Pending' },
          { key: 'verified', label: 'Verified' },
          { key: 'rejected', label: 'Rejected' },
        ].map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterTab, filter === f.key && styles.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{registrations.filter(r => r.status === 'submitted').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{registrations.filter(r => r.status === 'verified').length}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{registrations.filter(r => r.status === 'rejected').length}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>{registrations.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#0A7B5A" />
      ) : (
        <FlatList
          data={filteredRegistrations}
          renderItem={renderRegistrationCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchRegistrations}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No registrations found</Text>
          }
        />
      )}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#1a237e', paddingTop: 60 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#c5cae9', marginTop: 4 },
  backButton: { color: '#c5cae9', fontSize: 16, marginBottom: 8 },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff' },
  filterTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  filterTabActive: { backgroundColor: '#1a237e' },
  filterTabText: { fontSize: 13, color: '#666' },
  filterTabTextActive: { color: '#fff', fontWeight: '500' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  statBox: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#f8f9fa', borderRadius: 8 },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#1a237e' },
  statLabel: { fontSize: 11, color: '#666', marginTop: 4 },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { marginBottom: 12 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  cardSubtitle: { fontSize: 13, color: '#666', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  cardBody: { borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 12 },
  infoRow: { flexDirection: 'row', marginBottom: 6 },
  infoLabel: { fontSize: 13, color: '#999', width: 80 },
  infoValue: { fontSize: 13, color: '#333', flex: 1 },
  loader: { marginTop: 40 },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#999', fontSize: 16 },
  detailCard: { padding: 20, backgroundColor: '#fff', margin: 12, borderRadius: 12 },
  detailTitle: { fontSize: 20, fontWeight: 'bold', color: '#1a1a1a', marginBottom: 8 },
  statusBadgeLarge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginBottom: 16 },
  statusTextLarge: { fontSize: 13, fontWeight: '600' },
  detailSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 16 },
  detailSectionTitle: { fontSize: 16, fontWeight: '600', color: '#1a1a1a', marginBottom: 12 },
  detailRow: { flexDirection: 'row', marginBottom: 8 },
  detailLabel: { fontSize: 14, color: '#666', width: 120 },
  detailValue: { fontSize: 14, color: '#1a1a1a', flex: 1 },
  notesInput: {
    backgroundColor: '#f8f9fa', borderRadius: 8, padding: 12, fontSize: 14,
    borderWidth: 1, borderColor: '#ddd', minHeight: 80, textAlignVertical: 'top'
  },
  actionButtons: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionButton: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  rejectButton: { backgroundColor: '#e74c3c' },
  verifyButton: { backgroundColor: '#27ae60' },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  notesText: { fontSize: 14, color: '#333', lineHeight: 20 },
  rejectionText: { fontSize: 14, color: '#e74c3c', lineHeight: 20 },
});
