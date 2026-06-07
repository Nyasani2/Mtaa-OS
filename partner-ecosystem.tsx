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

interface Partner {
  id: string;
  partner_category: string;
  partner_type: string;
  organization_name: string;
  country: string;
  city: string;
  status: string;
  services_offered: string[];
  contact_email: string;
  created_at: string;
}

interface MyApplication {
  id: string;
  partner_category: string;
  partner_type: string;
  organization_name: string;
  status: string;
  submitted_at: string;
}

type TabType = 'directory' | 'categories' | 'myApps';

const categories = [
  { id: 'banking', label: 'Banking', icon: 'bank', color: '#4F46E5', desc: 'Banks, MFIs, SACCOs' },
  { id: 'insurance', label: 'Insurance', icon: 'shield-check', color: '#059669', desc: 'Health, vehicle, life' },
  { id: 'government', label: 'Government', icon: 'landmark', color: '#D97706', desc: 'Revenue, identity, licensing' },
  { id: 'healthcare', label: 'Healthcare', icon: 'hospital', color: '#DC2626', desc: 'Hospitals, clinics, pharma' },
  { id: 'education', label: 'Education', icon: 'school', color: '#7C3AED', desc: 'Schools, colleges, training' },
  { id: 'retail', label: 'Retail', icon: 'store', color: '#0891B2', desc: 'Shops, supermarkets, markets' },
  { id: 'transport', label: 'Transport', icon: 'bus', color: '#EA580C', desc: 'Matatu, logistics, delivery' },
  { id: 'technology', label: 'Technology', icon: 'laptop-code', color: '#2563EB', desc: 'Software, hardware, telecom' },
  { id: 'agriculture', label: 'Agriculture', icon: 'sprout', color: '#65A30D', desc: 'Farming, inputs, markets' },
];

