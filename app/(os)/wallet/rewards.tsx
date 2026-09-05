// @ts-nocheck
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Alert, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Dimensions, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { useWalletStore } from 'app/(os)/wallet/hooks';
import { getWalletTransactions } from '@/lib/services/wallet-service';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const WHEEL_SIZE = width * 0.7;

const REWARD_SEGMENTS = [
  { label: '5 Pts', value: 5, color: '#6366f1', probability: 0.25 },
  { label: '10 Pts', value: 10, color: '#8b5cf6', probability: 0.20 },
  { label: '25 Pts', value: 25, color: '#a855f7', probability: 0.15 },
  { label: '50 Pts', value: 50, color: '#d946ef', probability: 0.12 },
  { label: '100 Pts', value: 100, color: '#ec4899', probability: 0.10 },
  { label: '250 Pts', value: 250, color: '#f43f5e', probability: 0.08 },
  { label: '500 Pts', value: 500, color: '#f97316', probability: 0.06 },
  { label: 'Jackpot!', value: 1000, color: '#fbbf24', probability: 0.04 },
];

const REWARD_TASKS = [
  { id: 'daily_login', label: 'Daily Login', points: 10, icon: 'log-in-outline', completed: true },
  { id: 'send_money', label: 'Send Money', points: 25, icon: 'send-outline', completed: false },
  { id: 'refer_friend', label: 'Refer a Friend', points: 100, icon: 'people-outline', completed: false },
  { id: 'add_card', label: 'Add Payment Card', points: 50, icon: 'card-outline', completed: false },
  { id: 'first_deposit', label: 'First Deposit', points: 75, icon: 'cash-outline', completed: false },
  { id: 'complete_profile', label: 'Complete Profile', points: 30, icon: 'person-outline', completed: false },
];

