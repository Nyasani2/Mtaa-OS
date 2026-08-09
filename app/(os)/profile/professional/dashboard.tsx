import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface ProfessionalProfile {
  id: string;
  job_title: string | null;
  company: string | null;
  industry: string | null;
  experience_years: number | null;
  skills: string[] | null;
  certifications: string[] | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  bio: string | null;
  availability: string | null;
  expected_salary: number | null;
}

interface DashboardStats {
  profileViews: number;
  jobApplications: number;
  interviews: number;
  offers: number;
  profile: ProfessionalProfile | null;
}

export default function ProfessionalDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({
    profileViews: 0,
    jobApplications: 0,
    interviews: 0,
    offers: 0,
    profile: null,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchStats(); }, [user?.id]);

  const fetchStats = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      // Profile views: count from analytics_events where event='profile_view' and target_id=user.id
      const { count: profileViews, error: viewsErr } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event', 'profile_view')
        .eq('target_id', user.id);

      // Job applications by this user
      const { count: jobApplications, error: appsErr } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_id', user.id);

      // Interviews scheduled for this user (status = 'interview_scheduled' or 'interviewed')
      const { count: interviews, error: intErr } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_id', user.id)
        .in('status', ['interview_scheduled', 'interviewed']);

      // Offers received (status = 'offered' or 'accepted')
      const { count: offers, error: offErr } = await supabase
        .from('job_applications')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_id', user.id)
        .in('status', ['offered', 'accepted']);

      // Professional profile
      const { data: profile, error: profErr } = await supabase
        .from('professional_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (viewsErr) console.error('Profile views error:', viewsErr);
      if (appsErr) console.error('Applications error:', appsErr);
      if (intErr) console.error('Interviews error:', intErr);
      if (offErr) console.error('Offers error:', offErr);
      if (profErr && profErr.code !== 'PGRST116') console.error('Profile error:', profErr);

      setStats({
        profileViews: profileViews || 0,
        jobApplications: jobApplications || 0,
        interviews: interviews || 0,
        offers: offers || 0,
        profile: profile || null,
      });
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  const getCompletion = () => {
    let score = 0;
    if (stats.profile?.job_title) score += 15;
    if (stats.profile?.company) score += 10;
    if (stats.profile?.industry) score += 10;
    if (stats.profile?.experience_years) score += 15;
    if (stats.profile?.skills?.length) score += 15;
    if (stats.profile?.certifications?.length) score += 10;
    if (stats.profile?.linkedin_url) score += 10;
    if (stats.profile?.bio) score += 15;
    return Math.min(score, 100);
  };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
    </View>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/professional/edit')}>
          <Ionicons name="create-outline" size={22} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Profile Completion */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profile Completion</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getCompletion()}%` }]} />
        </View>
        <Text style={styles.progressText}>{getCompletion()}% Complete</Text>
        {getCompletion() < 100 && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/professional/edit')}>
            <Text style={styles.actionBtnText}>Complete Your Profile</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="eye-outline" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{stats.profileViews}</Text>
          <Text style={styles.statLabel}>Profile Views</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="briefcase-outline" size={24} color="#10b981" />
          <Text style={styles.statValue}>{stats.jobApplications}</Text>
          <Text style={styles.statLabel}>Applications</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.interviews}</Text>
          <Text style={styles.statLabel}>Interviews</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#8b5cf6" />
          <Text style={styles.statValue}>{stats.offers}</Text>
          <Text style={styles.statLabel}>Offers</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/jobs')}>
          <Ionicons name="search-outline" size={20} color="#3b82f6" />
          <Text style={styles.actionText}>Browse Jobs</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/profile/professional/edit')}>
          <Ionicons name="create-outline" size={20} color="#10b981" />
          <Text style={styles.actionText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/profile/analytics')}>
          <Ionicons name="bar-chart-outline" size={20} color="#f59e0b" />
          <Text style={styles.actionText}>View Analytics</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Skills Preview */}
      {stats.profile?.skills && stats.profile.skills.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Skills</Text>
          <View style={styles.skillsRow}>
            {stats.profile.skills.slice(0, 6).map((skill, i) => (
              <View key={i} style={styles.skillTag}>
                <Text style={styles.skillText}>{skill}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, margin: 16, marginBottom: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  progressBar: { height: 8, backgroundColor: '#334155', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 4 },
  progressText: { fontSize: 13, color: '#94a3b8', marginTop: 8 },
  actionBtn: { backgroundColor: '#3b82f6', paddingVertical: 10, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, width: '47%', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#f1f5f9', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  actionText: { flex: 1, fontSize: 15, color: '#f1f5f9', marginLeft: 12 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillTag: { backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  skillText: { fontSize: 13, color: '#94a3b8' },
});
