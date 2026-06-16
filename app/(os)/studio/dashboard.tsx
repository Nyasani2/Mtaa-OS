import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator, ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface StudioProject {
  id: string;
  title: string;
  type: 'video' | 'live' | 'draft';
  thumbnail: string;
  duration: string;
  views: number;
  revenue: number;
  status: 'published' | 'draft' | 'processing' | 'scheduled';
  updated_at: string;
}

export default function StudioDashboardScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'published' | 'drafts' | 'live'>('all');
  const [cameraNetwork, setCameraNetwork] = useState({ connected: 0, max: 2, tier: 'free' });
  const [revenue, setRevenue] = useState({ today: 0, week: 0, month: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // TODO: Replace with actual API calls
    const mockProjects: StudioProject[] = [
      { id: '1', title: 'Nairobi Street Food Tour', type: 'video', thumbnail: '', duration: '12:34', views: 12400, revenue: 3400, status: 'published', updated_at: '2026-06-13' },
      { id: '2', title: 'Live: Kibera Art Walk', type: 'live', thumbnail: '', duration: '45:00', views: 8900, revenue: 5600, status: 'published', updated_at: '2026-06-12' },
      { id: '3', title: 'Mombasa Sunset Vlog', type: 'draft', thumbnail: '', duration: '08:20', views: 0, revenue: 0, status: 'draft', updated_at: '2026-06-11' },
      { id: '4', title: 'Sauti Sol Interview', type: 'video', thumbnail: '', duration: '28:15', views: 45200, revenue: 12800, status: 'published', updated_at: '2026-06-10' },
    ];
    setProjects(mockProjects);
    setCameraNetwork({ connected: 1, max: 2, tier: 'free' });
    setRevenue({ today: 1200, week: 8400, month: 45200 });
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filtered = projects.filter((p) => {
    if (activeTab === 'published') return p.status === 'published';
    if (activeTab === 'drafts') return p.status === 'draft' || p.status === 'processing';
    if (activeTab === 'live') return p.type === 'live';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#22C55E';
      case 'draft': return '#6B7280';
      case 'processing': return '#F59E0B';
      case 'scheduled': return '#3B82F6';
      default: return '#9CA3AF';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'live': return 'radio';
      case 'draft': return 'document-text';
      default: return 'film';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎬 Studio</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(os)/studio/camera')}>
          <Ionicons name="add-circle" size={20} color="#FFF" />
          <Text style={styles.createBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />}
      >
        {/* Revenue Stats */}
        <View style={styles.revenueRow}>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>Today</Text>
            <Text style={styles.revenueValue}>KES {revenue.today.toLocaleString()}</Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>This Week</Text>
            <Text style={styles.revenueValue}>KES {revenue.week.toLocaleString()}</Text>
          </View>
          <View style={styles.revenueCard}>
            <Text style={styles.revenueLabel}>This Month</Text>
            <Text style={styles.revenueValue}>KES {revenue.month.toLocaleString()}</Text>
          </View>
        </View>

        {/* Camera Network Status */}
        <TouchableOpacity
          style={styles.cameraNetworkCard}
          onPress={() => router.push('/(os)/studio/camera')}
        >
          <View style={styles.cameraNetworkLeft}>
            <View style={[styles.cameraIconWrap, { backgroundColor: cameraNetwork.connected > 0 ? '#22C55E20' : '#EF444420' }]}>
              <Ionicons name="camera" size={24} color={cameraNetwork.connected > 0 ? '#22C55E' : '#EF4444'} />
            </View>
            <View>
              <Text style={styles.cameraNetworkTitle}>Camera Network</Text>
              <Text style={styles.cameraNetworkSubtitle}>
                {cameraNetwork.connected}/{cameraNetwork.max} connected • {cameraNetwork.tier.toUpperCase()} tier
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </TouchableOpacity>

        {/* Upgrade Banner (free tier) */}
        {cameraNetwork.tier === 'free' && (
          <TouchableOpacity style={styles.upgradeBanner} onPress={() => router.push('/(os)/studio/upgrade')}>
            <Ionicons name="rocket" size={20} color="#A855F7" />
            <Text style={styles.upgradeText}>Upgrade to Pro — 4 cameras for 10 KES/day</Text>
            <Ionicons name="arrow-forward" size={16} color="#A855F7" />
          </TouchableOpacity>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['all', 'published', 'drafts', 'live'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Projects List */}
        {loading ? (
          <ActivityIndicator color="#3B82F6" style={{ marginTop: 40 }} />
        ) : (
          filtered.map((project) => (
            <TouchableOpacity
              key={project.id}
              style={styles.projectCard}
              onPress={() => router.push(`/(os)/studio/project/${project.id}`)}
            >
              <View style={styles.projectThumb}>
                <Ionicons name={getTypeIcon(project.type)} size={28} color="#3B82F6" />
              </View>
              <View style={styles.projectInfo}>
                <Text style={styles.projectTitle} numberOfLines={1}>{project.title}</Text>
                <View style={styles.projectMeta}>
                  <Text style={styles.projectDuration}>{project.duration}</Text>
                  <Text style={styles.projectDot}>•</Text>
                  <Text style={styles.projectViews}>{project.views.toLocaleString()} views</Text>
                  {project.revenue > 0 && (
                    <>
                      <Text style={styles.projectDot}>•</Text>
                      <Text style={styles.projectRevenue}>KES {project.revenue.toLocaleString()}</Text>
                    </>
                  )}
                </View>
                <View style={styles.projectFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(project.status) }]}>
                      {project.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.projectDate}>{project.updated_at}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#475569" />
            </TouchableOpacity>
          ))
        )}

        {filtered.length === 0 && !loading && (
          <View style={styles.empty}>
            <Ionicons name="film-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No {activeTab} projects yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/studio/camera')}>
              <Text style={styles.emptyBtnText}>Create Your First Video</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(os)/studio/camera')}>
        <Ionicons name="videocam" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#F8FAFC' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  createBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  revenueRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 8 },
  revenueCard: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 14,
    padding: 12, borderWidth: 1, borderColor: '#334155',
  },
  revenueLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  revenueValue: { fontSize: 15, fontWeight: '800', color: '#F1F5F9', marginTop: 4 },
  cameraNetworkCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginTop: 12,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  cameraNetworkLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cameraIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cameraNetworkTitle: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  cameraNetworkSubtitle: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  upgradeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#A855F715', marginHorizontal: 16, marginTop: 10,
    padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#A855F730',
  },
  upgradeText: { flex: 1, fontSize: 13, color: '#A855F7', fontWeight: '600' },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 16, marginBottom: 8 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  tabBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  tabText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
  projectCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  projectThumb: {
    width: 56, height: 56, borderRadius: 12,
    backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 15, fontWeight: '600', color: '#F1F5F9' },
  projectMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  projectDuration: { fontSize: 12, color: '#64748B' },
  projectDot: { fontSize: 12, color: '#475569' },
  projectViews: { fontSize: 12, color: '#94A3B8' },
  projectRevenue: { fontSize: 12, color: '#22C55E', fontWeight: '600' },
  projectFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  projectDate: { fontSize: 11, color: '#475569' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#64748B', marginTop: 12 },
  emptyBtn: {
    marginTop: 16, backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
});
