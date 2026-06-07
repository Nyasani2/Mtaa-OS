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

interface SavingsGoal {
  id: string;
  name: string;
  description: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  goal_type: 'personal' | 'group';
  status: 'active' | 'completed' | 'cancelled';
  end_date: string;
  created_at: string;
  contribution_count: number;
  member_count?: number;
}

interface Contribution {
  id: string;
  goal_id: string;
  amount: number;
  contributor_name: string;
  created_at: string;
}

interface GroupMember {
  id: string;
  goal_id: string;
  user_id: string;
  member_name: string;
  role: 'admin' | 'member';
  joined_at: string;
}

type TabType = 'goals' | 'groups' | 'analytics';

export default function SavingsHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('goals');
  const [personalGoals, setPersonalGoals] = useState<SavingsGoal[]>([]);
  const [groupGoals, setGroupGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [showGoalDetail, setShowGoalDetail] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [contributionAmount, setContributionAmount] = useState('');
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    description: '',
    target_amount: '',
    goal_type: 'personal' as 'personal' | 'group',
    end_date: '',
  });

  const fetchGoals = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('wallet_savings_goals')
        .select(`
          id, name, description, target_amount, current_amount, currency,
          goal_type, status, end_date, created_at,
          contribution_count:wallet_savings_contributions(count),
          member_count:wallet_savings_members(count)
        `)
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const personal = (data || []).filter((g: any) => g.goal_type === 'personal');
      const groups = (data || []).filter((g: any) => g.goal_type === 'group');
      setPersonalGoals(personal);
      setGroupGoals(groups);
    } catch (err) {
      console.error('Fetch goals error:', err);
    }
  }, [user?.id]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchGoals();
    setLoading(false);
  }, [fetchGoals]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fetchGoalDetail = async (goalId: string) => {
    try {
      const [contribRes, membersRes] = await Promise.all([
        supabase
          .from('wallet_savings_contributions')
          .select('id, goal_id, amount, contributor_name, created_at')
          .eq('goal_id', goalId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('wallet_savings_members')
          .select('id, goal_id, user_id, member_name, role, joined_at')
          .eq('goal_id', goalId)
          .order('joined_at', { ascending: true }),
      ]);

      if (contribRes.error) throw contribRes.error;
      if (membersRes.error) throw membersRes.error;

      setContributions(contribRes.data || []);
      setMembers(membersRes.data || []);
    } catch (err) {
      console.error('Fetch detail error:', err);
    }
  };

  const handleCreateGoal = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }
    if (!createForm.name || !createForm.target_amount || !createForm.end_date) {
      Alert.alert('Missing Fields', 'Name, target amount, and end date are required');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('wallet_savings_goals')
        .insert({
          name: createForm.name,
          description: createForm.description,
          target_amount: parseFloat(createForm.target_amount),
          current_amount: 0,
          currency: 'KES',
          goal_type: createForm.goal_type,
          end_date: createForm.end_date,
          created_by: user.id,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // If group goal, add creator as admin member
      if (createForm.goal_type === 'group' && data) {
        await supabase.from('wallet_savings_members').insert({
          goal_id: data.id,
          user_id: user.id,
          member_name: user.full_name || 'Admin',
          role: 'admin',
        });
      }

      Alert.alert('Success', `${createForm.goal_type === 'group' ? 'Group' : 'Savings'} goal created!`);
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', target_amount: '', goal_type: 'personal', end_date: '' });
      fetchGoals();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleContribute = async () => {
    if (!user?.id || !selectedGoal) {
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
        .from('wallet_savings_contributions')
        .insert({
          goal_id: selectedGoal.id,
          contributor_id: user.id,
          contributor_name: user.full_name || 'Anonymous',
          amount,
          currency: selectedGoal.currency,
        });

      if (contribError) throw contribError;

      // Update goal amount
      await supabase
        .from('wallet_savings_goals')
        .update({ current_amount: selectedGoal.current_amount + amount })
        .eq('id', selectedGoal.id);

      // Check if goal reached
      const newAmount = selectedGoal.current_amount + amount;
      if (newAmount >= selectedGoal.target_amount) {
        await supabase
          .from('wallet_savings_goals')
          .update({ status: 'completed' })
          .eq('id', selectedGoal.id);
      }

      Alert.alert('Success', `Added KES ${amount.toLocaleString()} to your goal!`);
      setShowContributeModal(false);
      setContributionAmount('');
      fetchGoals();
      fetchGoalDetail(selectedGoal.id);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Contribution failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openGoalDetail = async (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    await fetchGoalDetail(goal.id);
    setShowGoalDetail(true);
  };

  const getProgress = (current: number, target: number) => {
    if (target <= 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? `${days} days left` : 'Ended';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10B981';
      case 'active': return '#4F46E5';
      case 'cancelled': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  const renderGoalCard = (goal: SavingsGoal) => {
    const progress = getProgress(goal.current_amount, goal.target_amount);
    const isCompleted = goal.status === 'completed';

    return (
      <TouchableOpacity
        key={goal.id}
        style={[styles.goalCard, isCompleted && styles.goalCardCompleted]}
        onPress={() => openGoalDetail(goal)}
      >
        <View style={styles.goalHeader}>
          <View style={[styles.goalIcon, { backgroundColor: isCompleted ? '#D1FAE5' : '#EEF2FF' }]}>
            <MaterialCommunityIcons
              name={goal.goal_type === 'group' ? 'account-group' : 'piggy-bank'}
              size={22}
              color={isCompleted ? '#059669' : '#4F46E5'}
            />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
            <Text style={styles.goalMeta}>
              {goal.goal_type === 'group' ? `${goal.member_count || 0} members · ` : ''}
              {goal.contribution_count || 0} contributions
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(goal.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(goal.status) }]}>
              {goal.status}
            </Text>
          </View>
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: isCompleted ? '#10B981' : '#4F46E5',
                },
              ]}
            />
          </View>
          <View style={styles.progressMeta}>
            <Text style={styles.progressAmount}>
              {goal.currency} {goal.current_amount.toLocaleString()}
            </Text>
            <Text style={styles.progressTarget}>
              of {goal.currency} {goal.target_amount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={styles.goalFooter}>
          <Text style={styles.footerText}>{getDaysLeft(goal.end_date)}</Text>
          <Text style={[styles.footerText, { color: '#4F46E5', fontWeight: '600' }]}>
            {progress.toFixed(0)}%
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const totalSaved = [...personalGoals, ...groupGoals].reduce((sum, g) => sum + g.current_amount, 0);
  const totalGoals = personalGoals.length + groupGoals.length;
  const completedGoals = [...personalGoals, ...groupGoals].filter(g => g.status === 'completed').length;

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
        <Text style={styles.headerTitle}>Savings Hub</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.backButton}>
          <Ionicons name="add-circle" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>KES {totalSaved.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Saved</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalGoals}</Text>
          <Text style={styles.summaryLabel}>Active Goals</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{completedGoals}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'goals' as TabType, label: 'Personal' },
          { key: 'groups' as TabType, label: 'Groups' },
          { key: 'analytics' as TabType, label: 'Analytics' },
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
        {activeTab === 'goals' && (
          <>
            {personalGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="piggy-bank-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No personal savings goals</Text>
                <Text style={styles.emptyDesc}>Create your first savings goal and start building wealth</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => {
                    setCreateForm(prev => ({ ...prev, goal_type: 'personal' }));
                    setShowCreateModal(true);
                  }}
                >
                  <Text style={styles.createButtonText}>Create Goal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              personalGoals.map(goal => renderGoalCard(goal))
            )}
          </>
        )}

        {activeTab === 'groups' && (
          <>
            {groupGoals.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="account-group-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No group savings yet</Text>
                <Text style={styles.emptyDesc}>Start a group savings plan with family, friends, or colleagues</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => {
                    setCreateForm(prev => ({ ...prev, goal_type: 'group' }));
                    setShowCreateModal(true);
                  }}
                >
                  <Text style={styles.createButtonText}>Start Group</Text>
                </TouchableOpacity>
              </View>
            ) : (
              groupGoals.map(goal => renderGoalCard(goal))
            )}
          </>
        )}

        {activeTab === 'analytics' && (
          <View style={styles.analyticsSection}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Savings Overview</Text>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>KES {totalSaved.toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Total Saved</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalGoals}</Text>
                  <Text style={styles.statLabel}>Total Goals</Text>
                </View>
              </View>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{completedGoals}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>
                    {totalGoals > 0 ? ((completedGoals / totalGoals) * 100).toFixed(0) : 0}%
                  </Text>
                  <Text style={styles.statLabel}>Success Rate</Text>
                </View>
              </View>
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Goal Breakdown</Text>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#4F46E5' }]} />
                  <Text style={styles.breakdownText}>Personal: {personalGoals.length}</Text>
                </View>
                <View style={styles.breakdownItem}>
                  <View style={[styles.breakdownDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.breakdownText}>Group: {groupGoals.length}</Text>
                </View>
              </View>
            </View>

            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Tips</Text>
              <View style={styles.tipItem}>
                <Ionicons name="bulb" size={18} color="#F59E0B" />
                <Text style={styles.tipText}>Set automatic weekly contributions to reach your goals faster</Text>
              </View>
              <View style={styles.tipItem}>
                <Ionicons name="bulb" size={18} color="#F59E0B" />
                <Text style={styles.tipText}>Group savings earn bonus interest rates</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Goal Detail Modal */}
      <Modal
        visible={showGoalDetail}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGoalDetail(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGoalDetail(false)}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>{selectedGoal?.name}</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedGoal && (
              <>
                <View style={styles.detailProgressCard}>
                  <View style={styles.detailProgressCircle}>
                    <Text style={styles.detailProgressPercent}>
                      {getProgress(selectedGoal.current_amount, selectedGoal.target_amount).toFixed(0)}%
                    </Text>
                    <Text style={styles.detailProgressLabel}>Complete</Text>
                  </View>
                  <View style={styles.detailAmounts}>
                    <View>
                      <Text style={styles.detailAmountLabel}>Saved</Text>
                      <Text style={styles.detailAmountValue}>
                        {selectedGoal.currency} {selectedGoal.current_amount.toLocaleString()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.detailAmountLabel}>Target</Text>
                      <Text style={styles.detailAmountValue}>
                        {selectedGoal.currency} {selectedGoal.target_amount.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.detailDescription}>{selectedGoal.description}</Text>

                {selectedGoal.status === 'active' && (
                  <TouchableOpacity
                    style={styles.contributeButton}
                    onPress={() => setShowContributeModal(true)}
                  >
                    <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.contributeButtonText}>Add Contribution</Text>
                  </TouchableOpacity>
                )}

                {/* Members (for group goals) */}
                {selectedGoal.goal_type === 'group' && members.length > 0 && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionBlockTitle}>Members</Text>
                    {members.map((member) => (
                      <View key={member.id} style={styles.memberRow}>
                        <View style={styles.memberAvatar}>
                          <Text style={styles.memberAvatarText}>{member.member_name[0]?.toUpperCase()}</Text>
                        </View>
                        <View style={styles.memberInfo}>
                          <Text style={styles.memberName}>{member.member_name}</Text>
                          <Text style={styles.memberRole}>{member.role}</Text>
                        </View>
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
                          +{contrib.amount.toLocaleString()}
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

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Savings Goal</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.inputLabel}>Goal Type</Text>
            <View style={styles.typeSelector}>
              {(['personal', 'group'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeOption, createForm.goal_type === type && styles.typeOptionActive]}
                  onPress={() => setCreateForm(prev => ({ ...prev, goal_type: type }))}
                >
                  <MaterialCommunityIcons
                    name={type === 'group' ? 'account-group' : 'account'}
                    size={18}
                    color={createForm.goal_type === type ? '#4F46E5' : '#9CA3AF'}
                  />
                  <Text style={[styles.typeOptionText, createForm.goal_type === type && styles.typeOptionTextActive]}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Goal Name *</Text>
            <TextInput
              style={styles.input}
              value={createForm.name}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, name: text }))}
              placeholder="e.g. New Laptop Fund"
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={createForm.description}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, description: text }))}
              placeholder="What are you saving for?"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.inputLabel}>Target Amount (KES) *</Text>
            <TextInput
              style={styles.input}
              value={createForm.target_amount}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, target_amount: text }))}
              placeholder="10000"
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Target Date *</Text>
            <TextInput
              style={styles.input}
              value={createForm.end_date}
              onChangeText={(text) => setCreateForm(prev => ({ ...prev, end_date: text }))}
              placeholder="YYYY-MM-DD"
            />

            <TouchableOpacity
              style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
              onPress={handleCreateGoal}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Create Goal</Text>
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
            <Text style={styles.contributeModalTitle}>Add Contribution</Text>
            <Text style={styles.contributeModalSubtitle}>{selectedGoal?.name}</Text>

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
  summaryCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 16,
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
  goalCard: {
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
  goalCardCompleted: {
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  goalMeta: {
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
    textTransform: 'capitalize',
  },
  progressSection: {
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  progressTarget: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6B7280',
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
  analyticsSection: {
    paddingTop: 8,
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  analyticsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 14,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  breakdownRow: {
    flexDirection: 'row',
    gap: 20,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breakdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  breakdownText: {
    fontSize: 13,
    color: '#374151',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  tipText: {
    fontSize: 13,
    color: '#6B7280',
    flex: 1,
    lineHeight: 18,
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
  detailProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  detailProgressCircle: {
    alignItems: 'center',
    marginBottom: 16,
  },
  detailProgressPercent: {
    fontSize: 36,
    fontWeight: '800',
    color: '#4F46E5',
  },
  detailProgressLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  detailAmountLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  detailAmountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginTop: 2,
  },
  detailDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 16,
  },
  contributeButton: {
    backgroundColor: '#4F46E5',
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
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4F46E5',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  memberRole: {
    fontSize: 11,
    color: '#9CA3AF',
    textTransform: 'capitalize',
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
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  contributionAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
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
    height: 80,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  typeOptionActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  typeOptionTextActive: {
    color: '#4F46E5',
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
