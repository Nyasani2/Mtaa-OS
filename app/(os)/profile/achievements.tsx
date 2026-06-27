import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { ProfileService } from '@/lib/profile/services/profile-service';

const ACHIEVEMENT_CONFIG: Record<string, { icon: string; color: string; desc: string }> = {
  first_post: { icon: 'create-outline', color: '#2563EB', desc: 'Published your first post' },
  first_follower: { icon: 'person-add-outline', color: '#059669', desc: 'Gained your first follower' },
  verified: { icon: 'shield-checkmark-outline', color: '#2563EB', desc: 'Identity verified' },
  creator: { icon: 'sparkles-outline', color: '#7c3aed', desc: 'Became a creator' },
  business: { icon: 'business-outline', color: '#2563EB', desc: 'Registered a business' },
  top_rated: { icon: 'star-outline', color: '#d97706', desc: 'Achieved top rated status' },
  early_adopter: { icon: 'rocket-outline', color: '#dc2626', desc: 'Joined during early access' },
  influencer: { icon: 'trending-up-outline', color: '#7c3aed', desc: 'Reached influencer status' },
  power_user: { icon: 'flash-outline', color: '#d97706', desc: 'Power user milestone' },
  community_builder: { icon: 'people-outline', color: '#059669', desc: 'Built a community' },
  content_creator: { icon: 'film-outline', color: '#2563EB', desc: 'Created 50+ pieces of content' },
};

export default function AchievementsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    ProfileService.getAchievements(user.id).then(data => { setAchievements(data); setLoading(false); }).catch(() => setLoading(false));
  }, [user?.id]);

  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#2563EB" /></View>;
  const earnedTypes = new Set(achievements.map(a => a.achievement_type));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
        <View style={styles.statsCard}><Text style={styles.statsNumber}>{achievements.length}</Text><Text style={styles.statsLabel}>Achievements Earned</Text></View>
        <Text style={styles.sectionTitle}>Available</Text>
        {Object.entries(ACHIEVEMENT_CONFIG).map(([type, config]) => {
          const earned = earnedTypes.has(type);
          return (
            <View key={type} style={[styles.achievementCard, earned && styles.earnedCard]}>
              <View style={[styles.achievementIcon, { backgroundColor: config.color + '15' }]}><Ionicons name={config.icon as any} size={24} color={earned ? config.color : '#cbd5e1'} /></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.achievementTitle, !earned && styles.lockedTitle]}>{type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                <Text style={styles.achievementDesc}>{config.desc}</Text>
              </View>
              {earned ? <Ionicons name="checkmark-circle" size={24} color="#059669" /> : <Ionicons name="lock-closed" size={20} color="#cbd5e1" />}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { color: '#0f172a', fontSize: 18, fontWeight: '700' },
  statsCard: { backgroundColor: '#eff6ff', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  statsNumber: { color: '#2563EB', fontSize: 36, fontWeight: '800' },
  statsLabel: { color: '#64748b', fontSize: 14, marginTop: 4 },
  sectionTitle: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  achievementCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  earnedCard: { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  achievementIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  achievementTitle: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  lockedTitle: { color: '#94a3b8' },
  achievementDesc: { color: '#64748b', fontSize: 12, marginTop: 2 },
});
