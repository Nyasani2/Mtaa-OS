import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { ProfileService } from '@/lib/profile/services/profile-service';
import type { ProfileAchievement } from '@/lib/profile/types';

const ACHIEVEMENT_CONFIG: Record<string, { icon: string; color: string; desc: string }> = {
  first_post: { icon: 'create-outline', color: '#00d4ff', desc: 'Published your first post' },
  first_follower: { icon: 'person-add-outline', color: '#00ff88', desc: 'Gained your first follower' },
  verified: { icon: 'shield-checkmark-outline', color: '#00d4ff', desc: 'Identity verified' },
  creator: { icon: 'sparkles-outline', color: '#ff00ff', desc: 'Became a creator' },
  business: { icon: 'business-outline', color: '#00d4ff', desc: 'Registered a business' },
  top_rated: { icon: 'star-outline', color: '#ffaa00', desc: 'Achieved top rated status' },
  early_adopter: { icon: 'rocket-outline', color: '#ff4444', desc: 'Joined during early access' },
  influencer: { icon: 'trending-up-outline', color: '#ff00ff', desc: 'Reached influencer status' },
  power_user: { icon: 'flash-outline', color: '#ffaa00', desc: 'Power user milestone' },
  community_builder: { icon: 'people-outline', color: '#00ff88', desc: 'Built a community' },
  content_creator: { icon: 'film-outline', color: '#00d4ff', desc: 'Created 50+ pieces of content' },
  job_poster: { icon: 'briefcase-outline', color: '#aa66ff', desc: 'Posted 10+ jobs' },
  seller: { icon: 'storefront-outline', color: '#00d4ff', desc: 'Made 50+ sales' },
  driver: { icon: 'car-outline', color: '#ffaa00', desc: 'Completed 100+ rides' },
  teacher: { icon: 'school-outline', color: '#00ff88', desc: 'Taught 50+ students' },
  health_provider: { icon: 'medical-outline', color: '#ff4444', desc: 'Served 100+ patients' },
  government_official: { icon: 'flag-outline', color: '#00d4ff', desc: 'Verified government role' },
  profile_complete: { icon: 'checkmark-circle-outline', color: '#00ff88', desc: '100% profile completion' },
  social_butterfly: { icon: 'chatbubbles-outline', color: '#ff00ff', desc: '500+ messages sent' },
  trending: { icon: 'flame-outline', color: '#ff4444', desc: 'Content went viral' },
};

export default function AchievementsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<ProfileAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!user?.id) return; ProfileService.getAchievements(user.id).then(data => { setAchievements(data); setLoading(false); }); }, [user?.id]);
  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const earnedTypes = new Set(achievements.map(a => a.achievement_type));
  const allTypes = Object.keys(ACHIEVEMENT_CONFIG);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.progressCard}>
          <Text style={styles.progressNum}>{achievements.length} / {allTypes.length}</Text>
          <Text style={styles.progressLabel}>Achievements Unlocked</Text>
          <View style={styles.progressBarBg}><View style={[styles.progressBarFill, { width: `${(achievements.length / allTypes.length) * 100}%` }]} /></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Earned</Text>
          {achievements.map(a => {
            const config = ACHIEVEMENT_CONFIG[a.achievement_type] || { icon: 'trophy-outline', color: '#888', desc: a.description || '' };
            return (
              <View key={a.id} style={styles.achievementCard}>
                <View style={[styles.achievementIcon, { backgroundColor: config.color + '22', borderColor: config.color + '44' }]}>
                  <Ionicons name={config.icon as any} size={24} color={config.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.achievementTitle}>{a.title}</Text>
                  <Text style={styles.achievementDesc}>{config.desc}</Text>
                  <Text style={styles.achievementDate}>{new Date(a.earned_at).toLocaleDateString()}</Text>
                </View>
              </View>
            );
          })}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Locked</Text>
          {allTypes.filter(t => !earnedTypes.has(t)).map(t => {
            const config = ACHIEVEMENT_CONFIG[t];
            return (
              <View key={t} style={[styles.achievementCard, styles.lockedCard]}>
                <View style={[styles.achievementIcon, { backgroundColor: '#111', borderColor: '#222' }]}>
                  <Ionicons name={config.icon as any} size={24} color="#444" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.achievementTitle, { color: '#555' }]}>{config.desc}</Text>
                  <Text style={styles.lockedText}>Locked</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  progressCard: { margin: 16, backgroundColor: '#111', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  progressNum: { color: '#00d4ff', fontSize: 32, fontWeight: '700' },
  progressLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  progressBarBg: { width: '100%', height: 6, backgroundColor: '#222', borderRadius: 3, overflow: 'hidden', marginTop: 12 },
  progressBarFill: { height: '100%', backgroundColor: '#00d4ff', borderRadius: 3 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  lockedCard: { opacity: 0.6 },
  achievementIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1, marginRight: 12 },
  achievementTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  achievementDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  achievementDate: { color: '#555', fontSize: 10, marginTop: 4 },
  lockedText: { color: '#444', fontSize: 11, marginTop: 2, fontStyle: 'italic' },
});
