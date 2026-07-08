import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

type CopyrightTab = 'ownership' | 'claims' | 'licenses' | 'disputes' | 'fairuse';

interface OwnershipRecord {
  id: string;
  content_id: string;
  content_title: string;
  content_type: 'video' | 'music' | 'image' | 'text';
  fingerprint: string;
  registered_at: string;
  status: 'active' | 'disputed' | 'removed';
}

interface ClaimRecord {
  id: string;
  claimant: string;
  content_title: string;
  claim_type: 'copyright' | 'trademark' | 'privacy';
  status: 'open' | 'reviewing' | 'resolved' | 'rejected';
  filed_at: string;
}

interface LicenseRecord {
  id: string;
  content_title: string;
  licensee: string;
  license_type: 'personal' | 'commercial' | 'broadcast' | 'sync';
  start_date: string;
  end_date?: string;
  revenue_share: number;
  status: 'active' | 'expired' | 'terminated';
}

export default function CopyrightScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<CopyrightTab>('ownership');
  const [ownerships, setOwnerships] = useState<OwnershipRecord[]>([]);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [licenses, setLicenses] = useState<LicenseRecord[]>([]);

  // New ownership form
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'video' | 'music' | 'image' | 'text'>('video');

  // New license form
  const [licenseTitle, setLicenseTitle] = useState('');
  const [licenseType, setLicenseType] = useState<'personal' | 'commercial' | 'broadcast' | 'sync'>('personal');
  const [licensee, setLicensee] = useState('');
  const [revenueShare, setRevenueShare] = useState('');

  useEffect(() => {
    fetchCopyrightData();
  }, []);

  const fetchCopyrightData = async () => {
    if (!user?.id) return;
    try {
      const { data: own } = await supabase.from('studio_copyright_ownership').select('*').eq('owner_id', user.id);
      setOwnerships(own || []);
      const { data: clm } = await supabase.from('studio_copyright_claims').select('*').eq('owner_id', user.id);
      setClaims(clm || []);
      const { data: lic } = await supabase.from('studio_copyright_licenses').select('*').eq('owner_id', user.id);
      setLicenses(lic || []);
    } catch (e) { console.error(e); }
  };

  const registerContent = async () => {
    if (!newTitle.trim() || !user?.id) return;
    try {
      const fingerprint = `FP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      await supabase.from('studio_copyright_ownership').insert({
        owner_id: user.id,
        content_title: newTitle,
        content_type: newType,
        fingerprint,
        status: 'active',
      });
      setNewTitle('');
      fetchCopyrightData();
    } catch (e) { console.error(e); }
  };

  const createLicense = async () => {
    if (!licenseTitle.trim() || !licensee.trim() || !user?.id) return;
    try {
      await supabase.from('studio_copyright_licenses').insert({
        owner_id: user.id,
        content_title: licenseTitle,
        licensee,
        license_type: licenseType,
        revenue_share: parseFloat(revenueShare) || 0,
        status: 'active',
      });
      setLicenseTitle(''); setLicensee(''); setRevenueShare('');
      fetchCopyrightData();
    } catch (e) { console.error(e); }
  };

  const fileDispute = (claimId: string) => {
    Alert.alert('File Dispute', 'Are you sure you want to dispute this claim?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Dispute', onPress: async () => {
        try {
          await supabase.from('studio_copyright_claims').update({ status: 'reviewing', disputed_at: new Date().toISOString() }).eq('id', claimId);
          fetchCopyrightData();
        } catch (e) { console.error(e); }
      }},
    ]);
  };

  const renderOwnership = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.registerCard}>
        <Text style={styles.registerTitle}>Register New Content</Text>
        <TextInput style={styles.formInput} value={newTitle} onChangeText={setNewTitle} placeholder="Content title" placeholderTextColor="#666" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {(['video', 'music', 'image', 'text'] as const).map(t => (
            <TouchableOpacity key={t} onPress={() => setNewType(t)} style={[styles.typeChip, newType === t && styles.typeChipActive]}>
              <Text style={[styles.typeChipText, newType === t && styles.typeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TouchableOpacity style={styles.registerBtn} onPress={registerContent}>
          <Feather name="shield" size={16} color="#fff" />
          <Text style={styles.registerBtnText}>Register & Fingerprint</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Registered Content</Text>
      {ownerships.map(item => (
        <View key={item.id} style={styles.ownershipCard}>
          <View style={styles.ownershipHeader}>
            <View style={[styles.typeIcon, { backgroundColor: item.content_type === 'video' ? '#ef444422' : item.content_type === 'music' ? '#6366f122' : item.content_type === 'image' ? '#10b98122' : '#f59e0b22' }]}>
              <Feather name={item.content_type === 'video' ? 'film' : item.content_type === 'music' ? 'music' : item.content_type === 'image' ? 'image' : 'file-text'} size={16} color={item.content_type === 'video' ? '#ef4444' : item.content_type === 'music' ? '#6366f1' : item.content_type === 'image' ? '#10b981' : '#f59e0b'} />
            </View>
            <View style={styles.ownershipInfo}>
              <Text style={styles.ownershipTitle}>{item.content_title}</Text>
              <Text style={styles.ownershipMeta}>{item.content_type} • {new Date(item.registered_at).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.statusBadge, item.status === 'active' && styles.statusActive, item.status === 'disputed' && styles.statusDisputed]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          <View style={styles.fingerprintBox}>
            <Text style={styles.fingerprintLabel}>Fingerprint</Text>
            <Text style={styles.fingerprintValue} selectable>{item.fingerprint}</Text>
          </View>
        </View>
      ))}

      {ownerships.length === 0 && (
        <View style={styles.emptyBox}>
          <Feather name="shield" size={48} color="#333" />
          <Text style={styles.emptyText}>No registered content yet</Text>
        </View>
      )}
    </ScrollView>
  );

  const renderClaims = () => (
    <FlatList
      data={claims}
      keyExtractor={c => c.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Feather name="check-circle" size={48} color="#333" />
          <Text style={styles.emptyText}>No claims against your content</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.claimCard}>
          <View style={styles.claimHeader}>
            <Text style={styles.claimTitle}>{item.content_title}</Text>
            <View style={[styles.claimBadge, item.status === 'open' && styles.claimOpen, item.status === 'reviewing' && styles.claimReviewing, item.status === 'resolved' && styles.claimResolved]}>
              <Text style={styles.claimBadgeText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.claimMeta}>Claimed by {item.claimant} • {item.claim_type}</Text>
          <Text style={styles.claimDate}>Filed {new Date(item.filed_at).toLocaleDateString()}</Text>
          {item.status === 'open' && (
            <TouchableOpacity style={styles.disputeBtn} onPress={() => fileDispute(item.id)}>
              <Text style={styles.disputeBtnText}>File Dispute</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );

  const renderLicenses = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.registerCard}>
        <Text style={styles.registerTitle}>Create License</Text>
        <TextInput style={styles.formInput} value={licenseTitle} onChangeText={setLicenseTitle} placeholder="Content title" placeholderTextColor="#666" />
        <TextInput style={styles.formInput} value={licensee} onChangeText={setLicensee} placeholder="Licensee name" placeholderTextColor="#666" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {(['personal', 'commercial', 'broadcast', 'sync'] as const).map(t => (
            <TouchableOpacity key={t} onPress={() => setLicenseType(t)} style={[styles.typeChip, licenseType === t && styles.typeChipActive]}>
              <Text style={[styles.typeChipText, licenseType === t && styles.typeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput style={styles.formInput} value={revenueShare} onChangeText={setRevenueShare} placeholder="Revenue share % (e.g., 20)" placeholderTextColor="#666" keyboardType="decimal-pad" />
        <TouchableOpacity style={styles.registerBtn} onPress={createLicense}>
          <Feather name="file-text" size={16} color="#fff" />
          <Text style={styles.registerBtnText}>Create License</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Active Licenses</Text>
      {licenses.map(item => (
        <View key={item.id} style={styles.licenseCard}>
          <View style={styles.licenseHeader}>
            <Text style={styles.licenseTitle}>{item.content_title}</Text>
            <View style={[styles.licenseBadge, item.status === 'active' && styles.licenseActive, item.status === 'expired' && styles.licenseExpired]}>
              <Text style={styles.licenseBadgeText}>{item.status}</Text>
            </View>
          </View>
          <Text style={styles.licenseMeta}>Licensee: {item.licensee}</Text>
          <Text style={styles.licenseMeta}>Type: {item.license_type}</Text>
          <View style={styles.licenseRevenue}>
            <Text style={styles.licenseRevenueLabel}>Revenue Share</Text>
            <Text style={styles.licenseRevenueValue}>{item.revenue_share}%</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );

  const renderDisputes = () => (
    <View style={styles.disputeContainer}>
      <View style={styles.disputeInfo}>
        <Feather name="info" size={24} color="#6366f1" />
        <Text style={styles.disputeTitle}>Dispute Resolution Center</Text>
        <Text style={styles.disputeDesc}>
          If you believe a claim was made in error, you can file a dispute. Our team will review both sides and make a fair determination.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Dispute Process</Text>
      {[
        { step: 1, title: 'File Dispute', desc: 'Submit your counter-claim with evidence' },
        { step: 2, title: 'Under Review', desc: 'Our team examines both claims (3-5 days)' },
        { step: 3, title: 'Decision', desc: 'You receive a final determination' },
        { step: 4, title: 'Appeal', desc: 'If unsatisfied, appeal within 14 days' },
      ].map(s => (
        <View key={s.step} style={styles.processStep}>
          <View style={styles.processNumber}>
            <Text style={styles.processNumberText}>{s.step}</Text>
          </View>
          <View style={styles.processInfo}>
            <Text style={styles.processTitle}>{s.title}</Text>
            <Text style={styles.processDesc}>{s.desc}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderFairUse = () => (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.fairUseContainer}>
      <View style={styles.fairUseCard}>
        <Feather name="scale" size={32} color="#6366f1" />
        <Text style={styles.fairUseTitle}>Fair Use Review</Text>
        <Text style={styles.fairUseDesc}>
          Content that falls under fair use (commentary, criticism, education, parody) can be marked for review to prevent incorrect takedowns.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Fair Use Categories</Text>
      {[
        { title: 'Commentary & Criticism', desc: 'Using content to comment on or critique', example: 'Movie reviews, reaction videos' },
        { title: 'Education', desc: 'Using content for teaching purposes', example: 'Documentaries, tutorials' },
        { title: 'Parody', desc: 'Transformative use for humor or satire', example: 'Satirical sketches, remixes' },
        { title: 'News Reporting', desc: 'Using content in news coverage', example: 'News clips, interviews' },
      ].map((cat, i) => (
        <View key={i} style={styles.fairUseItem}>
          <Text style={styles.fairUseItemTitle}>{cat.title}</Text>
          <Text style={styles.fairUseItemDesc}>{cat.desc}</Text>
          <Text style={styles.fairUseExample}>Example: {cat.example}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.fairUseBtn}>
        <Text style={styles.fairUseBtnText}>Request Fair Use Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Copyright & Rights</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {[
          { id: 'ownership' as CopyrightTab, label: 'Ownership', icon: 'shield' },
          { id: 'claims' as CopyrightTab, label: 'Claims', icon: 'alert-circle' },
          { id: 'licenses' as CopyrightTab, label: 'Licenses', icon: 'file-text' },
          { id: 'disputes' as CopyrightTab, label: 'Disputes', icon: 'git-pull-request' },
          { id: 'fairuse' as CopyrightTab, label: 'Fair Use', icon: 'scale' },
        ].map(t => (
          <TouchableOpacity key={t.id} onPress={() => setActiveTab(t.id)} style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}>
            <Feather name={t.icon as any} size={14} color={activeTab === t.id ? '#6366f1' : '#666'} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {activeTab === 'ownership' && renderOwnership()}
        {activeTab === 'claims' && renderClaims()}
        {activeTab === 'licenses' && renderLicenses()}
        {activeTab === 'disputes' && renderDisputes()}
        {activeTab === 'fairuse' && renderFairUse()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  tabScroll: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: '#6366f1' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '700' },

  content: { flex: 1 },

  // Ownership
  registerCard: { backgroundColor: '#141414', borderRadius: 12, padding: 16, margin: 16, marginBottom: 8 },
  registerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  formInput: { backgroundColor: '#1f1f1f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14, marginBottom: 10 },
  typeScroll: { marginBottom: 10 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  typeChipActive: { backgroundColor: '#6366f1' },
  typeChipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  typeChipTextActive: { fontWeight: '700' },
  registerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6366f1', padding: 12, borderRadius: 8 },
  registerBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginBottom: 12, marginTop: 8 },
  ownershipCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 10 },
  ownershipHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typeIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  ownershipInfo: { flex: 1 },
  ownershipTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  ownershipMeta: { color: '#9ca3af', fontSize: 12, marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: '#1f1f1f' },
  statusActive: { backgroundColor: 'rgba(16,185,129,0.2)' },
  statusDisputed: { backgroundColor: 'rgba(239,68,68,0.2)' },
  statusText: { color: '#9ca3af', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  fingerprintBox: { backgroundColor: '#0f0f0f', borderRadius: 8, padding: 10, marginTop: 10 },
  fingerprintLabel: { color: '#666', fontSize: 10, fontWeight: '600', marginBottom: 4 },
  fingerprintValue: { color: '#6366f1', fontSize: 11, fontFamily: 'monospace' },

  // Claims
  claimCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 10 },
  claimHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  claimTitle: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  claimBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  claimOpen: { backgroundColor: 'rgba(239,68,68,0.2)' },
  claimReviewing: { backgroundColor: 'rgba(245,158,11,0.2)' },
  claimResolved: { backgroundColor: 'rgba(16,185,129,0.2)' },
  claimBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  claimMeta: { color: '#9ca3af', fontSize: 12 },
  claimDate: { color: '#666', fontSize: 11, marginTop: 4 },
  disputeBtn: { backgroundColor: '#6366f1', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  disputeBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  // Licenses
  licenseCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 10 },
  licenseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  licenseTitle: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  licenseBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  licenseActive: { backgroundColor: 'rgba(16,185,129,0.2)' },
  licenseExpired: { backgroundColor: 'rgba(100,100,100,0.2)' },
  licenseBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  licenseMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  licenseRevenue: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1f1f1f' },
  licenseRevenueLabel: { color: '#666', fontSize: 12 },
  licenseRevenueValue: { color: '#10b981', fontSize: 14, fontWeight: '700' },

  // Disputes
  disputeContainer: { padding: 16 },
  disputeInfo: { alignItems: 'center', backgroundColor: '#141414', borderRadius: 16, padding: 24, marginBottom: 20 },
  disputeTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  disputeDesc: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  processStep: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  processNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  processNumberText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  processInfo: { flex: 1 },
  processTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  processDesc: { color: '#9ca3af', fontSize: 12, marginTop: 2 },

  // Fair Use
  fairUseContainer: { padding: 16 },
  fairUseCard: { alignItems: 'center', backgroundColor: '#141414', borderRadius: 16, padding: 24, marginBottom: 20 },
  fairUseTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  fairUseDesc: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  fairUseItem: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginBottom: 10 },
  fairUseItemTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fairUseItemDesc: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  fairUseExample: { color: '#6366f1', fontSize: 11, marginTop: 4, fontStyle: 'italic' },
  fairUseBtn: { backgroundColor: '#6366f1', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  fairUseBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Empty
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 16 },
});
