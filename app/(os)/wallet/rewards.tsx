import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  Alert, ActivityIndicator, Modal, TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { useWalletStore } from '@/lib/stores/wallet-store';
import { supabase } from '@/lib/supabase';
import { BlurView } from 'expo-blur';

interface RewardTier {
  id: string;
  name: string;
  min_points: number;
  cashback_rate: number;
  color: string;
  icon: string;
  benefits: string[];
}

interface RewardTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'bonus' | 'expired';
  points: number;
  description: string;
  created_at: string;
}

interface RedeemOption {
  id: string;
  name: string;
  points_cost: number;
  type: 'cashback' | 'voucher' | 'airtime' | 'discount';
  value: number;
  icon: string;
}

const TIERS: RewardTier[] = [
  { id: 'bronze', name: 'Bronze', min_points: 0, cashback_rate: 0.5, color: '#CD7F32', icon: 'medal', benefits: ['0.5% cashback', 'Birthday bonus', 'Monthly newsletter'] },
  { id: 'silver', name: 'Silver', min_points: 500, cashback_rate: 1.0, color: '#C0C0C0', icon: 'medal', benefits: ['1% cashback', 'Priority support', 'Exclusive deals', 'Quarterly bonus'] },
  { id: 'gold', name: 'Gold', min_points: 2000, cashback_rate: 2.0, color: '#FFD700', icon: 'crown', benefits: ['2% cashback', 'VIP support', 'Free transfers', 'Early access', 'Annual bonus'] },
  { id: 'platinum', name: 'Platinum', min_points: 5000, cashback_rate: 3.5, color: '#E5E4E2', icon: 'gem', benefits: ['3.5% cashback', 'Dedicated agent', 'Zero fees', 'Concierge', 'Lifetime benefits'] },
];

