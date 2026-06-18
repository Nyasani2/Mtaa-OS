import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, Alert, ActivityIndicator, Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { useWalletStore } from '@/hooks/useWalletStore';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';

interface Group {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_amount: number;
  contribution_amount: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  member_count: number;
  max_members: number;
  creator_id: string;
  status: 'active' | 'completed' | 'cancelled';
  payout_order: number;
  created_at: string;
  is_creator: boolean;
}

interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  name: string;
  avatar_url: string | null;
  contribution_count: number;
  total_contributed: number;
  payout_position: number | null;
  has_received_payout: boolean;
  joined_at: string;
}

interface GroupContribution {
  id: string;
  member_id: string;
  amount: number;
  created_at: string;
  member_name: string;
}

export default function GroupSavingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [contributions, setContributions] = useState<GroupContribution[]>([]);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', target_amount: '', contribution_amount: '', frequency: 'weekly' as const, max_members: '10' });
  const [processing, setProcessing] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  const fetchGroups = useCallback(async () => {
    const { data, error } = await supabase.from('savings_groups').select('*').eq('status', 'active').order('created_at', { ascending: false });
    if (!error && data) setGroups(data);
  }, []);

  const fetchMyGroups = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.rpc('get_user_savings_groups', { p_user_id: user.id });
    if (!error && data) setMyGroups(data);
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchGroups(), fetchMyGroups()]);
    setLoading(false);
  }, [fetchGroups, fetchMyGroups]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadAll(); setRefreshing(false);
  }, [loadAll]);

  const handleCreateGroup = async () => {
    if (!user) return;
    const target = parseFloat(newGroup.target_amount);
    const contrib = parseFloat(newGroup.contribution_amount);
    const max = parseInt(newGroup.max_members);
    if (!newGroup.name.trim() || isNaN(target) || target <= 0 || isNaN(contrib) || contrib <= 0) {
      Alert.alert('Error', 'Fill all required fields'); return;
    }
    setProcessing(true);
    const { data, error } = await supabase.rpc('create_savings_group', {
      p_creator_id: user.id,
      p_name: newGroup.name.trim(),
      p_description: newGroup.description.trim() || null,
      p_target_amount: target,
      p_contribution_amount: contrib,
      p_frequency: newGroup.frequency,
      p_max_members: isNaN(max) ? 10 : max
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', 'Group created! Share the invite code with members.');
    setCreateModalVisible(false);
    setNewGroup({ name: '', description: '', target_amount: '', contribution_amount: '', frequency: 'weekly', max_members: '10' });
    loadAll();
  };

  const handleJoinGroup = async () => {
    if (!user || !inviteCode.trim()) { Alert.alert('Error', 'Enter invite code'); return; }
    setProcessing(true);
    const { error } = await supabase.rpc('join_savings_group', {
      p_user_id: user.id,
      p_invite_code: inviteCode.trim().toUpperCase()
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', 'You joined the group!');
    setInviteCode(''); loadAll();
  };

  const handleContribute = async () => {
    if (!selectedGroup || !user) return;
    if (balance < selectedGroup.contribution_amount) { Alert.alert('Error', 'Insufficient wallet balance'); return; }
    setProcessing(true);
    const { error } = await supabase.rpc('savings_group_contribute', {
      p_group_id: selectedGroup.id,
      p_user_id: user.id,
      p_amount: selectedGroup.contribution_amount
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', `Contributed KES ${selectedGroup.contribution_amount.toLocaleString()}`);
    fetchGroupDetails(selectedGroup.id);
    loadAll();
  };

  const fetchGroupDetails = async (groupId: string) => {
    const { data: mData } = await supabase.from('savings_group_members').select('*').eq('group_id', groupId).order('payout_position', { ascending: true });
    if (mData) setMembers(mData);
    const { data: cData } = await supabase.from('savings_group_contributions').select('*').eq('group_id', groupId).order('created_at', { ascending: false }).limit(20);
    if (cData) setContributions(cData);
  };

  const openGroupDetail = (group: Group) => {
    setSelectedGroup(group);
    fetchGroupDetails(group.id);
    setDetailModalVisible(true);
  };

  const renderGroupCard = (group: Group, isMine = false) => {
    const progress = Math.min((group.current_amount / group.target_amount) * 100, 100);
    const slotsLeft = group.max_members - group.member_count;
    return (
      <TouchableOpacity key={group.id} style={styles.groupCard} onPress={() => openGroupDetail(group)} activeOpacity={0.85}>
        <View style={styles.groupHeader}>
          <View style={styles.groupIcon}><FontAwesome5 name="users" size={20} color="#007AFF" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupMeta}>{group.frequency} • KES {group.contribution_amount.toLocaleString()}/member</Text>
          </View>
          {isMine && <View style={styles.myBadge}><Text style={styles.myBadgeText}>MEMBER</Text></View>}
        </View>
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{progress.toFixed(0)}%</Text>
            <Text style={styles.raisedText}>KES {group.current_amount.toLocaleString()} of {group.target_amount.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.groupFooter}>
          <View style={styles.footerItem}><Ionicons name="people" size={14} color="#8E8E93" /><Text style={styles.footerText}>{group.member_count}/{group.max_members} members</Text></View>
          <View style={styles.footerItem}><Ionicons name="person-add" size={14} color="#8E8E93" /><Text style={styles.footerText}>{slotsLeft} slots left</Text></View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading group savings...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Group Savings</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModalVisible(true)}><Ionicons name="add-circle" size={28} color="#34C759" /></TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}><Text style={styles.statValue}>{groups.length}</Text><Text style={styles.statLabel}>Active</Text></View>
        <View style={styles.statBox}><Text style={styles.statValue}>{myGroups.length}</Text><Text style={styles.statLabel}>My Groups</Text></View>
        <View style={styles.statBox}><Text style={styles.statValue}>KES {myGroups.reduce((s, g) => s + g.current_amount, 0).toLocaleString()}</Text><Text style={styles.statLabel}>Saved</Text></View>
      </View>

      <View style={styles.joinRow}>
        <TextInput style={styles.joinInput} placeholder="Enter invite code" placeholderTextColor="#8E8E93" autoCapitalize="characters" value={inviteCode} onChangeText={setInviteCode} />
        <TouchableOpacity style={styles.joinBtn} onPress={handleJoinGroup} disabled={processing}>
          {processing ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.joinBtnText}>Join</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {(['discover', 'my-groups'] as const).map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab === 'discover' ? 'Discover' : 'My Groups'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        {activeTab === 'discover' && groups.map(g => renderGroupCard(g))}
        {activeTab === 'my-groups' && myGroups.map(g => renderGroupCard(g, true))}
        {activeTab === 'discover' && groups.length === 0 && (
          <View style={styles.empty}><Ionicons name="people-outline" size={48} color="#C7C7CC" /><Text style={styles.emptyText}>No active groups</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setCreateModalVisible(true)}><Text style={styles.emptyBtnText}>Create One</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Create Group Savings</Text>
              <TextInput style={styles.input} placeholder="Group Name *" value={newGroup.name} onChangeText={t => setNewGroup(p => ({ ...p, name: t }))} />
              <TextInput style={[styles.input, styles.textArea]} placeholder="Description" multiline value={newGroup.description} onChangeText={t => setNewGroup(p => ({ ...p, description: t }))} />
              <TextInput style={styles.input} placeholder="Target Amount (KES) *" keyboardType="numeric" value={newGroup.target_amount} onChangeText={t => setNewGroup(p => ({ ...p, target_amount: t }))} />
              <TextInput style={styles.input} placeholder="Contribution per Member (KES) *" keyboardType="numeric" value={newGroup.contribution_amount} onChangeText={t => setNewGroup(p => ({ ...p, contribution_amount: t }))} />
              <Text style={styles.label}>Frequency</Text>
              <View style={styles.freqRow}>
                {(['daily', 'weekly', 'monthly'] as const).map(f => (
                  <TouchableOpacity key={f} style={[styles.freqChip, newGroup.frequency === f && styles.freqChipActive]} onPress={() => setNewGroup(p => ({ ...p, frequency: f }))}>
                    <Text style={[styles.freqText, newGroup.frequency === f && styles.freqTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.label}>Max Members</Text>
              <TextInput style={styles.input} placeholder="10" keyboardType="numeric" value={newGroup.max_members} onChangeText={t => setNewGroup(p => ({ ...p, max_members: t }))} />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setCreateModalVisible(false)}><Text style={styles.modalBtnSecondaryText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.modalBtnPrimary} onPress={handleCreateGroup} disabled={processing}>
                  {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Create Group</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </BlurView>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={detailModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              {selectedGroup && (
                <>
                  <Text style={styles.modalTitle}>{selectedGroup.name}</Text>
                  <Text style={styles.modalSubtitle}>{selectedGroup.description || 'No description'}</Text>

                  <View style={styles.detailStats}>
                    <View style={styles.detailStat}><Text style={styles.detailStatValue}>KES {selectedGroup.current_amount.toLocaleString()}</Text><Text style={styles.detailStatLabel}>Saved</Text></View>
                    <View style={styles.detailStat}><Text style={styles.detailStatValue}>KES {selectedGroup.target_amount.toLocaleString()}</Text><Text style={styles.detailStatLabel}>Target</Text></View>
                    <View style={styles.detailStat}><Text style={styles.detailStatValue}>{selectedGroup.member_count}</Text><Text style={styles.detailStatLabel}>Members</Text></View>
                  </View>

                  <Text style={styles.sectionTitle}>Members</Text>
                  {members.map(m => (
                    <View key={m.id} style={styles.memberRow}>
                      <View style={styles.memberAvatar}><Text style={styles.memberInitial}>{m.name.charAt(0).toUpperCase()}</Text></View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{m.name} {m.user_id === user?.id ? '(You)' : ''}</Text>
                        <Text style={styles.memberMeta}>KES {m.total_contributed.toLocaleString()} contributed • {m.contribution_count} payments</Text>
                      </View>
                      {m.payout_position && <Text style={styles.payoutBadge}>#{m.payout_position}</Text>}
                      {m.has_received_payout && <Ionicons name="checkmark-circle" size={18} color="#34C759" />}
                    </View>
                  ))}

                  <Text style={styles.sectionTitle}>Recent Contributions</Text>
                  {contributions.map(c => (
                    <View key={c.id} style={styles.contribRow}>
                      <Text style={styles.contribName}>{c.member_name}</Text>
                      <Text style={styles.contribAmount}>KES {c.amount.toLocaleString()}</Text>
                      <Text style={styles.contribDate}>{new Date(c.created_at).toLocaleDateString()}</Text>
                    </View>
                  ))}
                  {contributions.length === 0 && <Text style={styles.emptyText}>No contributions yet</Text>}

                  {selectedGroup.status === 'active' && (
                    <TouchableOpacity style={styles.contributeBtn} onPress={handleContribute} disabled={processing}>
                      {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.contributeBtnText}>Contribute KES {selectedGroup.contribution_amount.toLocaleString()}</Text>}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailModalVisible(false)}>
                    <Text style={styles.closeBtnText}>Close</Text>
                  </TouchableOpacity>
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
  createBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1C1C1E', borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  joinRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1C1C1E', gap: 10, borderBottomWidth: 1, borderBottomColor: '#2C2C2E' },
  joinInput: { flex: 1, backgroundColor: '#2C2C2E', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 15 },
  joinBtn: { backgroundColor: '#007AFF', borderRadius: 12, paddingHorizontal: 20, justifyContent: 'center' },
  joinBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  tabBar: { flexDirection: 'row', backgroundColor: '#1C1C1E', paddingHorizontal: 16, paddingBottom: 8 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#2C2C2E' },
  tabText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  groupCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 12 },
  groupHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  groupIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#007AFF15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  groupName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  groupMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  myBadge: { backgroundColor: '#34C75920', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  myBadgeText: { fontSize: 9, fontWeight: '800', color: '#34C759' },
  progressContainer: { marginBottom: 10 },
  progressBar: { height: 6, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#007AFF', borderRadius: 3 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressText: { fontSize: 12, fontWeight: '700', color: '#007AFF' },
  raisedText: { fontSize: 11, color: '#8E8E93' },
  groupFooter: { flexDirection: 'row', gap: 16 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 11, color: '#8E8E93' },
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
  freqRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  freqChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#2C2C2E', alignItems: 'center' },
  freqChipActive: { backgroundColor: '#007AFF' },
  freqText: { fontSize: 13, color: '#8E8E93', fontWeight: '600' },
  freqTextActive: { color: '#fff' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#34C759', alignItems: 'center' },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  detailStats: { flexDirection: 'row', marginBottom: 20 },
  detailStat: { flex: 1, alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 12, padding: 12, marginHorizontal: 4 },
  detailStatValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
  detailStatLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 16 },
  memberRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 12, padding: 12, marginBottom: 8 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  memberInitial: { fontSize: 14, fontWeight: '700', color: '#fff' },
  memberName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  memberMeta: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  payoutBadge: { fontSize: 12, fontWeight: '700', color: '#FF9500', marginRight: 8 },
  contribRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 10, padding: 10, marginBottom: 6 },
  contribName: { flex: 1, fontSize: 13, color: '#fff' },
  contribAmount: { fontSize: 13, fontWeight: '700', color: '#34C759', marginRight: 12 },
  contribDate: { fontSize: 11, color: '#8E8E93' },
  contributeBtn: { backgroundColor: '#34C759', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  contributeBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeBtn: { backgroundColor: '#2C2C2E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  closeBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
