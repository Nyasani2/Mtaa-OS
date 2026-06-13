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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/kernel/auth.store';
import { supabase } from '@/lib/kernel/supabase';

interface Campaign {
  id: string;
  title: string;
  description: string;
  target_amount: number;
  raised_amount: number;
  currency: string;
  category: string;
  image_url?: string;
  creator_name: string;
  creator_id: string;
  status: 'active' | 'completed' | 'cancelled';
  end_date: string;
  created_at: string;
  contribution_count: number;
}

interface Contribution {
  id: string;
  campaign_id: string;
  amount: number;
  currency: string;
  contributor_name: string;
  is_anonymous: boolean;
  created_at: string;
}

interface CampaignUpdate {
  id: string;
  campaign_id: string;
  title: string;
  content: string;
  created_at: string;
}

type TabType = 'discover' | 'myCampaigns' | 'supported' | 'partners';

export default function GoFundHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [supportedCampaigns, setSupportedCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    target_amount: '',
    category: 'medical',
    end_date: '',
  });

  const categories = [
    'medical', 'education', 'business', 'community', 'emergency', 'creative', 'charity', 'other'
  ];

  const fetchCampaigns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_gofund_campaigns')
        .select(`
          id, title, description, target_amount, raised_amount, currency,
          category, image_url, creator_name, creator_id, status, end_date, created_at,
          contribution_count:wallet_gofund_contributions(count)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error('Fetch campaigns error:', err);
    }
  }, []);

  const fetchMyCampaigns = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('wallet_gofund_campaigns')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyCampaigns(data || []);
    } catch (err) {
      console.error('Fetch my campaigns error:', err);
    }
  }, [user?.id]);

  const fetchSupported = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('wallet_gofund_contributions')
        .select('campaign_id')
        .eq('contributor_id', user.id);

      if (error) throw error;

      if (data && data.length > 0) {
        const campaignIds = [...new Set(data.map(d => d.campaign_id))];
        const { data: campaignsData, error: campError } = await supabase
          .from('wallet_gofund_campaigns')
          .select('*')
          .in('id', campaignIds);

        if (campError) throw campError;
        setSupportedCampaigns(campaignsData || []);
      }
    } catch (err) {
      console.error('Fetch supported error:', err);
    }
  }, [user?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchCampaigns(), fetchMyCampaigns(), fetchSupported()]);
    setLoading(false);
  }, [fetchCampaigns, fetchMyCampaigns, fetchSupported]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchCampaignDetail = async (campaignId: string) => {
    try {
      const [contribRes, updatesRes] = await Promise.all([
        supabase
          .from('wallet_gofund_contributions')
          .select('id, campaign_id, amount, currency, contributor_name, is_anonymous, created_at')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('wallet_gofund_updates')
          .select('id, campaign_id, title, content, created_at')
          .eq('campaign_id', campaignId)
          .order('created_at', { ascending: false }),
      ]);

      if (contribRes.error) throw contribRes.error;
      if (updatesRes.error) throw updatesRes.error;

      setContributions(contribRes.data || []);
      setUpdates(updatesRes.data || []);
    } catch (err) {
      console.error('Fetch detail error:', err);
    }
  };

  const handleCreateCampaign = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }
    if (!createForm.title || !createForm.target_amount || !createForm.end_date) {
      Alert.alert('Missing Fields', 'Title, target amount, and end date are required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('wallet_gofund_campaigns')
        .insert({
          title: createForm.title,
          description: createForm.description,
          target_amount: parseFloat(createForm.target_amount),
          currency: 'KES',
          category: createForm.category,
          end_date: createForm.end_date,
          creator_id: user.id,
          creator_name: user.full_name || user.email?.split('@')[0] || 'Anonymous',
          status: 'active',
          raised_amount: 0,
        });

      if (error) throw error;

      Alert.alert('Success', 'Campaign created successfully');
      setShowCreateModal(false);
      setCreateForm({ title: '', description: '', target_amount: '', category: 'medical', end_date: '' });
      fetchMyCampaigns();
      fetchCampaigns();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async () => {
    if (!user?.id || !selectedCampaign) {
      Alert.alert('Error', 'Unable to process contribution');
      return;
    }
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount');
      return;
    }

    setSubmitting(true);
    try {
      // Record contribution
      const { error: contribError } = await supabase
        .from('wallet_gofund_contributions')
        .insert({
          campaign_id: selectedCampaign.id,
          contributor_id: user.id,
          contributor_name: user.full_name || 'Anonymous',
          amount,
          currency: selectedCampaign.currency,
          is_anonymous: false,
          payment_status: 'pending',
        });

      if (contribError) throw contribError;

      // Update campaign raised amount
      const { error: updateError } = await supabase
        .rpc('increment_gofund_raised', {
          campaign_id: selectedCampaign.id,
          amount: amount,
        });

      if (updateError) {
        // Fallback if RPC not available
        await supabase
          .from('wallet_gofund_campaigns')
          .update({ raised_amount: selectedCampaign.raised_amount + amount })
          .eq('id', selectedCampaign.id);
      }

      Alert.alert('Success', `Thank you for contributing KES ${amount.toLocaleString()}`);
      setShowContributeModal(false);
      setContributionAmount('');
      fetchCampaigns();
      fetchCampaignDetail(selectedCampaign.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Contribution failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openCampaignDetail = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    await fetchCampaignDetail(campaign.id);
    setShowDetailModal(true);
  };

  const getProgress = (raised: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min((raised / target) * 100, 100);
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : 'Ended';
  };

  const getCategoryIcon = (category: string) => {
    const map: Record<string, string> = {
      medical: 'medical-bag',
      education: 'school',
      business: 'briefcase',
      community: 'home-group',
      emergency: 'alert-circle',
      creative: 'palette',
      charity: 'heart',
      other: 'tag',
    };
    return map[category] || 'tag';
  };

  const filteredCampaigns = campaigns.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCampaignCard = (campaign: Campaign, showManage?: boolean) => (
    <TouchableOpacity
      key={campaign.id}
      style={styles.campaignCard}
      onPress={() => openCampaignDetail(campaign)}
    >
      <View style={styles.campaignImagePlaceholder}>
        <MaterialCommunityIcons
          name={getCategoryIcon(campaign.category) as any}
          size={32}
          color="#4F46E5"
        />
      </View>
      <View style={styles.campaignContent}>
        <View style={styles.campaignHeader}>
          <Text style={styles.campaignTitle} numberOfLines={1}>{campaign.title}</Text>
          <View style={[styles.categoryChip, { backgroundColor: '#EEF2FF' }]}>
            <Text style={[styles.categoryText, { color: '#4F46E5' }]}>
              {campaign.category}
            </Text>
          </View>
        </View>
        <Text style={styles.campaignDesc} numberOfLines={2}>{campaign.description}</Text>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${getProgress(campaign.raised_amount, campaign.target_amount)}%` },
              ]}
            />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.raisedText}>
              {campaign.currency} {campaign.raised_amount.toLocaleString()} raised
            </Text>
            <Text style={styles.targetText}>
              of {campaign.currency} {campaign.target_amount.toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.campaignFooter}>
          <Text style={styles.footerText}>
            {campaign.contribution_count || 0} contributors
          </Text>
          <Text style={[styles.footerText, { color: '#EF4444' }]}>
            {getDaysLeft(campaign.end_date)}
          </Text>
        </View>
        {showManage && (
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => {
              setSelectedCampaign(campaign);
              setShowDetailModal(true);
            }}
          >
            <Text style={styles.manageButtonText}>Manage Campaign</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

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
        <Text style={styles.headerTitle}>GoFund Hub</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.backButton}>
          <Ionicons name="add-circle" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search campaigns..."
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

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'discover' as TabType, label: 'Discover' },
          { key: 'myCampaigns' as TabType, label: 'My Campaigns' },
          { key: 'supported' as TabType, label: 'Supported' },
          { key: 'partners' as TabType, label: 'Partners' },
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
        {activeTab === 'discover' && (
          <>
            {filteredCampaigns.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="heart-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No campaigns match your search' : 'No active campaigns'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setShowCreateModal(true)}
                  >
                    <Text style={styles.createButtonText}>Start a Campaign</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredCampaigns.map(campaign => renderCampaignCard(campaign))
            )}
          </>
        )}

        {activeTab === 'myCampaigns' && (
          <>
            {myCampaigns.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>You haven't created any campaigns</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setShowCreateModal(true)}
                >
                  <Text style={styles.createButtonText}>Create Campaign</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myCampaigns.map(campaign => renderCampaignCard(campaign, true))
            )}
          </>
        )}

        {activeTab === 'supported' && (
          <>
            {supportedCampaigns.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="hand-left-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>You haven't supported any campaigns yet</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setActiveTab('discover')}
                >
                  <Text style={styles.createButtonText}>Browse Campaigns</Text>
                </TouchableOpacity>
              </View>
            ) : (
              supportedCampaigns.map(campaign => renderCampaignCard(campaign))
            )}
          </>
        )}

        {activeTab === 'partners' && (
          <View style={styles.partnersSection}>
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="handshake" size={32} color="#4F46E5" />
              <Text style={styles.infoTitle}>Partner with GoFund</Text>
              <Text style={styles.infoDesc}>
                Organizations can partner with us to promote verified campaigns, provide matching funds, or sponsor categories.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.partnerButton}
              onPress={() => router.push('/(os)/wallet/partner-ecosystem')}
            >
              <Text style={styles.partnerButtonText}>Apply as Partner</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Campaign Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>{selectedCampaign?.title}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedCampaign && (
              <>
                <View style={styles.detailImagePlaceholder}>
                  <MaterialCommunityIcons
                    name={getCategoryIcon(selectedCampaign.category) as any}
                    size={48}
                    color="#4F46E5"
                  />
                </View>

                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>{selectedCampaign.title}</Text>
                  <View style={styles.detailMeta}>
                    <Text style={styles.detailCreator}>by {selectedCampaign.creator_name}</Text>
                    <View style={[styles.categoryChip, { backgroundColor: '#EEF2FF' }]}>
                      <Text style={[styles.categoryText, { color: '#4F46E5' }]}>
                        {selectedCampaign.category}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.detailProgress}>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${getProgress(selectedCampaign.raised_amount, selectedCampaign.target_amount)}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.detailProgressMeta}>
                    <Text style={styles.detailRaised}>
                      {selectedCampaign.currency} {selectedCampaign.raised_amount.toLocaleString()} raised
                    </Text>
                    <Text style={styles.detailTarget}>
                      Goal: {selectedCampaign.currency} {selectedCampaign.target_amount.toLocaleString()}
                    </Text>
                  </View>
                  <Text style={styles.detailContributors}>
                    {selectedCampaign.contribution_count || contributions.length} contributors · {getDaysLeft(selectedCampaign.end_date)}
                  </Text>
                </View>

                <Text style={styles.detailDescription}>{selectedCampaign.description}</Text>

                {selectedCampaign.status === 'active' && selectedCampaign.creator_id !== user?.id && (
                  <TouchableOpacity
                    style={styles.contributeButton}
                    onPress={() => setShowContributeModal(true)}
                  >
                    <Ionicons name="heart" size={18} color="#FFFFFF" />
                    <Text style={styles.contributeButtonText}>Contribute Now</Text>
                  </TouchableOpacity>
                )}

                {/* Updates */}
                {updates.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionBlockTitle}>Updates</Text>
                    {updates.map((update) => (
                      <View key={update.id} style={styles.updateCard}>
                        <Text style={styles.updateTitle}>{update.title}</Text>
                        <Text style={styles.updateContent}>{update.content}</Text>
                        <Text style={styles.updateDate}>
                          {new Date(update.created_at).toLocaleDateString('en-KE')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Contributions */}
                {contributions.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionBlockTitle}>Recent Contributions</Text>
                    {contributions.map((contrib) => (
                      <View key={contrib.id} style={styles.contributionRow}>
                        <View style={styles.contributionAvatar}>
                          <Text style={styles.contributionAvatarText}>
                            {(contrib.is_anonymous ? 'A' : contrib.contributor_name?.[0] || '?').toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.contributionInfo}>
                          <Text style={styles.contributionName}>
                            {contrib.is_anonymous ? 'Anonymous' : contrib.contributor_name}
                          </Text>
                          <Text style={styles.contributionDate}>
                            {new Date(contrib.created_at).toLocaleDateString('en-KE')}
                          </Text>
                        </View>
                        <Text style={styles.contributionAmount}>
                          {contrib.currency} {contrib.amount.toLocaleString()}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.bottomPadding} />
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Create Campaign Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Campaign</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Campaign Title *</Text>
            <TextInput
              style={styles.input}
              value={createForm.title}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, title: text }))}
              placeholder="e.g. Help with Medical Bills"
            />

            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={createForm.description}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, description: text }))}
              placeholder="Tell your story and why people should support you..."
              multiline
              numberOfLines={4}
            />

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryOption, createForm.category === cat && styles.categoryOptionActive]}
                  onPress={() => setCreateForm(prev => ({ ...prev, category: cat }))}
                >
                  <MaterialCommunityIcons
                    name={getCategoryIcon(cat) as any}
                    size={16}
                    color={createForm.category === cat ? '#4F46E5' : '#9CA3AF'}
                  />
                  <Text style={[styles.categoryOptionText, createForm.category === cat && styles.categoryOptionTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Target Amount (KES) *</Text>
            <TextInput
              style={styles.input}
              value={createForm.target_amount}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, target_amount: text }))}
              placeholder="50000"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>End Date *</Text>
            <TextInput
              style={styles.input}
              value={createForm.end_date}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, end_date: text }))}
              placeholder="YYYY-MM-DD"
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleCreateCampaign}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Campaign</Text>
              )}
            </TouchableOpacity>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </Modal>

      {/* Contribute Modal */}
      <Modal
        visible={showContributeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowContributeModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.contributeModal}>
            <Text style={styles.contributeModalTitle}>Contribute to Campaign</Text>
            <Text style={styles.contributeModalSubtitle}>{selectedCampaign?.title}</Text>

            <Text style={styles.inputLabel}>Amount (KES)</Text>
            <TextInput
              style={[styles.input, styles.amountInput]}
              value={contributionAmount}
              onChangeText={setContributionAmount}
              placeholder="Enter amount"
              keyboardType="numeric"
              autoFocus
            />

            <View style={styles.quickAmounts}>
              {[100, 500, 1000, 5000].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={styles.quickAmountChip}
                  onPress={() => setContributionAmount(amt.toString())}
                >
                  <Text style={styles.quickAmountText}>KES {amt.toLocaleString()}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowContributeModal(false);
                  setContributionAmount('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, submitting && styles.submitButtonDisabled]}
                onPress={handleContribute}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmButtonText}>Contribute</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#4F46E5',
  },
  tabText: {
    fontSize: 11,
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
  campaignCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  campaignImagePlaceholder: {
    height: 120,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  campaignContent: {
    padding: 14,
  },
  campaignHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  campaignTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  categoryChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  campaignDesc: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
    marginBottom: 10,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 3,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  raisedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111827',
  },
  targetText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  campaignFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: '#6B7280',
  },
  manageButton: {
    marginTop: 10,
    backgroundColor: '#EEF2FF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  createButton: {
    marginTop: 20,
    backgroundColor: '#4F46E5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  partnersSection: {
    paddingTop: 8,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
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
  partnerButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  partnerButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  detailImagePlaceholder: {
    height: 180,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailHeader: {
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 10,
  },
  detailCreator: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailProgress: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  detailProgressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  detailRaised: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  detailTarget: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  detailContributors: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
  },
  detailDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  contributeButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  contributeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  sectionBlock: {
    marginBottom: 20,
  },
  sectionBlockTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  updateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  updateContent: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
    lineHeight: 18,
  },
  updateDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 6,
  },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  contributionAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  contributionAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  contributionInfo: {
    flex: 1,
  },
  contributionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  contributionDate: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  contributionAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  categoryOptionActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  categoryOptionText: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryOptionTextActive: {
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contributeModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 360,
  },
  contributeModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  contributeModalSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  amountInput: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    justifyContent: 'center',
  },
  quickAmountChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickAmountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
});