const REDEEM_OPTIONS: RedeemOption[] = [
  { id: 'cashback-100', name: 'KES 100 Cashback', points_cost: 100, type: 'cashback', value: 100, icon: 'cash' },
  { id: 'cashback-500', name: 'KES 500 Cashback', points_cost: 450, type: 'cashback', value: 500, icon: 'cash' },
  { id: 'airtime-100', name: 'KES 100 Airtime', points_cost: 90, type: 'airtime', value: 100, icon: 'phone-portrait' },
  { id: 'airtime-500', name: 'KES 500 Airtime', points_cost: 420, type: 'airtime', value: 500, icon: 'phone-portrait' },
  { id: 'discount-10', name: '10% Shop Discount', points_cost: 200, type: 'discount', value: 10, icon: 'pricetag' },
  { id: 'voucher-1000', name: 'KES 1,000 Voucher', points_cost: 850, type: 'voucher', value: 1000, icon: 'gift' },
];

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const [points, setPoints] = useState(0);
  const [tier, setTier] = useState<RewardTier>(TIERS[0]);
  const [nextTier, setNextTier] = useState<RewardTier | null>(TIERS[1]);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [redeemModalVisible, setRedeemModalVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<RedeemOption | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchRewards = useCallback(async () => {
    if (!user) return;
    const { data: profile, error: pErr } = await supabase.from('profiles').select('reward_points, reward_tier').eq('id', user.id).single();
    if (!pErr && profile) {
      setPoints(profile.reward_points || 0);
      const currentTier = TIERS.slice().reverse().find(t => (profile.reward_points || 0) >= t.min_points) || TIERS[0];
      setTier(currentTier);
      const next = TIERS.find(t => t.min_points > (profile.reward_points || 0));
      setNextTier(next || null);
    }
    const { data: txns, error: tErr } = await supabase.from('reward_transactions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
    if (!tErr && txns) setTransactions(txns);
  }, [user]);

  useEffect(() => { fetchRewards().then(() => setLoading(false)); }, [fetchRewards]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await fetchRewards(); setRefreshing(false);
  }, [fetchRewards]);

  const handleRedeem = async () => {
    if (!selectedOption || !user) return;
    if (points < selectedOption.points_cost) { Alert.alert('Error', 'Not enough points'); return; }
    setProcessing(true);
    const { error } = await supabase.rpc('redeem_reward', {
      p_user_id: user.id,
      p_option_id: selectedOption.id,
      p_points_cost: selectedOption.points_cost,
      p_value: selectedOption.value,
      p_type: selectedOption.type
    });
    setProcessing(false);
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', `Redeemed ${selectedOption.name}!`);
    setRedeemModalVisible(false); setSelectedOption(null); fetchRewards();
  };

  const tierProgress = nextTier ? Math.min(((points - tier.min_points) / (nextTier.min_points - tier.min_points)) * 100, 100) : 100;

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading rewards...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <TouchableOpacity style={styles.historyBtn} onPress={() => router.push('/(os)/wallet/rewards-history')}>
          <Ionicons name="time" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />} contentContainerStyle={styles.scrollContent}>
        {/* Points Card */}
        <View style={[styles.pointsCard, { borderColor: tier.color }]}>
          <View style={styles.pointsHeader}>
            <View style={[styles.tierBadge, { backgroundColor: tier.color + '25' }]}>
              <FontAwesome5 name={tier.icon as any} size={16} color={tier.color} />
              <Text style={[styles.tierName, { color: tier.color }]}>{tier.name}</Text>
            </View>
            <Text style={styles.cashbackRate}>{tier.cashback_rate}% cashback</Text>
          </View>
          <Text style={styles.pointsValue}>{points.toLocaleString()}</Text>
          <Text style={styles.pointsLabel}>Reward Points</Text>
          {nextTier && (
            <>
              <View style={styles.tierProgressBar}>
                <View style={[styles.tierProgressFill, { width: `${tierProgress}%`, backgroundColor: tier.color }]} />
              </View>
              <Text style={styles.nextTierText}>{nextTier.min_points - points} more points to {nextTier.name}</Text>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => setRedeemModalVisible(true)}>
            <View style={[styles.quickIcon, { backgroundColor: '#34C75920' }]}><Ionicons name="gift" size={22} color="#34C759" /></View>
            <Text style={styles.quickLabel}>Redeem</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/(os)/wallet/referral')}>
            <View style={[styles.quickIcon, { backgroundColor: '#007AFF20' }]}><Ionicons name="people" size={22} color="#007AFF" /></View>
            <Text style={styles.quickLabel}>Refer</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickBtn} onPress={() => Alert.alert('Spin', 'Daily spin coming soon!')}>
            <View style={[styles.quickIcon, { backgroundColor: '#FF950020' }]}><Ionicons name="dice" size={22} color="#FF9500" /></View>
            <Text style={styles.quickLabel}>Daily Spin</Text>
          </TouchableOpacity>
        </View>

        {/* Tier Benefits */}
        <Text style={styles.sectionTitle}>Your {tier.name} Benefits</Text>
        <View style={styles.benefitsCard}>
          {tier.benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Ionicons name="checkmark-circle" size={18} color={tier.color} />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* All Tiers */}
        <Text style={styles.sectionTitle}>Tier Progression</Text>
        {TIERS.map((t, i) => (
          <View key={t.id} style={[styles.tierRow, t.id === tier.id && styles.tierRowActive]}>
            <View style={[styles.tierDot, { backgroundColor: t.color }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.tierRowName}>{t.name}</Text>
              <Text style={styles.tierRowDesc}>{t.min_points.toLocaleString()}+ points • {t.cashback_rate}% cashback</Text>
            </View>
            {t.id === tier.id && <Ionicons name="checkmark-circle" size={20} color={t.color} />}
            {nextTier?.id === t.id && <Text style={styles.nextBadge}>NEXT</Text>}
          </View>
        ))}

        {/* Recent Transactions */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {transactions.slice(0, 5).map(tx => (
          <View key={tx.id} style={styles.txRow}>
            <View style={[styles.txIcon, { backgroundColor: tx.type === 'earned' ? '#34C75920' : tx.type === 'redeemed' ? '#FF950020' : tx.type === 'bonus' ? '#007AFF20' : '#FF3B3020' }]}>
              <Ionicons name={tx.type === 'earned' ? 'add-circle' : tx.type === 'redeemed' ? 'gift' : tx.type === 'bonus' ? 'star' : 'alert-circle'} size={18}
                color={tx.type === 'earned' ? '#34C759' : tx.type === 'redeemed' ? '#FF9500' : tx.type === 'bonus' ? '#007AFF' : '#FF3B30'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.txDesc}>{tx.description}</Text>
              <Text style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</Text>
            </View>
            <Text style={[styles.txPoints, { color: tx.type === 'earned' || tx.type === 'bonus' ? '#34C759' : '#FF3B30' }]}>
              {tx.type === 'earned' || tx.type === 'bonus' ? '+' : '-'}{tx.points}
            </Text>
          </View>
        ))}
        {transactions.length === 0 && <Text style={styles.emptyText}>No reward activity yet</Text>}
      </ScrollView>

      {/* Redeem Modal */}
      <Modal visible={redeemModalVisible} transparent animationType="slide">
        <BlurView intensity={60} style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Redeem Points</Text>
              <Text style={styles.modalSubtitle}>You have {points.toLocaleString()} points</Text>
              {!selectedOption ? (
                REDEEM_OPTIONS.map(opt => (
                  <TouchableOpacity key={opt.id} style={styles.redeemCard} onPress={() => setSelectedOption(opt)}>
                    <View style={[styles.redeemIcon, { backgroundColor: opt.type === 'cashback' ? '#34C75920' : opt.type === 'airtime' ? '#007AFF20' : opt.type === 'discount' ? '#FF950020' : '#5856D620' }]}>
                      <Ionicons name={opt.icon as any} size={22} color={opt.type === 'cashback' ? '#34C759' : opt.type === 'airtime' ? '#007AFF' : opt.type === 'discount' ? '#FF9500' : '#5856D6'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.redeemName}>{opt.name}</Text>
                      <Text style={styles.redeemCost}>{opt.points_cost} points</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                ))
              ) : (
                <>
                  <TouchableOpacity style={styles.typeSelected} onPress={() => setSelectedOption(null)}>
                    <Ionicons name="arrow-back" size={18} color="#8E8E93" />
                    <Text style={styles.typeSelectedText}>{selectedOption.name}</Text>
                  </TouchableOpacity>
                  <View style={styles.confirmBox}>
                    <Text style={styles.confirmLabel}>You will redeem:</Text>
                    <Text style={styles.confirmValue}>{selectedOption.name}</Text>
                    <Text style={styles.confirmCost}>Cost: {selectedOption.points_cost} points</Text>
                    <Text style={styles.confirmBalance}>Balance after: {points - selectedOption.points_cost} points</Text>
                  </View>
                  <View style={styles.modalActions}>
                    <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setRedeemModalVisible(false)}>
                      <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtnPrimary, points < selectedOption.points_cost && { backgroundColor: '#3A3A3C' }]} onPress={handleRedeem} disabled={processing || points < selectedOption.points_cost}>
                      {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalBtnPrimaryText}>Confirm</Text>}
                    </TouchableOpacity>
                  </View>
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
  historyBtn: { padding: 4 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  pointsCard: { backgroundColor: '#1C1C1E', borderRadius: 20, padding: 24, borderWidth: 2, marginBottom: 20 },
  pointsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  tierName: { fontSize: 13, fontWeight: '700' },
  cashbackRate: { fontSize: 13, color: '#8E8E93' },
  pointsValue: { fontSize: 42, fontWeight: '800', color: '#fff' },
  pointsLabel: { fontSize: 14, color: '#8E8E93', marginBottom: 16 },
  tierProgressBar: { height: 6, backgroundColor: '#2C2C2E', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  tierProgressFill: { height: '100%', borderRadius: 3 },
  nextTierText: { fontSize: 12, color: '#8E8E93', textAlign: 'center' },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  quickBtn: { flex: 1, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, alignItems: 'center' },
  quickIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 8 },
  benefitsCard: { backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, marginBottom: 20 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  benefitText: { fontSize: 14, color: '#fff', flex: 1 },
  tierRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, marginBottom: 8 },
  tierRowActive: { borderWidth: 1, borderColor: '#3A3A3C' },
  tierDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  tierRowName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  tierRowDesc: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  nextBadge: { fontSize: 10, fontWeight: '800', color: '#FF9500', backgroundColor: '#FF950020', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, marginBottom: 8 },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  txDesc: { fontSize: 14, fontWeight: '500', color: '#fff' },
  txDate: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  txPoints: { fontSize: 15, fontWeight: '700' },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingVertical: 20 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalScroll: { flexGrow: 1, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: '#8E8E93', marginBottom: 16 },
  redeemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2C2C2E', borderRadius: 12, padding: 16, marginBottom: 10 },
  redeemIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  redeemName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  redeemCost: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  typeSelected: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  typeSelectedText: { fontSize: 15, fontWeight: '600', color: '#fff', marginLeft: 8 },
  confirmBox: { backgroundColor: '#2C2C2E', borderRadius: 16, padding: 20, marginBottom: 20 },
  confirmLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  confirmValue: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 8 },
  confirmCost: { fontSize: 14, color: '#FF9500', marginBottom: 4 },
  confirmBalance: { fontSize: 14, color: '#8E8E93' },
  modalActions: { flexDirection: 'row', gap: 12 },
  modalBtnSecondary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#2C2C2E', alignItems: 'center' },
  modalBtnSecondaryText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  modalBtnPrimary: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#34C759', alignItems: 'center' },
  modalBtnPrimaryText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
