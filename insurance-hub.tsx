import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/kernel/auth.store';
import { supabase } from '@/lib/kernel/supabase';

interface InsurancePartner {
  id: string;
  organization_name: string;
  partner_type: string;
  estimated_premium_min: number;
  estimated_premium_max: number;
  target_market: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  country: string;
  contact_email: string;
  created_at: string;
}

interface MyApplication {
  id: string;
  partner_type: string;
  organization_name: string;
  status: string;
  submitted_at: string;
}

type TabType = 'partners' | 'apply' | 'status';

const insuranceTypes = [
  { id: 'health', label: 'Health', icon: 'medical-bag', desc: 'Medical & hospital coverage' },
  { id: 'vehicle', label: 'Vehicle', icon: 'car', desc: 'Auto & motorbike insurance' },
  { id: 'agriculture', label: 'Agriculture', icon: 'sprout', desc: 'Crop & livestock coverage' },
  { id: 'sme', label: 'SME', icon: 'store', desc: 'Business & liability coverage' },
  { id: 'asset', label: 'Asset', icon: 'home', desc: 'Property & equipment coverage' },
  { id: 'life', label: 'Life', icon: 'heart-pulse', desc: 'Life & funeral coverage' },
];

export default function InsuranceHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('partners');
  const [partners, setPartners] = useState<InsurancePartner[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const [form, setForm] = useState({
    partner_type: 'health',
    organization_name: '',
    registration_number: '',
    country: 'Kenya',
    city: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    estimated_premium_min: '',
    estimated_premium_max: '',
    target_market: '',
    description: '',
  });

  const fetchPartners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_partner_applications')
        .select('*')
        .eq('partner_category', 'insurance')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPartners(data || []);
    } catch (err) {
      console.error('Fetch partners error:', err);
    }
  }, []);

  const fetchMyApplications = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('wallet_partner_applications')
        .select('id, partner_type, organization_name, status, submitted_at')
        .eq('submitted_by', user.id)
        .eq('partner_category', 'insurance')
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      setMyApplications(data || []);
    } catch (err) {
      console.error('Fetch applications error:', err);
    }
  }, [user?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPartners(), fetchMyApplications()]);
    setLoading(false);
  }, [fetchPartners, fetchMyApplications]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }
    if (!form.organization_name || !form.contact_email || !form.contact_phone) {
      Alert.alert('Missing Fields', 'Organization name, email, and phone are required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('wallet_partner_applications').insert({
        partner_category: 'insurance',
        partner_type: form.partner_type,
        organization_name: form.organization_name,
        registration_number: form.registration_number,
        country: form.country,
        city: form.city,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        website: form.website,
        estimated_premium_min: parseFloat(form.estimated_premium_min) || 0,
        estimated_premium_max: parseFloat(form.estimated_premium_max) || 0,
        target_market: form.target_market,
        description: form.description,
        submitted_by: user.id,
        status: 'pending',
      });
      if (error) throw error;

      Alert.alert('Success', 'Insurance partner application submitted for review');
      setShowApplyModal(false);
      setForm({
        partner_type: 'health', organization_name: '', registration_number: '',
        country: 'Kenya', city: '', contact_name: '', contact_email: '',
        contact_phone: '', website: '', estimated_premium_min: '',
        estimated_premium_max: '', target_market: '', description: '',
      });
      fetchMyApplications();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'reviewing': return '#3B82F6';
      case 'rejected': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'pending': return 'Pending';
      case 'reviewing': return 'Under Review';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insurance Hub</Text>
        <TouchableOpacity onPress={() => setShowApplyModal(true)} style={styles.backButton}>
          <Ionicons name="add-circle" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'partners' as TabType, label: 'Partners' },
          { key: 'apply' as TabType, label: 'Apply' },
          { key: 'status' as TabType, label: 'My Status' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              if (tab.key === 'apply') setShowApplyModal(true);
              else setActiveTab(tab.key);
            }}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'partners' && (
          <>
            <View style={styles.heroCard}>
              <MaterialCommunityIcons name="shield-check" size={36} color="#4F46E5" />
              <Text style={styles.heroTitle}>Insurance Partners</Text>
              <Text style={styles.heroDesc}>
                Browse verified insurance providers. Protect what matters — health, vehicle, business, assets, and life.
              </Text>
            </View>

            {/* Insurance Type Grid */}
            <Text style={styles.sectionTitle}>Insurance Types</Text>
            <View style={styles.typeGrid}>
              {insuranceTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeCard, selectedType === type.id && styles.typeCardActive]}
                  onPress={() => setSelectedType(selectedType === type.id ? null : type.id)}
                >
                  <MaterialCommunityIcons
                    name={type.icon as any}
                    size={24}
                    color={selectedType === type.id ? '#4F46E5' : '#9CA3AF'}
                  />
                  <Text style={[styles.typeLabel, selectedType === type.id && styles.typeLabelActive]}>
                    {type.label}
                  </Text>
                  <Text style={styles.typeDesc} numberOfLines={2}>{type.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Filtered Partners */}
            <Text style={styles.sectionTitle}>Verified Partners</Text>
            {partners.filter(p => !selectedType || p.partner_type === selectedType).length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="shield-off-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>
                  {selectedType ? 'No partners for this type yet' : 'No insurance partners yet'}
                </Text>
                <TouchableOpacity style={styles.applyButton} onPress={() => setShowApplyModal(true)}>
                  <Text style={styles.applyButtonText}>Apply as Partner</Text>
                </TouchableOpacity>
              </View>
            ) : (
              partners
                .filter(p => !selectedType || p.partner_type === selectedType)
                .map((partner) => (
                  <View key={partner.id} style={styles.partnerCard}>
                    <View style={styles.partnerHeader}>
                      <View style={styles.partnerIcon}>
                        <MaterialCommunityIcons name="shield-check" size={22} color="#4F46E5" />
                      </View>
                      <View style={styles.partnerInfo}>
                        <Text style={styles.partnerName}>{partner.organization_name}</Text>
                        <Text style={styles.partnerType}>{partner.partner_type}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(partner.status) + '20' }]}>
                        <Text style={[styles.statusText, { color: getStatusColor(partner.status) }]}>
                          {getStatusLabel(partner.status)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.partnerDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="location-outline" size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{partner.city}, {partner.country}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <Ionicons name="mail-outline" size={14} color="#6B7280" />
                        <Text style={styles.detailText}>{partner.contact_email}</Text>
                      </View>
                      {(partner.estimated_premium_min || partner.estimated_premium_max) && (
                        <View style={styles.detailRow}>
                          <Ionicons name="cash-outline" size={14} color="#6B7280" />
                          <Text style={styles.detailText}>
                            Premium: KES {partner.estimated_premium_min?.toLocaleString()} - {partner.estimated_premium_max?.toLocaleString()}
                          </Text>
                        </View>
                      )}
                      {partner.target_market && (
                        <View style={styles.detailRow}>
                          <Ionicons name="people-outline" size={14} color="#6B7280" />
                          <Text style={styles.detailText}>Target: {partner.target_market}</Text>
                        </View>
                      )}
                    </View>
                    {partner.description && (
                      <Text style={styles.partnerDesc} numberOfLines={2}>{partner.description}</Text>
                    )}
                  </View>
                ))
            )}
          </>
        )}

        {activeTab === 'status' && (
          <>
            <View style={styles.heroCard}>
              <Ionicons name="document-text" size={28} color="#4F46E5" />
              <Text style={styles.heroTitle}>Application Status</Text>
              <Text style={styles.heroDesc}>Track your insurance partner applications</Text>
            </View>

            {myApplications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="file-tray-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No applications yet</Text>
                <TouchableOpacity style={styles.applyButton} onPress={() => setShowApplyModal(true)}>
                  <Text style={styles.applyButtonText}>Apply Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myApplications.map((app) => (
                <View key={app.id} style={styles.applicationCard}>
                  <View style={styles.applicationHeader}>
                    <Text style={styles.applicationName}>{app.organization_name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                        {getStatusLabel(app.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.applicationMeta}>Type: {app.partner_type}</Text>
                  <Text style={styles.applicationMeta}>
                    Submitted: {new Date(app.submitted_at).toLocaleDateString('en-KE')}
                  </Text>
                </View>
              ))
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Apply Modal */}
      <Modal
        visible={showApplyModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Apply as Insurance Partner</Text>
            <TouchableOpacity onPress={() => setShowApplyModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Insurance Type</Text>
            <View style={styles.typeSelector}>
              {insuranceTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.typeOption, form.partner_type === type.id && styles.typeOptionActive]}
                  onPress={() => setForm(prev => ({ ...prev, partner_type: type.id }))}
                >
                  <MaterialCommunityIcons
                    name={type.icon as any}
                    size={16}
                    color={form.partner_type === type.id ? '#4F46E5' : '#9CA3AF'}
                  />
                  <Text style={[styles.typeOptionText, form.partner_type === type.id && styles.typeOptionTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Organization Name *</Text>
            <TextInput
              style={styles.input}
              value={form.organization_name}
              onChangeText={(text) => setForm(prev => ({ ...prev, organization_name: text }))}
              placeholder="e.g. Jubilee Insurance"
            />

            <Text style={styles.inputLabel}>Registration Number</Text>
            <TextInput
              style={styles.input}
              value={form.registration_number}
              onChangeText={(text) => setForm(prev => ({ ...prev, registration_number: text }))}
              placeholder="IRA registration number"
            />

            <Text style={styles.inputLabel}>Country</Text>
            <TextInput style={styles.input} value={form.country}
              onChangeText={(text) => setForm(prev => ({ ...prev, country: text }))} />

            <Text style={styles.inputLabel}>City</Text>
            <TextInput style={styles.input} value={form.city}
              onChangeText={(text) => setForm(prev => ({ ...prev, city: text }))}
              placeholder="e.g. Nairobi" />

            <Text style={styles.inputLabel}>Contact Name</Text>
            <TextInput style={styles.input} value={form.contact_name}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact_name: text }))}
              placeholder="Primary contact person" />

            <Text style={styles.inputLabel}>Contact Email *</Text>
            <TextInput style={styles.input} value={form.contact_email}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact_email: text }))}
              placeholder="partner@insurance.com" keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.inputLabel}>Contact Phone *</Text>
            <TextInput style={styles.input} value={form.contact_phone}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact_phone: text }))}
              placeholder="+254 700 000 000" keyboardType="phone-pad" />

            <Text style={styles.inputLabel}>Website</Text>
            <TextInput style={styles.input} value={form.website}
              onChangeText={(text) => setForm(prev => ({ ...prev, website: text }))}
              placeholder="https://www.insurance.com" autoCapitalize="none" />

            <Text style={styles.inputLabel}>Premium Range (KES)</Text>
            <View style={styles.rangeRow}>
              <TextInput
                style={[styles.input, styles.rangeInput]}
                value={form.estimated_premium_min}
                onChangeText={(text) => setForm(prev => ({ ...prev, estimated_premium_min: text }))}
                placeholder="Min" keyboardType="numeric"
              />
              <Text style={styles.rangeSeparator}>to</Text>
              <TextInput
                style={[styles.input, styles.rangeInput]}
                value={form.estimated_premium_max}
                onChangeText={(text) => setForm(prev => ({ ...prev, estimated_premium_max: text }))}
                placeholder="Max" keyboardType="numeric"
              />
            </View>

            <Text style={styles.inputLabel}>Target Market</Text>
            <TextInput style={styles.input} value={form.target_market}
              onChangeText={(text) => setForm(prev => ({ ...prev, target_market: text }))}
              placeholder="e.g. Individuals, SMEs, Farmers" />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
              placeholder="Describe your insurance products and coverage..."
              multiline numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit} disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : (
                <Text style={styles.submitButtonText}>Submit Application</Text>
              )}
            </TouchableOpacity>
            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
  },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center' },
  tabActive: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 16 },
  heroCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center',
    marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  heroDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10, marginTop: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  typeCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  typeCardActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  typeLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 8 },
  typeLabelActive: { color: '#4F46E5' },
  typeDesc: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },
  partnerCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  partnerHeader: { flexDirection: 'row', alignItems: 'center' },
  partnerIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  partnerType: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  partnerDetails: { marginTop: 12, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#6B7280' },
  partnerDesc: { fontSize: 13, color: '#6B7280', marginTop: 10, lineHeight: 18 },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#9CA3AF', marginTop: 16, textAlign: 'center' },
  applyButton: { marginTop: 20, backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  applyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  applicationCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  applicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  applicationName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  applicationMeta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  modalContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeOption: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  typeOptionActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  typeOptionText: { fontSize: 11, color: '#6B7280' },
  typeOptionTextActive: { color: '#4F46E5', fontWeight: '600' },
  rangeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rangeInput: { flex: 1 },
  rangeSeparator: { fontSize: 13, color: '#6B7280' },
  submitButton: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 16 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  bottomPadding: { height: 40 },
});
