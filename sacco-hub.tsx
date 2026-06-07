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

interface SACCO {
  id: string;
  name: string;
  registration_number: string;
  country: string;
  city: string;
  member_count: number;
  total_contributions: number;
  interest_rate: number;
  status: 'pending' | 'approved' | 'rejected';
  contact_email: string;
  contact_phone: string;
  description: string;
  created_at: string;
}

interface Membership {
  id: string;
  sacco_id: string;
  member_number: string;
  role: 'member' | 'admin';
  joined_at: string;
  total_contributed: number;
  sacco_name?: string;
}

interface Contribution {
  id: string;
  sacco_id: string;
  amount: number;
  contributor_name: string;
  created_at: string;
}

type TabType = 'directory' | 'myMemberships' | 'create';

export default function SACCOHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('directory');
  const [saccos, setSaccos] = useState<SACCO[]>([]);
  const [myMemberships, setMyMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSACCO, setSelectedSACCO] = useState<SACCO | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    registration_number: '',
    country: 'Kenya',
    city: '',
    contact_email: '',
    contact_phone: '',
    description: '',
    interest_rate: '',
  });

  const fetchSACCOs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('wallet_sacco_directory')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSaccos(data || []);
    } catch (err) {
      console.error('Fetch SACCOs error:', err);
    }
  }, []);

  const fetchMemberships = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('wallet_sacco_memberships')
        .select(`
          id, sacco_id, member_number, role, joined_at, total_contributed,
          sacco:wallet_sacco_directory(name)
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map((m: any) => ({
        ...m,
        sacco_name: m.sacco?.name || 'Unknown SACCO',
      }));
      setMyMemberships(mapped);
    } catch (err) {
      console.error('Fetch memberships error:', err);
    }
  }, [user?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchSACCOs(), fetchMemberships()]);
    setLoading(false);
  }, [fetchSACCOs, fetchMemberships]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchSACCODetail = async (saccoId: string) => {
    try {
      const { data, error } = await supabase
        .from('wallet_sacco_contributions')
        .select('id, sacco_id, amount, contributor_name, created_at')
        .eq('sacco_id', saccoId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setContributions(data || []);
    } catch (err) {
      console.error('Fetch detail error:', err);
    }
  };

  const handleJoinSACCO = async (saccoId: string) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    try {
      // Check if already a member
      const { data: existing, error: checkError } = await supabase
        .from('wallet_sacco_memberships')
        .select('id')
        .eq('sacco_id', saccoId)
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existing) {
        Alert.alert('Already a Member', 'You are already a member of this SACCO');
        return;
      }

      // Generate member number
      const memberNumber = `SAC-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase
        .from('wallet_sacco_memberships')
        .insert({
          sacco_id: saccoId,
          user_id: user.id,
          member_number: memberNumber,
          role: 'member',
          total_contributed: 0,
        });

      if (error) throw error;

      // Update member count
      await supabase.rpc('increment_sacco_members', { sacco_id: saccoId });

      Alert.alert('Success', `You have joined the SACCO. Your member number: ${memberNumber}`);
      fetchMemberships();
      fetchSACCOs();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to join SACCO');
    }
  };

  const handleCreateSACCO = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }
    if (!createForm.name || !createForm.contact_email || !createForm.contact_phone) {
      Alert.alert('Missing Fields', 'Name, email, and phone are required');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('wallet_sacco_directory')
        .insert({
          name: createForm.name,
          registration_number: createForm.registration_number,
          country: createForm.country,
          city: createForm.city,
          contact_email: createForm.contact_email,
          contact_phone: createForm.contact_phone,
          description: createForm.description,
          interest_rate: parseFloat(createForm.interest_rate) || 0,
          status: 'pending',
          member_count: 1,
          total_contributions: 0,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      if (data) {
        await supabase.from('wallet_sacco_memberships').insert({
          sacco_id: data.id,
          user_id: user.id,
          member_number: `SAC-${Date.now().toString(36).toUpperCase()}`,
          role: 'admin',
          total_contributed: 0,
        });
      }

      Alert.alert('Success', 'SACCO created and pending verification. You will be notified once approved.');
      setShowCreateModal(false);
      setCreateForm({
        name: '', registration_number: '', country: 'Kenya', city: '',
        contact_email: '', contact_phone: '', description: '', interest_rate: '',
      });
      fetchSACCOs();
      fetchMemberships();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create SACCO');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async () => {
    if (!user?.id || !selectedSACCO) {
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
      const { error: contribError } = await supabase
        .from('wallet_sacco_contributions')
        .insert({
          sacco_id: selectedSACCO.id,
          contributor_id: user.id,
          contributor_name: user.full_name || 'Member',
          amount,
          currency: 'KES',
        });

      if (contribError) throw contribError;

      // Update SACCO totals
      await supabase
        .from('wallet_sacco_directory')
        .update({
          total_contributions: selectedSACCO.total_contributions + amount,
        })
        .eq('id', selectedSACCO.id);

      // Update member total
      await supabase
        .from('wallet_sacco_memberships')
        .update({ total_contributed: supabase.rpc('increment', { x: amount }) })
        .eq('sacco_id', selectedSACCO.id)
        .eq('user_id', user.id);

      Alert.alert('Success', `Contributed KES ${amount.toLocaleString()} to ${selectedSACCO.name}`);
      setShowContributeModal(false);
      setContributionAmount('');
      fetchSACCOs();
      fetchSACCODetail(selectedSACCO.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Contribution failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openSACCODetail = async (sacco: SACCO) => {
    setSelectedSACCO(sacco);
    await fetchSACCODetail(sacco.id);
    setShowDetailModal(true);
  };

  const filteredSACCOs = saccos.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase())
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
        <Text style={styles.headerTitle}>SACCO Hub</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.backButton}>
          <Ionicons name="add-circle" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search SACCOs..."
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
          { key: 'directory' as TabType, label: 'Directory' },
          { key: 'myMemberships' as TabType, label: 'My SACCOs' },
          { key: 'create' as TabType, label: 'Create' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => {
              if (tab.key === 'create') {
                setShowCreateModal(true);
              } else {
                setActiveTab(tab.key);
              }
            }}
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
            <View style={styles.infoCard}>
              <MaterialCommunityIcons name="account-group" size={28} color="#4F46E5" />
              <Text style={styles.infoTitle}>SACCO Directory</Text>
              <Text style={styles.infoDesc}>
                Browse verified Savings and Credit Cooperative Organizations. Join to start saving and access credit.
              </Text>
            </View>

            {filteredSACCOs.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-group-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'No SACCOs match your search' : 'No verified SACCOs yet'}
                </Text>
                {!searchQuery && (
                  <TouchableOpacity
                    style={styles.createButton}
                    onPress={() => setShowCreateModal(true)}
                  >
                    <Text style={styles.createButtonText}>Register Your SACCO</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredSACCOs.map((sacco) => (
                <TouchableOpacity
                  key={sacco.id}
                  style={styles.saccoCard}
                  onPress={() => openSACCODetail(sacco)}
                >
                  <View style={styles.saccoHeader}>
                    <View style={styles.saccoIcon}>
                      <MaterialCommunityIcons name="account-group" size={24} color="#4F46E5" />
                    </View>
                    <View style={styles.saccoInfo}>
                      <Text style={styles.saccoName} numberOfLines={1}>{sacco.name}</Text>
                      <Text style={styles.saccoLocation}>{sacco.city}, {sacco.country}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: '#D1FAE5' }]}>
                      <Text style={[styles.statusText, { color: '#059669' }]}>Verified</Text>
                    </View>
                  </View>

                  <View style={styles.saccoStats}>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{sacco.member_count}</Text>
                      <Text style={styles.statLabel}>Members</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>
                        KES {sacco.total_contributions.toLocaleString()}
                      </Text>
                      <Text style={styles.statLabel}>Saved</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statValue}>{sacco.interest_rate}%</Text>
                      <Text style={styles.statLabel}>Interest</Text>
                    </View>
                  </View>

                  <View style={styles.saccoActions}>
                    <TouchableOpacity
                      style={styles.joinButton}
                      onPress={() => handleJoinSACCO(sacco.id)}
                    >
                      <Text style={styles.joinButtonText}>Join SACCO</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        {activeTab === 'myMemberships' && (
          <>
            {myMemberships.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-off-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>You haven't joined any SACCOs</Text>
                <Text style={styles.emptyDesc}>Browse the directory and join a SACCO to start saving</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => setActiveTab('directory')}
                >
                  <Text style={styles.createButtonText}>Browse SACCOs</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myMemberships.map((membership) => (
                <TouchableOpacity
                  key={membership.id}
                  style={styles.membershipCard}
                  onPress={() => {
                    const sacco = saccos.find(s => s.id === membership.sacco_id);
                    if (sacco) openSACCODetail(sacco);
                  }}
                >
                  <View style={styles.membershipHeader}>
                    <View style={styles.saccoIcon}>
                      <MaterialCommunityIcons name="account-group" size={22} color="#4F46E5" />
                    </View>
                    <View style={styles.membershipInfo}>
                      <Text style={styles.membershipName}>{membership.sacco_name}</Text>
                      <Text style={styles.membershipNumber}>Member #{membership.member_number}</Text>
                    </View>
                    <View style={[styles.roleBadge, { backgroundColor: membership.role === 'admin' ? '#EEF2FF' : '#F3F4F6' }]}>
                      <Text style={[styles.roleText, { color: membership.role === 'admin' ? '#4F46E5' : '#6B7280' }]}>
                        {membership.role}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.membershipStats}>
                    <View>
                      <Text style={styles.membershipStatLabel}>Total Contributed</Text>
                      <Text style={styles.membershipStatValue}>
                        KES {membership.total_contributed.toLocaleString()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.membershipStatLabel}>Joined</Text>
                      <Text style={styles.membershipStatValue}>
                        {new Date(membership.joined_at).toLocaleDateString('en-KE')}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* SACCO Detail Modal */}
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
            <Text style={styles.modalTitle} numberOfLines={1}>{selectedSACCO?.name}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedSACCO && (
              <>
                <View style={styles.detailHeader}>
                  <View style={styles.detailIcon}>
                    <MaterialCommunityIcons name="account-group" size={40} color="#4F46E5" />
                  </View>
                  <Text style={styles.detailName}>{selectedSACCO.name}</Text>
                  <Text style={styles.detailReg}>Reg: {selectedSACCO.registration_number || 'N/A'}</Text>
                </View>

                <View style={styles.detailStatsCard}>
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatValue}>{selectedSACCO.member_count}</Text>
                    <Text style={styles.detailStatLabel}>Members</Text>
                  </View>
                  <View style={styles.detailStatDivider} />
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatValue}>
                      KES {selectedSACCO.total_contributions.toLocaleString()}
                    </Text>
                    <Text style={styles.detailStatLabel}>Total Saved</Text>
                  </View>
                  <View style={styles.detailStatDivider} />
                  <View style={styles.detailStat}>
                    <Text style={styles.detailStatValue}>{selectedSACCO.interest_rate}%</Text>
                    <Text style={styles.detailStatLabel}>Interest Rate</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>About</Text>
                  <Text style={styles.detailDescription}>{selectedSACCO.description || 'No description available.'}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Contact</Text>
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={16} color="#6B7280" />
                    <Text style={styles.contactText}>{selectedSACCO.contact_email}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={16} color="#6B7280" />
                    <Text style={styles.contactText}>{selectedSACCO.contact_phone}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="location-outline" size={16} color="#6B7280" />
                    <Text style={styles.contactText}>{selectedSACCO.city}, {selectedSACCO.country}</Text>
                  </View>
                </View>

                {/* Check if user is member */}
                {myMemberships.some(m => m.sacco_id === selectedSACCO.id) ? (
                  <TouchableOpacity
                    style={styles.contributeButton}
                    onPress={() => setShowContributeModal(true)}
                  >
                    <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.contributeButtonText}>Make Contribution</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.joinButtonLarge}
                    onPress={() => handleJoinSACCO(selectedSACCO.id)}
                  >
                    <Text style={styles.joinButtonLargeText}>Join This SACCO</Text>
                  </TouchableOpacity>
                )}

                {/* Recent Contributions */}
                {contributions.length > 0 && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Recent Contributions</Text>
                    {contributions.map((contrib) => (
                      <View key={contrib.id} style={styles.contributionRow}>
                        <View style={styles.contributionAvatar}>
                          <Text style={styles.contributionAvatarText}>
                            {contrib.contributor_name[0]?.toUpperCase()}
                          </Text>
                        </View>
                        <View style={styles.contributionInfo}>
                          <Text style={styles.contributionName}>{contrib.contributor_name}</Text>
                          <Text style={styles.contributionDate}>
                            {new Date(contrib.created_at).toLocaleDateString('en-KE')}
                          </Text>
                        </View>
                        <Text style={styles.contributionAmount}>
                          +KES {contrib.amount.toLocaleString()}
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

      {/* Create SACCO Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Register New SACCO</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>SACCO Name *</Text>
            <TextInput
              style={styles.input}
              value={createForm.name}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, name: text }))}
              placeholder="e.g. Nairobi Teachers SACCO"
            />

            <Text style={styles.inputLabel}>Registration Number</Text>
            <TextInput
              style={styles.input}
              value={createForm.registration_number}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, registration_number: text }))}
              placeholder="Official registration number"
            />

            <Text style={styles.inputLabel}>Country</Text>
            <TextInput
              style={styles.input}
              value={createForm.country}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, country: text }))}
            />

            <Text style={styles.inputLabel}>City</Text>
            <TextInput
              style={styles.input}
              value={createForm.city}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, city: text }))}
              placeholder="e.g. Nairobi"
            />

            <Text style={styles.inputLabel}>Contact Email *</Text>
            <TextInput
              style={styles.input}
              value={createForm.contact_email}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, contact_email: text }))}
              placeholder="sacco@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Contact Phone *</Text>
            <TextInput
              style={styles.input}
              value={createForm.contact_phone}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, contact_phone: text }))}
              placeholder="+254 700 000 000"
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Interest Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={createForm.interest_rate}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, interest_rate: text }))}
              placeholder="e.g. 8.5"
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={createForm.description}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, description: text }))}
              placeholder="Describe your SACCO, its mission, and membership criteria..."
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleCreateSACCO}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Register SACCO</Text>
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
            <Text style={styles.contributeModalTitle}>Contribute to SACCO</Text>
            <Text style={styles.contributeModalSubtitle}>{selectedSACCO?.name}</Text>

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
              {[500, 1000, 5000, 10000].map((amt) => (
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
  saccoCard: {
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
  saccoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  saccoIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  saccoInfo: {
    flex: 1,
  },
  saccoName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  saccoLocation: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
  saccoStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  saccoActions: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  joinButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
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
  emptyDesc: {
    fontSize: 13,
    color: '#D1D5DB',
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 30,
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
  membershipCard: {
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
  membershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  membershipInfo: {
    flex: 1,
  },
  membershipName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  membershipNumber: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  membershipStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  membershipStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  membershipStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginTop: 2,
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
  detailHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  detailIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  detailReg: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  detailStatsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  detailStat: {
    flex: 1,
    alignItems: 'center',
  },
  detailStatDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  detailStatValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#111827',
  },
  detailStatLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  detailSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  detailSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
  },
  detailDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
  },
  contributeButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  contributeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  joinButtonLarge: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  joinButtonLargeText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  contributionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 6,
  },
  contributionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  contributionAvatarText: {
    fontSize: 12,
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
  },
  contributionAmount: {
    fontSize: 13,
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
    backgroundColor: '#4F46E5',
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
