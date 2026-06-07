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

interface GovPartner {
  id: string;
  organization_name: string;
  partner_type: string;
  services: string[];
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  country: string;
  jurisdiction: string;
  contact_email: string;
  created_at: string;
}

interface MyApplication {
  id: string;
  organization_name: string;
  status: string;
  submitted_at: string;
  review_notes?: string;
}

type TabType = 'services' | 'partners' | 'apply' | 'status';

const govServices = [
  { id: 'revenue', label: 'Revenue Collection', icon: 'cash-register', desc: 'Taxes, fees, levies' },
  { id: 'identity', label: 'Identity Services', icon: 'card-account-details', desc: 'ID, passport, registration' },
  { id: 'payments', label: 'Gov't Payments', icon: 'credit-card', desc: 'Salaries, pensions, grants' },
  { id: 'licensing', label: 'Licensing', icon: 'file-certificate', desc: 'Business, driving, permits' },
  { id: 'health', label: 'Health Services', icon: 'hospital-box', desc: 'NHIF, clinics, hospitals' },
  { id: 'education', label: 'Education', icon: 'school', desc: 'School fees, bursaries' },
  { id: 'land', label: 'Land & Property', icon: 'home-map-marker', desc: 'Rates, transfers, titles' },
  { id: 'transport', label: 'Transport', icon: 'bus', desc: 'Matatu, boda, vehicle' },
];

export default function GovernmentHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('services');
  const [partners, setPartners] = useState<GovPartner[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  const [form, setForm] = useState({
    partner_type: 'national_government',
    organization_name: '',
    registration_number: '',
    country: 'Kenya',
    jurisdiction: '',
    department: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    services: [] as string[],
    authorization_level: '1',
    description: '',
  });

  const govTypes = [
    'national_government', 'county_government', 'municipality', 'parastatal', 'agency', 'ministry'
  ];

  const fetchPartners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_partner_applications')
        .select('*')
        .eq('partner_category', 'government')
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
        .select('id, organization_name, status, submitted_at, review_notes')
        .eq('submitted_by', user.id)
        .eq('partner_category', 'government')
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

  const toggleService = (service: string) => {
    setForm(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

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
        partner_category: 'government',
        partner_type: form.partner_type,
        organization_name: form.organization_name,
        registration_number: form.registration_number,
        country: form.country,
        jurisdiction: form.jurisdiction,
        department: form.department,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        services_offered: form.services,
        authorization_level: parseInt(form.authorization_level),
        description: form.description,
        submitted_by: user.id,
        status: 'pending',
      });
      if (error) throw error;

      Alert.alert('Success', 'Government partner application submitted for multi-level review');
      setShowApplyModal(false);
      setForm({
        partner_type: 'national_government', organization_name: '', registration_number: '',
        country: 'Kenya', jurisdiction: '', department: '', contact_name: '',
        contact_email: '', contact_phone: '', services: [], authorization_level: '1', description: '',
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
        <Text style={styles.headerTitle}>Government Hub</Text>
        <TouchableOpacity onPress={() => setShowApplyModal(true)} style={styles.backButton}>
          <Ionicons name="add-circle" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'services' as TabType, label: 'Services' },
          { key: 'partners' as TabType, label: 'Partners' },
          { key: 'apply' as TabType, label: 'Apply' },
          { key: 'status' as TabType, label: 'Status' },
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
        {activeTab === 'services' && (
          <>
            <View style={styles.heroCard}>
              <FontAwesome5 name="landmark" size={32} color="#059669" />
              <Text style={styles.heroTitle}>Government Services</Text>
              <Text style={styles.heroDesc}>
                Access government payments, revenue collection, identity services, licensing, and more — all in one place.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Available Services</Text>
            <View style={styles.servicesGrid}>
              {govServices.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={[styles.serviceCard, selectedService === service.id && styles.serviceCardActive]}
                  onPress={() => {
                    setSelectedService(selectedService === service.id ? null : service.id);
                    // Route to specific service pages
                    if (service.id === 'revenue') router.push('/(os)/wallet/tax');
                  }}
                >
                  <MaterialCommunityIcons
                    name={service.icon as any}
                    size={24}
                    color={selectedService === service.id ? '#059669' : '#6B7280'}
                  />
                  <Text style={[styles.serviceLabel, selectedService === service.id && styles.serviceLabelActive]}>
                    {service.label}
                  </Text>
                  <Text style={styles.serviceDesc} numberOfLines={2}>{service.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.quickActionsCard}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.quickRow}>
                <TouchableOpacity style={styles.quickItem} onPress={() => router.push('/(os)/wallet/tax')}>
                  <View style={[styles.quickIcon, { backgroundColor: '#D1FAE5' }]}>
                    <Ionicons name="receipt-outline" size={20} color="#059669" />
                  </View>
                  <Text style={styles.quickLabel}>Pay Tax</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickItem} onPress={() => router.push('/(os)/wallet/business')}>
                  <View style={[styles.quickIcon, { backgroundColor: '#EEF2FF' }]}>
                    <Ionicons name="business-outline" size={20} color="#4F46E5" />
                  </View>
                  <Text style={styles.quickLabel}>Business Reg</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickItem} onPress={() => setShowApplyModal(true)}>
                  <View style={[styles.quickIcon, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="document-text-outline" size={20} color="#D97706" />
                  </View>
                  <Text style={styles.quickLabel}>Partner Form</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.quickItem} onPress={() => setActiveTab('partners')}>
                  <View style={[styles.quickIcon, { backgroundColor: '#E0E7FF' }]}>
                    <Ionicons name="people-outline" size={20} color="#4338CA" />
                  </View>
                  <Text style={styles.quickLabel}>Partners</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {activeTab === 'partners' && (
          <>
            <View style={styles.heroCard}>
              <Ionicons name="people" size={28} color="#4F46E5" />
              <Text style={styles.heroTitle}>Government Partners</Text>
              <Text style={styles.heroDesc}>
                Verified government agencies and departments integrated with the MTAA platform.
              </Text>
            </View>

            {partners.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No government partners yet</Text>
                <TouchableOpacity style={styles.applyButton} onPress={() => setShowApplyModal(true)}>
                  <Text style={styles.applyButtonText}>Apply as Partner</Text>
                </TouchableOpacity>
              </View>
            ) : (
              partners.map((partner) => (
                <View key={partner.id} style={styles.partnerCard}>
                  <View style={styles.partnerHeader}>
                    <View style={[styles.partnerIcon, { backgroundColor: '#D1FAE5' }]}>
                      <FontAwesome5 name="landmark" size={20} color="#059669" />
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
                      <Text style={styles.detailText}>{partner.jurisdiction}, {partner.country}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="mail-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{partner.contact_email}</Text>
                    </View>
                  </View>
                  {partner.services && partner.services.length > 0 && (
                    <View style={styles.featuresRow}>
                      {partner.services.slice(0, 4).map((svc, idx) => (
                        <View key={idx} style={styles.featureChip}>
                          <Text style={styles.featureText}>{svc}</Text>
                        </View>
                      ))}
                    </View>
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
              <Text style={styles.heroDesc}>
                Track your government partner applications. Multi-level review process may take 5-10 business days.
              </Text>
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
                  <Text style={styles.applicationMeta}>
                    Submitted: {new Date(app.submitted_at).toLocaleDateString('en-KE')}
                  </Text>
                  {app.review_notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesLabel}>Review Notes:</Text>
                      <Text style={styles.notesText}>{app.review_notes}</Text>
                    </View>
                  )}
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
            <Text style={styles.modalTitle}>Apply as Government Partner</Text>
            <TouchableOpacity onPress={() => setShowApplyModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Government Type</Text>
            <View style={styles.typeSelector}>
              {govTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, form.partner_type === type && styles.typeOptionActive]}
                  onPress={() => setForm(prev => ({ ...prev, partner_type: type }))}
                >
                  <Text style={[styles.typeOptionText, form.partner_type === type && styles.typeOptionTextActive]}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Organization Name *</Text>
            <TextInput
              style={styles.input}
              value={form.organization_name}
              onChangeText={(text) => setForm(prev => ({ ...prev, organization_name: text }))}
              placeholder="e.g. Nairobi County Government"
            />

            <Text style={styles.inputLabel}>Registration / Legal ID</Text>
            <TextInput
              style={styles.input}
              value={form.registration_number}
              onChangeText={(text) => setForm(prev => ({ ...prev, registration_number: text }))}
              placeholder="Official government identifier"
            />

            <Text style={styles.inputLabel}>Country</Text>
            <TextInput style={styles.input} value={form.country}
              onChangeText={(text) => setForm(prev => ({ ...prev, country: text }))} />

            <Text style={styles.inputLabel}>Jurisdiction / Region</Text>
            <TextInput style={styles.input} value={form.jurisdiction}
              onChangeText={(text) => setForm(prev => ({ ...prev, jurisdiction: text }))}
              placeholder="e.g. Nairobi County, Central Province" />

            <Text style={styles.inputLabel}>Department / Ministry</Text>
            <TextInput style={styles.input} value={form.department}
              onChangeText={(text) => setForm(prev => ({ ...prev, department: text }))}
              placeholder="e.g. Ministry of Health" />

            <Text style={styles.inputLabel}>Contact Name</Text>
            <TextInput style={styles.input} value={form.contact_name}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact_name: text }))}
              placeholder="Authorized representative" />

            <Text style={styles.inputLabel}>Contact Email *</Text>
            <TextInput style={styles.input} value={form.contact_email}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact_email: text }))}
              placeholder="govt@example.go.ke" keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.inputLabel}>Contact Phone *</Text>
            <TextInput style={styles.input} value={form.contact_phone}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact_phone: text }))}
              placeholder="+254 700 000 000" keyboardType="phone-pad" />

            <Text style={styles.inputLabel}>Services Offered</Text>
            <View style={styles.servicesSelector}>
              {govServices.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={[styles.serviceChip, form.services.includes(svc.id) && styles.serviceChipActive]}
                  onPress={() => toggleService(svc.id)}
                >
                  <MaterialCommunityIcons
                    name={svc.icon as any}
                    size={14}
                    color={form.services.includes(svc.id) ? '#059669' : '#9CA3AF'}
                  />
                  <Text style={[styles.serviceChipText, form.services.includes(svc.id) && styles.serviceChipTextActive]}>
                    {svc.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Authorization Level</Text>
            <View style={styles.levelSelector}>
              {['1', '2', '3'].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.levelOption, form.authorization_level === level && styles.levelOptionActive]}
                  onPress={() => setForm(prev => ({ ...prev, authorization_level: level }))}
                >
                  <Text style={[styles.levelText, form.authorization_level === level && styles.levelTextActive]}>
                    Level {level}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.levelHint}>
              Level 1: Department head. Level 2: County/Regional. Level 3: National/Ministerial.
            </Text>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
              placeholder="Describe the services you want to offer through MTAA..."
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center' },
  tabActive: { backgroundColor: '#059669' },
  tabText: { fontSize: 11, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 16 },
  heroCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  heroDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 10, marginTop: 8 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  serviceCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 2, borderColor: 'transparent', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  serviceCardActive: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  serviceLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginTop: 8 },
  serviceLabelActive: { color: '#059669' },
  serviceDesc: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },
  quickActionsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  quickItem: { flex: 1, alignItems: 'center' },
  quickIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '600', color: '#374151', textAlign: 'center' },
  partnerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  partnerHeader: { flexDirection: 'row', alignItems: 'center' },
  partnerIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  partnerType: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  partnerDetails: { marginTop: 12, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#6B7280' },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  featureChip: { backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  featureText: { fontSize: 11, color: '#059669' },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#9CA3AF', marginTop: 16, textAlign: 'center' },
  applyButton: { marginTop: 20, backgroundColor: '#059669', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  applyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  applicationCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  applicationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  applicationName: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  applicationMeta: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  notesBox: { marginTop: 10, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 10 },
  notesLabel: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  notesText: { fontSize: 12, color: '#78350F', marginTop: 2 },
  modalContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  textArea: { height: 100, textAlignVertical: 'top' },
  typeSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeOption: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  typeOptionActive: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  typeOptionText: { fontSize: 11, color: '#6B7280' },
  typeOptionTextActive: { color: '#059669', fontWeight: '600' },
  servicesSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  serviceChipActive: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  serviceChipText: { fontSize: 11, color: '#6B7280' },
  serviceChipTextActive: { color: '#059669', fontWeight: '600' },
  levelSelector: { flexDirection: 'row', gap: 10 },
  levelOption: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  levelOptionActive: { borderColor: '#059669', backgroundColor: '#ECFDF5' },
  levelText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  levelTextActive: { color: '#059669' },
  levelHint: { fontSize: 11, color: '#9CA3AF', marginTop: 6, fontStyle: 'italic' },
  submitButton: { backgroundColor: '#059669', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 16 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  bottomPadding: { height: 40 },
});