export default function RewardsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { accounts, activeAccountId, addTransaction, syncBalance } = useWalletStore();

  const activeAccount = accounts.find(a => a.id === activeAccountId) || accounts[0];

  const [spinning, setSpinning] = useState(false);
  const [lastSpin, setLastSpin] = useState<Date | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [totalPoints, setTotalPoints] = useState(0);
  const [rewardHistory, setRewardHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState(REWARD_TASKS);
  const [currentReward, setCurrentReward] = useState<any>(null);

  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!user?.id) return;
    loadRewardsData();
  }, [user?.id]);

  useEffect(() => {
    if (!lastSpin) return;
    const interval = setInterval(() => {
      const now = new Date();
      const nextSpin = new Date(lastSpin.getTime() + 24 * 60 * 60 * 1000);
      const diff = nextSpin.getTime() - now.getTime();
      if (diff <= 0) {
        setCanSpin(true);
        setTimeRemaining('');
        clearInterval(interval);
      } else {
        setCanSpin(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining(`${hours}h ${mins}m ${secs}s`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSpin]);

  const loadRewardsData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('reward_points, last_spin_at')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setTotalPoints(profile.reward_points || 0);
        if (profile.last_spin_at) {
          setLastSpin(new Date(profile.last_spin_at));
          const nextSpin = new Date(new Date(profile.last_spin_at).getTime() + 24 * 60 * 60 * 1000);
          setCanSpin(new Date() >= nextSpin);
        }
      }

      const txs = await getWalletTransactions(user?.id);
      const rewards = txs.filter((tx: any) => tx.type === 'reward' || tx.reference_type === 'daily_spin');
      setRewardHistory(rewards);

      // Check task completion
      const transferTxs = txs.filter((tx: any) => tx.type === 'debit' || tx.type === 'transfer');
      const depositTxs = txs.filter((tx: any) => tx.type === 'credit' || tx.type === 'deposit');
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('avatar_url, bio, phone')
        .eq('id', user?.id)
        .single();

      setTasks(prev => prev.map(t => {
        if (t.id === 'send_money') return { ...t, completed: transferTxs.length > 0 };
        if (t.id === 'first_deposit') return { ...t, completed: depositTxs.length > 0 };
        if (t.id === 'complete_profile') return { ...t, completed: !!(userProfile?.avatar_url && userProfile?.bio && userProfile?.phone) };
        return t;
      }));
    } catch (err) {
      console.error('Rewards load error:', err);
    }
    setLoading(false);
  }, [user?.id]);

  const handleDailySpin = useCallback(() => {
    if (spinning || !canSpin) return;
    setSpinning(true);
    setCurrentReward(null);

    const rand = Math.random();
    let cumulative = 0;
    let selectedIndex = 0;
    for (let i = 0; i < REWARD_SEGMENTS.length; i++) {
      cumulative += REWARD_SEGMENTS[i].probability;
      if (rand <= cumulative) { selectedIndex = i; break; }
    }

    const selectedReward = REWARD_SEGMENTS[selectedIndex];
    const segmentAngle = 360 / REWARD_SEGMENTS.length;
    const targetAngle = 360 * 5 + (selectedIndex * segmentAngle) + (segmentAngle / 2);

    Animated.timing(spinAnim, {
      toValue: targetAngle,
      duration: 4000,
      useNativeDriver: true,
    }).start(async () => {
      setSpinning(false);
      setCurrentReward(selectedReward);
      setLastSpin(new Date());
      setCanSpin(false);

      try {
        await supabase.from('user_profiles').update({
          reward_points: (totalPoints + selectedReward.value),
          last_spin_at: new Date().toISOString(),
        }).eq('id', user?.id);

        addTransaction({
          id: Date.now().toString(),
          type: 'reward',
          amount: selectedReward.value,
          currency: 'POINTS',
          description: `Daily Spin: ${selectedReward.label}`,
          status: 'completed',
          timestamp: new Date().toISOString(),
          balanceAfter: activeAccount?.balance || 0,
        });

        setTotalPoints(prev => prev + selectedReward.value);
      } catch (err) {
        console.error('Spin save error:', err);
      }
    });
  }, [spinning, canSpin, user, totalPoints, activeAccount, addTransaction, spinAnim]);

  const handleClaimTask = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return;

    try {
      await supabase.from('user_profiles').update({
        reward_points: totalPoints + task.points,
      }).eq('id', user?.id);

      addTransaction({
        id: Date.now().toString(),
        type: 'reward',
        amount: task.points,
        currency: 'POINTS',
        description: `Task: ${task.label}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        balanceAfter: activeAccount?.balance || 0,
      });

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));
      setTotalPoints(prev => prev + task.points);
      Alert.alert('Reward Claimed!', `You earned ${task.points} points for "${task.label}"`);
    } catch (err) {
      Alert.alert('Error', 'Could not claim reward');
    }
  }, [tasks, user, totalPoints, activeAccount, addTransaction]);

  const spinRotate = spinAnim.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Rewards</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Points Card */}
        <View style={styles.pointsCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={styles.pointsLabel}>Total Points</Text>
              <Text style={styles.pointsValue}>{totalPoints.toLocaleString()}</Text>
            </View>
            <View style={styles.pointsIcon}>
              <Ionicons name="star" size={28} color="#fbbf24" />
            </View>
          </View>
          <View style={{ flexDirection: 'row', marginTop: 16, gap: 8 }}>
            <TouchableOpacity onPress={() => Alert.alert('Redeem', 'Redeem points for cash or discounts coming soon!')} style={styles.redeemBtn}>
              <Text style={styles.redeemBtnText}>Redeem Points</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(os)/wallet/rewards/history')} style={styles.historyBtn}>
              <Text style={styles.historyBtnText}>History</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Daily Spin Wheel */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={styles.sectionLabel}>Daily Spin</Text>
          <View style={{ width: WHEEL_SIZE, height: WHEEL_SIZE, alignItems: 'center', justifyContent: 'center' }}>
            <View style={styles.pointer} />
            <Animated.View style={[styles.wheel, { transform: [{ rotate: spinRotate }] }]}>
              {REWARD_SEGMENTS.map((segment, index) => {
                const angle = (360 / REWARD_SEGMENTS.length) * index;
                return (
                  <View key={index} style={[styles.segment, {
                    backgroundColor: segment.color,
                    transform: [{ rotate: `${angle}deg` }],
                  }]}>
                    <Text style={styles.segmentText}>{segment.label}</Text>
                  </View>
                );
              })}
            </Animated.View>
            <TouchableOpacity onPress={handleDailySpin} disabled={spinning || !canSpin} style={[styles.spinBtn, (!canSpin || spinning) && styles.spinBtnDisabled]}>
              {spinning ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.spinBtnText}>SPIN</Text>}
            </TouchableOpacity>
          </View>
          <Text style={styles.spinStatus}>
            {!canSpin && timeRemaining ? `Next spin in: ${timeRemaining}` : 'Ready to spin!'}
          </Text>
          {currentReward && (
            <View style={[styles.rewardBanner, { borderColor: currentReward.color, backgroundColor: currentReward.color + '20' }]}>
              <Text style={styles.rewardBannerText}>You won {currentReward.label}!</Text>
            </View>
          )}
        </View>

        {/* Tasks */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Earn More Points</Text>
          {tasks.map((task) => (
            <View key={task.id} style={[styles.taskRow, task.completed && { opacity: 0.5 }]}>
              <View style={[styles.taskIcon, { backgroundColor: task.completed ? '#22c55e20' : '#6366f120' }]}>
                <Ionicons name={task.icon as any} size={20} color={task.completed ? '#22c55e' : '#6366f1'} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{task.label}</Text>
                <Text style={{ color: '#9ca3af', fontSize: 12, marginTop: 2 }}>+{task.points} points</Text>
              </View>
              {task.completed ? (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  <Text style={{ color: '#22c55e', marginLeft: 6, fontWeight: '600' }}>Done</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={() => handleClaimTask(task.id)} style={styles.claimBtn}>
                  <Text style={styles.claimBtnText}>Claim</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Recent Rewards */}
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Recent Rewards</Text>
          {rewardHistory.length === 0 ? (
            <Text style={{ color: '#6b7280', fontStyle: 'italic' }}>No rewards yet. Spin the wheel!</Text>
          ) : (
            rewardHistory.slice(0, 5).map((reward, idx) => (
              <View key={idx} style={styles.historyRow}>
                <View style={styles.historyIcon}>
                  <Ionicons name="gift-outline" size={16} color="#fbbf24" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ color: '#fff', fontSize: 14 }} numberOfLines={1}>{reward.description}</Text>
                  <Text style={{ color: '#6b7280', fontSize: 11 }}>{new Date(reward.created_at || reward.timestamp).toLocaleDateString()}</Text>
                </View>
                <Text style={{ color: '#fbbf24', fontWeight: '700' }}>+{reward.amount}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scroll: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  pointsCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 24, marginHorizontal: 16, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pointsLabel: { fontSize: 13, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
  pointsValue: { fontSize: 36, fontWeight: '800', color: '#fff', marginTop: 4 },
  pointsIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(251,191,36,0.1)', alignItems: 'center', justifyContent: 'center' },
  redeemBtn: { flex: 1, backgroundColor: '#6366f1', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  redeemBtnText: { color: '#fff', fontWeight: '700' },
  historyBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  historyBtnText: { color: '#fff', fontWeight: '600' },
  sectionLabel: { color: '#9ca3af', fontSize: 13, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 },
  pointer: { position: 'absolute', top: -8, zIndex: 10, width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 20, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#ef4444' },
  wheel: { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_SIZE / 2, overflow: 'hidden', borderWidth: 4, borderColor: '#6366f1' },
  segment: { position: 'absolute', width: WHEEL_SIZE / 2, height: WHEEL_SIZE / 2, left: 0, top: 0, transformOrigin: 'bottom right' },
  segmentText: { position: 'absolute', color: '#fff', fontSize: 10, fontWeight: '700', left: WHEEL_SIZE * 0.18, top: WHEEL_SIZE * 0.06, width: 50, textAlign: 'center' },
  spinBtn: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#0f0f1a', zIndex: 5 },
  spinBtnDisabled: { backgroundColor: '#333' },
  spinBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  spinStatus: { marginTop: 12, color: '#9ca3af', fontSize: 14 },
  rewardBanner: { borderWidth: 2, borderRadius: 16, padding: 14, marginTop: 16, alignItems: 'center' },
  rewardBannerText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, padding: 20, marginHorizontal: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  taskRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  taskIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  claimBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  claimBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  historyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  historyIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(251,191,36,0.1)', alignItems: 'center', justifyContent: 'center' },
});

