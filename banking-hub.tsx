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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/kernel/auth.store';
import { supabase } from '@/lib/kernel/supabase';

interface BankPartner {
  id: string;
  name: string;
  type: 'bank' | 'microfinance' | 'sacco_bank';
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  country: string;
  features: string[];
  contact_email: string;
  created_at: string;
}

interface MyApplication {
  id: string;
  partner_type: string;
  organization_name: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  review_notes?: string;
}

export default function BankingHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'partners' | 'apply' | 'status'>('partners');
  const [partners, setPartners] = useState<BankPartner[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Form state
  const [form, setForm] = useState({
    partner_type: 'bank',
    organization_name: '',
    registration_number: '',
    country: 'Kenya',
    city: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    services: [] as string[],
    description: '',
  });

  const serviceOptions = [
    'Mobile Banking',
    'Savings Accounts',
    'Loans',
    'Overdraft',
    'Fixed Deposits',
    'Wire Transfers',
    'Card Issuance',
    'API Integration',
  ];

  const fetchPartners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_partner_applications')
        .select('*')
        .eq('partner_category', 'banking')
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
        .select('id, partner_type, organization_name, status, submitted_at, reviewed_at, review_notes')
        .eq('submitted_by', user.id)
        .eq('partner_category', 'banking')
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
      Alert.alert('Error', 'You must be logged in to apply');
      return;
    }
    if (!form.organization_name || !form.contact_email || !form.contact_phone) {
      Alert.alert('Missing Fields', 'Please fill in organization name, email, and phone');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('wallet_partner_applications')
        .insert({
          partner_category: 'banking',
          partner_type: form.partner_type,
          organization_name: form.organization_name,
          registration_number: form.registration_number,
          country: form.country,
          city: form.city,
          contact_name: form.contact_name,
          contact_email: form.contact_email,
          contact_phone: form.contact_phone,
          website: form.website,
          services_offered: form.services,
          description: form.description,
          submitted_by: user.id,
          status: 'pending',
        });

      if (error) throw error;

      Alert.alert('Success', 'Your application has been submitted for review');
      setShowApplyModal(false);
      setForm({
        partner_type: 'bank',
        organization_name: '',
        registration_number: '',
        country: 'Kenya',
        city: '',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        website: '',
        services: [],
        description: '',
      });
      fetchMyApplications();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to submit application');
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Banking Hub</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'partners' && styles.tabActive]}
          onPress={() => setActiveTab('partners')}
        >
          <Text style={[styles.tabText, activeTab === 'partners' && styles.tabTextActive]}>
            Partners
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'apply' && styles.tabActive]}
          onPress={() => setShowApplyModal(true)}
        >
          <Text style={[styles.tabText, activeTab === 'apply' && styles.tabTextActive]}>
            Apply
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'status' && styles.tabActive]}
          onPress={() => setActiveTab('status')}
        >
          <Text style={[styles.tabText, activeTab === 'status' && styles.tabTextActive]}>
            My Status
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'partners' && (
          <>
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="bank" size={28} color="#4F46E5" />
              <Text style={styles.infoTitle}>Partner Banks</Text>
              <Text style={styles.infoDesc}>
                Connect with verified banking partners for savings, loans, and financial services.
              </Text>
            </View>

            {partners.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No banking partners yet</Text>
                <Text style={styles.emptyDesc}>Be the first to apply as a banking partner</Text>
              </View>
            ) : (
              partners.map((partner) => (
                <TouchableOpacity key={partner.id} style={styles.partnerCard}>
                  <View style={styles.partnerHeader}>
                    <View style={styles.partnerIcon}>
                      <MaterialCommunityIcons name="bank" size={24} color="#4F46E5" />
                    </View>
                    <View style={styles.partnerInfo}>
                      <Text style={styles.partnerName}>{partner.name}</Text>
                      <Text style={styles.partnerType}>{partner.type}</Text>
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
                      <Text style={styles.detailText}>{partner.country}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Ionicons name="mail-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailText}>{partner.contact_email}</Text>
                    </View>
                  </View>
                  {partner.features && partner.features.length > 0 && (
                    <View style={styles.featuresRow}>
                      {partner.features.slice(0, 3).map((feature, idx) => (
                        <View key={idx} style={styles.featureChip}>
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                      {partner.features.length > 3 && (
                        <Text style={styles.moreText}>+{partner.features.length - 3}</Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === 'status' && (
          <>
            <View style={styles.infoCard}>
              <Ionicons name="document-text" size={28} color="#4F46E5" />
              <Text style={styles.infoTitle}>Application Status</Text>
              <Text style={styles.infoDesc}>
                Track your banking partner applications and review feedback.
              </Text>
            </View>

            {myApplications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="file-tray-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No applications yet</Text>
                <TouchableOpacity
                  style={styles.applyButton}
                  onPress={() => setShowApplyModal(true)}
                >
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
                  <View style={styles.applicationMeta}>
                    <Text style={styles.metaText}>Type: {app.partner_type}</Text>
                    <Text style={styles.metaText}>
                      Submitted: {new Date(app.submitted_at).toLocaleDateString('en-KE')}
                    </Text>
                  </View>
                  {app.reviewed_at && (
                    <Text style={styles.metaText}>
                      Reviewed: {new Date(app.reviewed_at).toLocaleDateString('en-KE')}
                    </Text>
                  )}
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
            <Text style={styles.modalTitle}>Apply as Banking Partner</Text>
            <TouchableOpacity onPress={() => setShowApplyModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Partner Type</Text>
            <View style={styles.typeSelector}>
              {['bank', 'microfinance', 'sacco_bank'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, form.partner_type === type && styles.typeOptionActive]}
                  onPress={() => setForm(prev => ({ ...prev, partner_type: type }))}
                >
                  <Text style={[styles.typeOptionText, form.partner_type === type && styles.typeOptionTextActive]}>
                    {type === 'sacco_bank' ? 'SACCO Bank' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Organization Name *</Text>
            <TextInput
              style={styles.input}
              value={form.organization_name}
              onChangeText={(text) => setForm(prev => ({ ...prev, organization_name: text }))}
              placeholder="e.g. Equity Bank"
            />

            <Text style={styles.inputLabel}>Registration Number</Text>
            <TextInput
              style={styles.input}
              value={form.registration_number}
              onChangeText={(text) => setForm(prev => ({ ...prev, registration_number: text }))}
              placeholder="Business registration number"
            />

            <Text style={styles.inputLabel}>Country</Text>
            <TextInput
              style={styles.input}
              value={form.country}
              onChangeText={(text) => setForm(prev => ({ ...prev, country: text }))}
            />

            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.input}
              value={form.city}
              onChangeText={(text) => setForm(prev => ({ ...prev, city: text }))}
              placeholder="e.g. Nairobi"
            />

            <Text style={styles.inputLabel}>Contact Name</Text>
            <TextInput
              style={styles.input}
              value={form.contact_name}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact_name: text }))}
              placeholder="Primary contact person"
            />

            <Text style={styles.inputLabel}>Contact Email *</Text>
            <TextInput
              style={styles.input}
              value={form.contact_email}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact_email: text }))}
              placeholder="partner@bank.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Contact Phone *</Text>
            <TextInput
              style={styles.input}
              value={form.contact_phone}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact_phone: text }))}
              placeholder="+254 700 000 000"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Website</Text>
            <TextInput
              style={styles.input}
              value={form.website}
              onChangeText={(text) => setForm(prev => ({ ...prev, website: text }))}
              placeholder="https://www.bank.com"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Services Offered</Text>
            <View style={styles.servicesGrid}>
              {serviceOptions.map((service) => (
                <TouchableOpacity
                  key={service}
                  style={[styles.serviceChip, form.services.includes(service) && styles.serviceChipActive]}
                  onPress={() => toggleService(service)}
                >
                  <Text style={[styles.serviceChipText, form.services.includes(service) && styles.serviceChipTextActive]}>
                    {service}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
              placeholder="Tell us about your institution and what you offer..."
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
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
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 8,
  },
  infoDesc: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  partnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  partnerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  partnerType: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  partnerDetails: {
    marginTop: 12,
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#6B7280',
  },
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  featureChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  featureText: {
    fontSize: 11,
    color: '#4B5563',
  },
  moreText: {
    fontSize: 11,
    color: '#9CA3AF',
    alignSelf: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#D1D5DB',
    marginTop: 4,
    textAlign: 'center',
  },
  applyButton: {
    marginTop: 20,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  applicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicationName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  applicationMeta: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  notesBox: {
    marginTop: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  notesText: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
    marginTop: 14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  typeOptionActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeOptionTextActive: {
    color: '#4F46E5',
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  serviceChipActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  serviceChipText: {
    fontSize: 12,
    color: '#6B7280',
  },
  serviceChipTextActive: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 40,
  },
});
