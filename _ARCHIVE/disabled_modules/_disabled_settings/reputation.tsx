import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface ReputationData {
  score: number;
  level: string;
  transactions_completed: number;
  disputes_won: number;
  disputes_lost: number;
  verification_level: number;
  tribe_count: number;
  member_since: string;
  badges: string[];
}

export default function ReputationScreen() {
  const { user } = useAuthStore();
  const [data, setData] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReputation();
  }, []);

  const fetchReputation = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('reputation_score, created_at')
      .eq('id', user.id)
      .single();

    const { count: txCount } = await supabase
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const { count: tribeCount } = await supabase
      .from('tribe_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setLoading(false);

    const score = profile?.reputation_score || 0;
    let level = 'Bronze';
    if (score >= 90) level = 'Platinum';
    else if (score >= 70) level = 'Gold';
    else if (score >= 50) level = 'Silver';

    setData({
      score,
      level,
      transactions_completed: txCount || 0,
      disputes_won: 0,
      disputes_lost: 0,
      verification_level: 1,
      tribe_count: tribeCount || 0,
      member_since: profile?.created_at || new Date().toISOString(),
      badges: score > 50 ? ['Verified', 'Trusted Trader'] : ['New Member'],
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Reputation</Text>
        <Text style={styles.empty}>No reputation data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reputation</Text>

      <View style={styles.scoreCard}>
        <View style={[styles.scoreCircle, { borderColor: getScoreColor(data.score) }]}>
          <Text style={[styles.scoreValue, { color: getScoreColor(data.score) }]}>
            {data.score}
          </Text>
          <Text style={styles.scoreLabel}>out of 100</Text>
        </View>
        <Text style={styles.levelText}>{data.level} Member</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{data.transactions_completed}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{data.tribe_count}</Text>
          <Text style={styles.statLabel}>Tribes</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{data.verification_level}</Text>
          <Text style={styles.statLabel}>KYC Level</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {Math.floor((Date.now() - new Date(data.member_since).getTime()) / (1000 * 60 * 60 * 24))}
          </Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Badges</Text>
      <View style={styles.badgesRow}>
        {data.badges.map((badge, i) => (
          <View key={i} style={styles.badge}>
            <Text style={styles.badgeText}>🏅 {badge}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.sectionTitle}>How to Improve</Text>
      <View style={styles.tipCard}>
        <Text style={styles.tipText}>✓ Complete more transactions</Text>
        <Text style={styles.tipText}>✓ Verify your identity (KYC)</Text>
        <Text style={styles.tipText}>✓ Join and participate in tribes</Text>
        <Text style={styles.tipText}>✓ Resolve disputes fairly</Text>
        <Text style={styles.tipText}>✓ Maintain a positive balance</Text>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  scoreCard: { alignItems: 'center', marginVertical: 24 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreValue: { fontSize: 36, fontWeight: 'bold' },
  scoreLabel: { color: '#888', fontSize: 12 },
  levelText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  statBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    width: '47%',
    alignItems: 'center',
  },
  statValue: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 12 },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 24 },
  badge: {
    backgroundColor: '#f59e0b20',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#f59e0b40',
  },
  badgeText: { color: '#f59e0b', fontSize: 13, fontWeight: '600' },
  tipCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  tipText: { color: '#aaa', fontSize: 14, marginBottom: 8 },
  backButton: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
  empty: { color: '#666', fontSize: 16, textAlign: 'center', marginTop: 60 },
});
