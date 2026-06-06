import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Image, RefreshControl, Alert, ActivityIndicator, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useWalletStore } from '@/hooks/useWalletStore';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';

interface GoFundCampaign {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  category: string;
  image_url: string | null;
  creator_name: string;
  end_date: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  donor_count: number;
  is_featured: boolean;
}

interface Donation {
  id: string;
  amount: number;
  donor_name: string;
  message: string | null;
  created_at: string;
  is_anonymous: boolean;
}

const CATEGORIES = ['Medical', 'Education', 'Emergency', 'Business', 'Community', 'Funeral', 'Other'];

export default function GoFundScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const [campaigns, setCampaigns] = useState<GoFundCampaign[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<GoFundCampaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-campaigns' | 'my-donations'>('discover');
  const [selectedCampaign, setSelectedCampaign] = useState<GoFundCampaign | null>(null);
  const [donateModalVisible, setDonateModalVisible] = useState(false);
  const [donateAmount, setDonateAmount] = useState('');
  const [donateMessage, setDonateMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ title: '', description: '', target_amount: '', category: 'Medical', end_date: '' });
  const [processing, setProcessing] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    const { data, error } = await supabase
      .from('gofund_campaigns')
      .select('*')
      .eq('status', 'active')
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data) setCampaigns(data);
  }, []);

  const fetchMyCampaigns = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('gofund_campaigns')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });
    if (!error && data) setMyCampaigns(data);
  }, [user]);

  const fetchDonations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('gofund_donations')
      .select('*, campaign:gofund_campaigns(title)')
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (!error && data) setDonations(data);
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCampaigns(), fetchMyCampaigns(), fetchDonations()]);
    setLoading(false);
  }, [fetchCampaigns, fetchMyCampaigns, fetchDonations]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const handleDonate = async () => {
    if (!selectedCampaign || !user) return;
    const amount = parseFloat(donateAmount);
    if (isNaN(amount) || amount <= 0) { Alert.alert('Error', 'Enter a valid amount'); return; }
    if (amount > balance) { Alert.alert('Error', 'Insufficient wallet balance'); return; }
    setProcessing(true);
    const { error } = await supabase.rpc('gofund_donate', {
      p_campaign_id: selectedCampaign.id,
      p_donor_id: user.id,
      p_amount: amount,
      p_message: donateMessage || null,
      p_is_anonymous: isAnonymous
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', `Donated KES ${amount.toLocaleString()} to ${selectedCampaign.title}`);
    setDonateModalVisible(false);
    setDonateAmount(''); setDonateMessage(''); setIsAnonymous(false);
    loadAll();
  };

  const handleCreateCampaign = async () => {
    if (!user) return;
    const target = parseFloat(newCampaign.target_amount);
    if (!newCampaign.title.trim() || !newCampaign.description.trim() || isNaN(target) || target <= 0) {
      Alert.alert('Error', 'Fill all required fields'); return;
    }
    setProcessing(true);
    const { error } = await supabase.from('gofund_campaigns').insert({
      creator_id: user.id,
      title: newCampaign.title.trim(),
      description: newCampaign.description.trim(),
      target_amount: target,
      category: newCampaign.category,
      end_date: newCampaign.end_date || null,
      raised_amount: 0,
      status: 'active',
      donor_count: 0,
      is_featured: false
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', 'Campaign created!');
    setCreateModalVisible(false);
    setNewCampaign({ title: '', description: '', target_amount: '', category: 'Medical', end_date: '' });
    loadAll();
  };

  const renderCampaignCard = (campaign: GoFundCampaign, isMine = false) => {
    const progress = Math.min((campaign.raised_amount / campaign.target_amount) * 100, 100);
    const daysLeft = Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return (
      <TouchableOpacity key={campaign.id} style={styles.campaignCard}
        onPress={() => { setSelectedCampaign(campaign); setDonateModalVisible(true); }} activeOpacity={0.85}>
        {campaign.image_url && <Image source={{ uri: campaign.image_url }} style={styles.campaignImage} />}
        <View style={styles.campaignContent}>
          <View style={styles.campaignHeader}>
            <Text style={styles.campaignTitle} numberOfLines={2}>{campaign.title}</Text>
            {campaign.is_featured && <View style={styles.featuredBadge}><Text style={styles.featuredText}>FEATURED</Text></View>}
          </View>
          <Text style={styles.campaignDesc} numberOfLines={2}>{campaign.description}</Text>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
              <Text style={styles.raisedText}>KES {campaign.raised_amount.toLocaleString()} of {campaign.target_amount.toLocaleString()}</Text>
            </View>
          </View>
          <View style={styles.campaignFooter}>
            <View style={styles.footerItem}><Ionicons name="people" size={14} color="#8E8E93" /><Text style={styles.footerText}>{campaign.donor_count} donors</Text></View>
            <View style={styles.footerItem}><Ionicons name="time" size={14} color="#8E8E93" /><Text style={styles.footerText}>{daysLeft > 0 ? `${daysLeft} days left` : 'Ended'}</Text></View>
            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(campaign.category) }]}><Text style={styles.categoryText}>{campaign.category}</Text></View>
          </View>
          {isMine && (
            <View style={styles.mineActions}>
              <TouchableOpacity style={styles.mineBtn} onPress={() => router.push(`/(os)/wallet/gofund-edit?id=${campaign.id}`)}><Text style={styles.mineBtnText}>Edit</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.mineBtn, styles.mineBtnDanger]} onPress={() => Alert.alert('Withdraw', 'Request withdrawal of raised funds?')}><Text style={styles.mineBtnText}>Withdraw</Text></TouchableOpacity>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = { Medical: '#FF3B30', Education: '#007AFF', Emergency: '#FF9500', Business: '#34C759', Community: '#5856D6', Funeral: '#8E8E93', Other: '#C7C7CC' };
    return map[cat] || '#C7C7CC';
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /><Text style={styles.loadingText}>Loading GoFund...</Text></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>GoFund</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModalVisible(true)}><Ionicons name="add-circle" size={28} color="#34C759" /></TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}><Text style={styles.statValue}>{campaigns.length}</Text><Text style={styles.statLabel}>Active</Text></View>
        <View style={styles.statBox}><Text style={styles.statValue}>KES {campaigns.reduce((s, c) => s + c.raised_amount, 0).toLocaleString()}</Text><Text style={styles.statLabel}>Raised</Text></View>
        <View style={styles.statBox}><Text style={styles.statValue}>{campaigns.reduce((s, c) => s + c.donor_count, 0)}</Text><Text style={styles.statLabel}>Donors</Text></View>
      </View>

      <View style={styles.tabBar}>
        {(['discover', 'my-campaigns', 'my-donations'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab === 'discover' ? 'Discover' : tab === 'my-campaigns' ? 'My Campaigns' : 'My Donations'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'discover' && campaigns.map(c => renderCampaignCard(c))}
        {activeTab === 'my-campaigns' && myCampaigns.map(c => renderCampaignCard(c, true))}
        {activeTab === 'my-donations' && donations.map(d => (
          <View key={d.id} style={styles.donationCard}>
            <View style={styles.donationRow}><Text style={styles.donationAmount}>KES {d.amount.toLocaleString()}</Text><Text style={styles.donationDate}>{new Date(d.created_at).toLocaleDateString()}</Text></View>
            <Text style={styles.donationCampaign}>{(d as any).campaign?.title || 'Campaign'}</Text>
            {d.message && <Text style={styles.donationMessage}>"{d.message}"</Text>}
            {d.is_anonymous && <Text style={styles.anonBadge}>Anonymous</Text>}
          </View>
        ))}
        {activeTab === 'discover' && campaigns.length === 0 && (
          <View style={styles.empty}><Ionicons name="heart-outline" size={48} color="#C7C7CC" /><Text style={styles.emptyText}>No active campaigns</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setCreateModalVisible(true)}><Text style={styles.emptyBtnText}>Start One</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={donateModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Donate to {selectedCampaign?.title}</Text>
            <Text style={styles.modalSubtitle}>Wallet Balance: KES {balance.toLocaleString()}</Text>
            <TextInput style={styles.input} placeholder="Amount (KES)" keyboardType="numeric" value={donateAmount} onChangeText={setDonateAmount} />
            <TextInput style={[styles.input, styles.textArea]} placeholder="Message (optional)" multiline value={donateMessage} onChangeText={setDonateMessage} />
            <TouchableOpacity style={styles.anonToggle} onPress={() => setIsAnonymous(!isAnonymous)}>
              <Ionicons name={isAnonymous ? "checkbox" : "square-outline"} size={20} color="#007AFF" /><Text style={styles.anonText}>Donate anonymously</Text>
            </TouchableOpacity>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setDonateModalVisible(false)}><Text style={styles.modalBtnSecondaryText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleDonate} disabled={processing}>{processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Donate</Text>}</TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </Modal>

      <Modal visible={createModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Start a Campaign</Text>
              <TextInput style={styles.input} placeholder="Campaign Title *" value={newCampaign.title} onChangeText={t => setNewCampaign(p => ({ ...p, title: t }))} />
              <TextInput style={[styles.input, styles.textArea]} placeholder="Description *" multiline value={newCampaign.description} onChangeText={t => setNewCampaign(p => ({ ...p, description: t }))} />
              <TextInput style={styles.input} placeholder="Target Amount (KES) *" keyboardType="numeric" value={newCampaign.target_amount} onChangeText={t => setNewCampaign(p => ({ ...p, target_amount: t }))} />
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.categoryChip, newCampaign.category === cat && styles.categoryChipActive]} onPress={() => setNewCampaign(p => ({ ...p, category: cat }))}>
                    <Text style={[styles.categoryChipText, newCampaign.category === cat && styles.categoryChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>End Date (optional)</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" value={newCampaign.end_date} onChangeText={t => setNewCampaign(p => ({ ...p, end_date: t }))} />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setCreateModalVisible(false)}><Text style={styles.modalBtnSecondaryText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleCreateCampaign} disabled={processing}>{processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Create Campaign</Text>}</TouchableOpacity>
              </View>
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
  loadingText: { color: '#8E8E93', marginTop: 12, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, backgroundColor: '#1C1C1E' },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  createBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1C1C1E', borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1C1C1E', paddingHorizontal: 16, paddingBottom: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#2C2C2E' },
  tabText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  campaignCard: { backgroundColor: '#1C1C1E', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  campaignImage: { width: '100%', height: 160 },
  campaignContent: { padding: 16 },
  campaignHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  campaignTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1, marginRight: 8 },
  featuredBadge: { backgroundColor: '#FF9500', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  featuredText: { fontSize: 9, fontWeight: '800', color: '#fff' },
  campaignDesc: { fontSize: 13, color: '#8E8E93', marginBottom: 12, lineHeight: 18 },
  progressContainer: { marginBottom: 12 },
  progressBar: { height: 6, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 3 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressText: { fontSize: 12, fontWeight: '700', color: '#34C759' },
  raisedText: { fontSize: 11, color: '#8E8E93' },
  campaignFooter: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#8E8E93' },
  categoryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  categoryText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  mineActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  mineBtn: { flex: 1, backgroundColor: '#2C2C2E', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  mineBtnDanger: { backgroundColor: '#FF3B3020' },
  mineBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  donationCard: { backgroundColor: '#1C1C1E', borderRadius: 12, padding: 16, marginBottom: 12 },
  donationRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  donationAmount: { fontSize: 16, fontWeight: '700', color: '#34C759' },
  donationDate: { fontSize: 12, color: '#8E8E93' },
  donationCampaign: { fontSize: 13, color: '#fff', marginBottom: 4 },
  donationMessage: { fontSize: 12, color: '#8E8E93', fontStyle: 'italic' },
  anonBadge: { fontSize: 10, color: '#8E8E93', backgroundColor: '#2C2C2E', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 12, marginBottom: 16 },
  emptyBtn: { backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  input: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: '#fff', fontSize: 15, marginBottom: 12 },
  textArea: { height: 80, textAlignVertical: 'top' },
  label: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8, marginTop: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#2C2C2E' },
  categoryChipActive: { backgroundColor: '#007AFF' },
  categoryChipText: { fontSize: 13, color: '#8E8E93' },
  categoryChipTextActive: { color: '#fff', fontWeight: '600' },
  anonToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  anonText: { fontSize: 14, color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#34C759', alignItems: 'center' },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
