// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Plus, Star, ExternalLink, Share2, Download, QrCode,
  Edit3, Eye, Heart, MessageSquare, ChevronRight,
  FileText, Link2, Briefcase
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface Project {
  id: string;
  title: string;
  description: string;
  skills: string[];
  url?: string;
  featured: boolean;
  created_at: string;
}

interface PortfolioStats {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
}

export default function PortfolioScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'projects' | 'analytics'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<PortfolioStats>({ totalViews: 0, totalLikes: 0, totalComments: 0, totalShares: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    loadPortfolio();
  }, [user?.id]);

  const loadPortfolio = async () => {
    try {
      // Load projects from professional_profiles.portfolio_data or a dedicated table
      const { data: profile } = await supabase
        .from('professional_profiles')
        .select('portfolio_data')
        .eq('user_id', user!.id)
        .maybeSingle();

      if (profile?.portfolio_data?.projects) {
        setProjects(profile.portfolio_data.projects);
      }

      // Load analytics from creator_earnings or analytics_events
      const { count: views } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event', 'portfolio_view')
        .filter('metadata->>user_id', 'eq', user!.id);

      setStats({
        totalViews: views || 0,
        totalLikes: profile?.portfolio_data?.totalLikes || 0,
        totalComments: profile?.portfolio_data?.totalComments || 0,
        totalShares: profile?.portfolio_data?.totalShares || 0,
      });
    } catch (err) {
      console.error('Portfolio load error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronRight size={24} color={Colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
          </TouchableOpacity>
          <Text style={styles.title}>Portfolio</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronRight size={24} color={Colors.text} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.title}>Portfolio</Text>
        <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Portfolio editing will be available in the next update')}>
          <Edit3 size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {[
          { id: 'projects' as const, label: 'Projects' },
          { id: 'analytics' as const, label: 'Analytics' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'projects' && (
          <View>
            <TouchableOpacity
              style={styles.addProjectBtn}
              onPress={() => Alert.alert('Coming Soon', 'Add project feature coming in next update')}
            >
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addProjectText}>Add New Project</Text>
            </TouchableOpacity>

            {projects.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 60 }}>
                <Briefcase size={48} color={Colors.textSecondary} />
                <Text style={{ color: Colors.textSecondary, marginTop: 16, fontSize: 16, fontWeight: '600' }}>No projects yet</Text>
                <Text style={{ color: Colors.textSecondary, marginTop: 4, fontSize: 13 }}>Add your first project to showcase your work</Text>
              </View>
            ) : (
              projects.map((project) => (
                <View key={project.id} style={styles.projectCard}>
                  <View style={[styles.projectThumb, { backgroundColor: '#0A84FF15' }]}>
                    <Text style={[styles.projectThumbText, { color: '#0A84FF' }]}>{project.title.charAt(0)}</Text>
                    {project.featured && (
                      <View style={styles.featuredBadge}>
                        <Star size={10} color="#FF9500" fill="#FF9500" />
                        <Text style={styles.featuredText}>Featured</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.projectContent}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.projectDesc} numberOfLines={2}>{project.description}</Text>
                    <View style={styles.skillsRow}>
                      {project.skills.map((s) => (
                        <View key={s} style={styles.skillChip}><Text style={styles.skillChipText}>{s}</Text></View>
                      ))}
                    </View>
                  </View>
                  <View style={styles.projectActions}>
                    <TouchableOpacity style={styles.projAction} onPress={() => project.url && Alert.alert('Open Link', project.url)}>
                      <ExternalLink size={14} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.projAction}>
                      <Share2 size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'analytics' && (
          <View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Portfolio Analytics</Text>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>{stats.totalViews.toLocaleString()}</Text>
                  <Text style={styles.analyticsLabel}>Total Views</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>{stats.totalLikes.toLocaleString()}</Text>
                  <Text style={styles.analyticsLabel}>Likes</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>{stats.totalComments.toLocaleString()}</Text>
                  <Text style={styles.analyticsLabel}>Comments</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>{stats.totalShares.toLocaleString()}</Text>
                  <Text style={styles.analyticsLabel}>Shares</Text>
                </View>
              </View>
            </View>

            <View style={styles.exportCard}>
              <Text style={styles.exportTitle}>Export Portfolio</Text>
              <View style={styles.exportActions}>
                <TouchableOpacity style={styles.exportBtn} onPress={() => Alert.alert('Coming Soon', 'PDF export coming soon')}>
                  <Download size={16} color={Colors.primary} /><Text style={styles.exportText}>PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportBtn} onPress={() => Alert.alert('Coming Soon', 'Link sharing coming soon')}>
                  <Link2 size={16} color={Colors.primary} /><Text style={styles.exportText}>Link</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.exportBtn} onPress={() => router.push('/profile/qr' as any)}>
                  <QrCode size={16} color={Colors.primary} /><Text style={styles.exportText}>QR Code</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.text },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  addProjectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed' },
  addProjectText: { fontSize: 14, color: Colors.primary, fontWeight: '600' },
  projectCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  projectThumb: { height: 120, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12, position: 'relative' },
  projectThumbText: { fontSize: 32, fontWeight: '800' },
  featuredBadge: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FF950015', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  featuredText: { fontSize: 10, color: '#FF9500', fontWeight: '700' },
  projectContent: { marginBottom: 12 },
  projectTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  projectDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  skillChip: { backgroundColor: Colors.primary + '10', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  skillChipText: { fontSize: 11, color: Colors.primary, fontWeight: '500' },
  projectActions: { flexDirection: 'row', gap: 8 },
  projAction: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  analyticsCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  analyticsTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  analyticsItem: { width: (width - 72) / 2, backgroundColor: Colors.background, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  analyticsValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  analyticsLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  exportCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  exportTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  exportActions: { flexDirection: 'row', gap: 8 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.background, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  exportText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
});