export default function PartnerEcosystemScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('directory');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [myApplications, setMyApplications] = useState<MyApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    partner_category: 'banking',
    partner_type: 'bank',
    organization_name: '',
    registration_number: '',
    country: 'Kenya',
    city: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    website: '',
    services_offered: [] as string[],
    description: '',
  });

  const fetchPartners = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_partner_applications')
        .select('*')
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
        .select('id, partner_category, partner_type, organization_name, status, submitted_at')
        .eq('submitted_by', user.id)
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
        partner_category: form.partner_category,
        partner_type: form.partner_type,
        organization_name: form.organization_name,
        registration_number: form.registration_number,
        country: form.country,
        city: form.city,
        contact_name: form.contact_name,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        website: form.website,
        services_offered: form.services_offered,
        description: form.description,
        submitted_by: user.id,
        status: 'pending',
      });
      if (error) throw error;

      Alert.alert('Success', 'Partner application submitted for review');
      setShowApplyModal(false);
      setForm({
        partner_category: 'banking', partner_type: 'bank', organization_name: '',
        registration_number: '', country: 'Kenya', city: '', contact_name: '',
        contact_email: '', contact_phone: '', website: '', services_offered: [], description: '',
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

  const getCategoryIcon = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.icon || 'store';
  };

  const getCategoryColor = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat?.color || '#4F46E5';
  };

  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.partner_category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categoryCounts = categories.map(cat => ({
    ...cat,
    count: partners.filter(p => p.partner_category === cat.id).length,
  }));

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
        <Text style={styles.headerTitle}>Partner Ecosystem</Text>
        <TouchableOpacity onPress={() => setShowApplyModal(true)} style={styles.backButton}>
          <Ionicons name="add-circle" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {[
          { key: 'directory' as TabType, label: 'Directory' },
          { key: 'categories' as TabType, label: 'Categories' },
          { key: 'myApps' as TabType, label: 'My Apps' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'directory' && (
          <>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search partners..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor="#9CA3AF"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {selectedCategory && (
              <View style={styles.filterChip}>
                <Text style={styles.filterChipText}>
                  Filtering: {categories.find(c => c.id === selectedCategory)?.label}
                </Text>
                <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                  <Ionicons name="close" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.resultCount}>
              {filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''} found
            </Text>

            {filteredPartners.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="store-off-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>
                  {searchQuery || selectedCategory ? 'No matches found' : 'No partners yet'}
                </Text>
                <TouchableOpacity style={styles.applyButton} onPress={() => setShowApplyModal(true)}>
                  <Text style={styles.applyButtonText}>Become a Partner</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredPartners.map((partner) => (
                <View key={partner.id} style={styles.partnerCard}>
                  <View style={styles.partnerHeader}>
                    <View style={[styles.partnerIcon, { backgroundColor: getCategoryColor(partner.partner_category) + '15' }]}>
                      <MaterialCommunityIcons
                        name={getCategoryIcon(partner.partner_category) as any}
                        size={22}
                        color={getCategoryColor(partner.partner_category)}
                      />
                    </View>
                    <View style={styles.partnerInfo}>
                      <Text style={styles.partnerName}>{partner.organization_name}</Text>
                      <Text style={styles.partnerCategory}>
                        {partner.partner_category} · {partner.partner_type}
                      </Text>
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
                  </View>
                  {partner.services_offered && partner.services_offered.length > 0 && (
                    <View style={styles.featuresRow}>
                      {partner.services_offered.slice(0, 4).map((svc, idx) => (
                        <View key={idx} style={styles.featureChip}>
                          <Text style={styles.featureText}>{svc}</Text>
                        </View>
                      ))}
                      {partner.services_offered.length > 4 && (
                        <Text style={styles.moreText}>+{partner.services_offered.length - 4}</Text>
                      )}
                    </View>
                  )}
                </View>
              ))
            )}
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <View style={styles.heroCard}>
              <MaterialCommunityIcons name="storefront" size={32} color="#4F46E5" />
              <Text style={styles.heroTitle}>Partner Categories</Text>
              <Text style={styles.heroDesc}>
                Explore partners by category. Click a category to filter the directory.
              </Text>
            </View>

            <View style={styles.categoryGrid}>
              {categoryCounts.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryCard, { borderLeftColor: cat.color, borderLeftWidth: 4 }]}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setActiveTab('directory');
                  }}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: cat.color + '15' }]}>
                    <MaterialCommunityIcons name={cat.icon as any} size={24} color={cat.color} />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryLabel}>{cat.label}</Text>
                    <Text style={styles.categoryDesc}>{cat.desc}</Text>
                  </View>
                  <View style={styles.categoryCount}>
                    <Text style={[styles.categoryCountText, { color: cat.color }]}>{cat.count}</Text>
                    <Text style={styles.categoryCountLabel}>partners</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeTab === 'myApps' && (
          <>
            <View style={styles.heroCard}>
              <Ionicons name="document-text" size={28} color="#4F46E5" />
              <Text style={styles.heroTitle}>My Applications</Text>
              <Text style={styles.heroDesc}>Track all your partner applications across categories</Text>
            </View>

            {myApplications.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="file-tray-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No applications yet</Text>
                <TouchableOpacity style={styles.applyButton} onPress={() => setShowApplyModal(true)}>
                  <Text style={styles.applyButtonText}>Apply as Partner</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myApplications.map((app) => (
                <View key={app.id} style={styles.applicationCard}>
                  <View style={styles.applicationHeader}>
                    <View style={[styles.appIcon, { backgroundColor: getCategoryColor(app.partner_category) + '15' }]}>
                      <MaterialCommunityIcons
                        name={getCategoryIcon(app.partner_category) as any}
                        size={18}
                        color={getCategoryColor(app.partner_category)}
                      />
                    </View>
                    <View style={styles.applicationInfo}>
                      <Text style={styles.applicationName}>{app.organization_name}</Text>
                      <Text style={styles.applicationCategory}>
                        {app.partner_category} · {app.partner_type}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(app.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(app.status) }]}>
                        {getStatusLabel(app.status)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.applicationDate}>
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
            <Text style={styles.modalTitle}>Apply as Partner</Text>
            <TouchableOpacity onPress={() => setShowApplyModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Partner Category</Text>
            <View style={styles.categorySelector}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.catOption, form.partner_category === cat.id && styles.catOptionActive]}
                  onPress={() => setForm(prev => ({ ...prev, partner_category: cat.id }))}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as any}
                    size={16}
                    color={form.partner_category === cat.id ? cat.color : '#9CA3AF'}
                  />
                  <Text style={[styles.catOptionText, form.partner_category === cat.id && { color: cat.color, fontWeight: '700' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Partner Type</Text>
            <TextInput
              style={styles.input}
              value={form.partner_type}
              onChangeText={(text) => setForm(prev => ({ ...prev, partner_type: text }))}
              placeholder="e.g. bank, hospital, school, retailer"
            />

            <Text style={styles.inputLabel}>Organization Name *</Text>
            <TextInput
              style={styles.input}
              value={form.organization_name}
              onChangeText={(text) => setForm(prev => ({ ...prev, organization_name: text }))}
              placeholder="Your organization name"
            />

            <Text style={styles.inputLabel}>Registration Number</Text>
            <TextInput
              style={styles.input}
              value={form.registration_number}
              onChangeText={(text) => setForm(prev => ({ ...prev, registration_number: text }))}
              placeholder="Business registration number"
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
              placeholder="partner@example.com" keyboardType="email-address" autoCapitalize="none" />

            <Text style={styles.inputLabel}>Contact Phone *</Text>
            <TextInput style={styles.input} value={form.contact_phone}
              onChangeText={(text) => setForm(prev => ({ ...prev, contact_phone: text }))}
              placeholder="+254 700 000 000" keyboardType="phone-pad" />

            <Text style={styles.inputLabel}>Website</Text>
            <TextInput style={styles.input} value={form.website}
              onChangeText={(text) => setForm(prev => ({ ...prev, website: text }))}
              placeholder="https://www.example.com" autoCapitalize="none" />

            <Text style={styles.inputLabel}>Services Offered (comma-separated)</Text>
            <TextInput
              style={styles.input}
              value={form.services_offered.join(', ')}
              onChangeText={(text) => setForm(prev => ({ ...prev, services_offered: text.split(',').map(s => s.trim()).filter(Boolean) }))}
              placeholder="e.g. Mobile Banking, Loans, Savings"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={(text) => setForm(prev => ({ ...prev, description: text }))}
              placeholder="Tell us about your organization and what you offer..."
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
  tabBar: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#E5E7EB', alignItems: 'center' },
  tabActive: { backgroundColor: '#4F46E5' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF' },
  content: { flex: 1, paddingHorizontal: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  filterChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#EEF2FF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6, marginBottom: 10 },
  filterChipText: { fontSize: 12, color: '#4F46E5', fontWeight: '600' },
  resultCount: { fontSize: 13, color: '#6B7280', marginBottom: 10 },
  heroCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  heroTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8 },
  heroDesc: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4, lineHeight: 18 },
  partnerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  partnerHeader: { flexDirection: 'row', alignItems: 'center' },
  partnerIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  partnerCategory: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '700' },
  partnerDetails: { marginTop: 12, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: '#6B7280' },
  featuresRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  featureChip: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  featureText: { fontSize: 11, color: '#4B5563' },
  moreText: { fontSize: 11, color: '#9CA3AF', alignSelf: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#9CA3AF', marginTop: 16, textAlign: 'center' },
  applyButton: { marginTop: 20, backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  applyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  categoryGrid: { gap: 10 },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  categoryIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  categoryInfo: { flex: 1 },
  categoryLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  categoryDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  categoryCount: { alignItems: 'center', paddingHorizontal: 10 },
  categoryCountText: { fontSize: 20, fontWeight: '800' },
  categoryCountLabel: { fontSize: 11, color: '#9CA3AF' },
  applicationCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  applicationHeader: { flexDirection: 'row', alignItems: 'center' },
  appIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  applicationInfo: { flex: 1 },
  applicationName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  applicationCategory: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
  applicationDate: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  modalContainer: { flex: 1, backgroundColor: '#F3F4F6' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalContent: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#111827', borderWidth: 1, borderColor: '#E5E7EB' },
  textArea: { height: 100, textAlignVertical: 'top' },
  categorySelector: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catOption: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB' },
  catOptionActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  catOptionText: { fontSize: 11, color: '#6B7280' },
  submitButton: { backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 24, marginBottom: 16 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  bottomPadding: { height: 40 },
});
