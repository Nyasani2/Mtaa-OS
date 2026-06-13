import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/kernel/auth.store';

interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons' | 'FontAwesome5';
  route: string;
  category: string;
  installed: boolean;
  badge?: number;
  color: string;
  isSystem?: boolean;
}

const appRegistry: AppItem[] = [
  // System Apps (always installed, not from AppStore)
  { id: 'wallet', name: 'Wallet', description: 'Payments, transfers, savings, and financial services', icon: 'wallet', iconFamily: 'Ionicons', route: '/(os)/wallet', category: 'System', installed: true, color: '#4F46E5', isSystem: true },
  { id: 'health', name: 'Health', description: 'Medical records, appointments, and health tracking', icon: 'medical', iconFamily: 'Ionicons', route: '/(os)/health', category: 'System', installed: true, color: '#EF4444', isSystem: true },
  { id: 'settings', name: 'Settings', description: 'Account, security, and app preferences', icon: 'settings', iconFamily: 'Ionicons', route: '/(os)/settings', category: 'System', installed: true, color: '#6B7280', isSystem: true },
  { id: 'civic', name: 'Civic', description: 'Government services, identity, and civic engagement', icon: 'shield', iconFamily: 'Ionicons', route: '/(os)/civic', category: 'System', installed: true, color: '#059669', isSystem: true },

  // Wallet V2 Apps
  { id: 'banking-hub', name: 'Banking Hub', description: 'Partner banks, loans, and financial institutions', icon: 'bank', iconFamily: 'MaterialCommunityIcons', route: '/(os)/wallet/banking-hub', category: 'Finance', installed: true, color: '#4F46E5' },
  { id: 'gofund', name: 'GoFund', description: 'Crowdfunding for medical, education, and community', icon: 'hand-heart', iconFamily: 'MaterialCommunityIcons', route: '/(os)/wallet/gofund-hub', category: 'Finance', installed: true, color: '#EF4444' },
  { id: 'savings', name: 'Savings Hub', description: 'Personal and group savings goals with tracking', icon: 'piggy-bank', iconFamily: 'FontAwesome5', route: '/(os)/wallet/savings-hub', category: 'Finance', installed: true, color: '#10B981' },
  { id: 'sacco', name: 'SACCO Hub', description: 'Savings and Credit Cooperative Organizations', icon: 'account-group', iconFamily: 'MaterialCommunityIcons', route: '/(os)/wallet/sacco-hub', category: 'Finance', installed: true, color: '#8B5CF6' },
  { id: 'insurance', name: 'Insurance', description: 'Health, vehicle, life, and asset coverage', icon: 'shield-check', iconFamily: 'MaterialCommunityIcons', route: '/(os)/wallet/insurance-hub', category: 'Finance', installed: true, color: '#059669' },
  { id: 'government', name: 'Gov't Hub', description: 'Revenue, identity, licensing, and civic payments', icon: 'landmark', iconFamily: 'FontAwesome5', route: '/(os)/wallet/government-hub', category: 'Finance', installed: true, color: '#D97706' },
  { id: 'partner-ecosystem', name: 'Partners', description: 'Business partner directory and applications', icon: 'storefront', iconFamily: 'Ionicons', route: '/(os)/wallet/partner-ecosystem', category: 'Finance', installed: true, color: '#0891B2' },
  { id: 'tax', name: 'Tax / KRA', description: 'Tax filing, payments, and compliance', icon: 'receipt', iconFamily: 'Ionicons', route: '/(os)/wallet/tax', category: 'Finance', installed: true, color: '#7C3AED' },
  { id: 'credit', name: 'Credit', description: 'Loans, credit scores, and lending', icon: 'credit-card', iconFamily: 'Ionicons', route: '/(os)/wallet/credit', category: 'Finance', installed: true, color: '#EC4899' },
  { id: 'escrow', name: 'Escrow', description: 'Secure transaction holding and release', icon: 'lock-closed', iconFamily: 'Ionicons', route: '/(os)/wallet/escrow', category: 'Finance', installed: true, color: '#6366F1' },
  { id: 'business', name: 'Business', description: 'Business registration and management', icon: 'business', iconFamily: 'Ionicons', route: '/(os)/wallet/business', category: 'Finance', installed: true, color: '#14B8A6' },
  { id: 'agent', name: 'Agent Network', description: 'Agent locator, float top-up, and commissions', icon: 'people', iconFamily: 'Ionicons', route: '/(os)/wallet/agent', category: 'Finance', installed: true, color: '#F59E0B' },

  // Transport Apps
  { id: 'mtaxi', name: 'MTaxi', description: 'Ride-hailing and taxi services', icon: 'car', iconFamily: 'Ionicons', route: '/(os)/mtaxi', category: 'Transport', installed: false, color: '#F59E0B' },
  { id: 'mtruck', name: 'MTruck', description: 'Freight and logistics marketplace', icon: 'truck', iconFamily: 'FontAwesome5', route: '/(os)/mtruck', category: 'Transport', installed: false, color: '#EA580C' },

  // Social Apps
  { id: 'tribes', name: 'Tribes', description: 'Community groups and social networking', icon: 'people-circle', iconFamily: 'Ionicons', route: '/(os)/tribes', category: 'Social', installed: false, color: '#8B5CF6' },
  { id: 'messages', name: 'Messages', description: 'Chat, calls, and messaging', icon: 'chatbubbles', iconFamily: 'Ionicons', route: '/(os)/messages', category: 'Social', installed: false, color: '#3B82F6' },

  // Commerce Apps
  { id: 'shop', name: 'Shop', description: 'Local marketplace and e-commerce', icon: 'cart', iconFamily: 'Ionicons', route: '/(os)/shop', category: 'Commerce', installed: false, color: '#10B981' },
  { id: 'marketplace', name: 'Marketplace', description: 'Buy and sell goods and services', icon: 'storefront', iconFamily: 'Ionicons', route: '/(os)/marketplace', category: 'Commerce', installed: false, color: '#0891B2' },

  // Work Apps
  { id: 'jobs', name: 'Jobs', description: 'Job listings and workforce management', icon: 'briefcase', iconFamily: 'Ionicons', route: '/(os)/jobs', category: 'Work', installed: false, color: '#6366F1' },
  { id: 'education', name: 'Education', description: 'Courses, certificates, and learning', icon: 'school', iconFamily: 'Ionicons', route: '/(os)/education', category: 'Work', installed: false, color: '#7C3AED' },

  // Civic Apps
  { id: 'streets', name: 'Streets', description: 'Road conditions, reporting, and navigation', icon: 'map', iconFamily: 'Ionicons', route: '/(os)/streets', category: 'Civic', installed: false, color: '#059669' },

  // Utility Apps
  { id: 'documents', name: 'Documents', description: 'File manager and document storage', icon: 'document-text', iconFamily: 'Ionicons', route: '/(os)/documents', category: 'Utility', installed: false, color: '#6B7280' },
  { id: 'gallery', name: 'Gallery', description: 'Photos and media management', icon: 'images', iconFamily: 'Ionicons', route: '/(os)/gallery', category: 'Utility', installed: false, color: '#EC4899' },
  { id: 'clock', name: 'Clock', description: 'Alarm, timer, and world clock', icon: 'time', iconFamily: 'Ionicons', route: '/(os)/clock', category: 'Utility', installed: false, color: '#F59E0B' },
  { id: 'scheduler', name: 'Scheduler', description: 'Calendar and event planning', icon: 'calendar', iconFamily: 'Ionicons', route: '/(os)/scheduler', category: 'Utility', installed: false, color: '#3B82F6' },
];

const categories = ['All', 'System', 'Finance', 'Transport', 'Social', 'Commerce', 'Work', 'Civic', 'Utility'];

export default function AppStoreScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [installedApps, setInstalledApps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load installed apps from storage/kernel
    const loadInstalled = async () => {
      try {
        // In production, this would come from the kernel/app registry
        const defaultInstalled = new Set(appRegistry.filter(a => a.installed).map(a => a.id));
        setInstalledApps(defaultInstalled);
      } catch (err) {
        console.error('Load installed apps error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInstalled();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh app list from server
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleInstall = (app: AppItem) => {
    if (app.isSystem) {
      router.push(app.route as any);
      return;
    }
    // For non-system apps, trigger install flow
    setInstalledApps(prev => new Set([...prev, app.id]));
    // In production: call kernel to download and install
    router.push(app.route as any);
  };

  const handleOpen = (app: AppItem) => {
    router.push(app.route as any);
  };

  const renderIcon = (app: AppItem, size: number) => {
    const props = { name: app.icon as any, size, color: app.color };
    switch (app.iconFamily) {
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons {...props} />;
      case 'FontAwesome5':
        return <FontAwesome5 {...props} />;
      default:
        return <Ionicons {...props} />;
    }
  };

  const filteredApps = appRegistry.filter(app => {
    const matchesCategory = activeCategory === 'All' || app.category === activeCategory;
    const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredApps = filteredApps.filter(a => a.category === 'Finance' && !a.isSystem).slice(0, 4);

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
        <View>
          <Text style={styles.headerTitle}>AppStore</Text>
          <Text style={styles.headerSubtitle}>Discover apps for your MTAA OS</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(os)/settings')}>
          <Ionicons name="person-circle" size={32} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9CA3AF"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryTab, activeCategory === cat && styles.categoryTabActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryTabText, activeCategory === cat && styles.categoryTabTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Section (only on All/Finance) */}
        {(activeCategory === 'All' || activeCategory === 'Finance') && !searchQuery && featuredApps.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Featured</Text>
            <View style={styles.featuredGrid}>
              {featuredApps.map((app) => (
                <TouchableOpacity
                  key={app.id}
                  style={styles.featuredCard}
                  onPress={() => installedApps.has(app.id) ? handleOpen(app) : handleInstall(app)}
                >
                  <View style={[styles.featuredIcon, { backgroundColor: app.color + '15' }]}>
                    {renderIcon(app, 28)}
                  </View>
                  <Text style={styles.featuredName} numberOfLines={1}>{app.name}</Text>
                  <Text style={styles.featuredDesc} numberOfLines={2}>{app.description}</Text>
                  <View style={styles.featuredAction}>
                    {installedApps.has(app.id) ? (
                      <View style={[styles.actionButton, { backgroundColor: app.color + '15' }]}>
                        <Text style={[styles.actionText, { color: app.color }]}>Open</Text>
                      </View>
                    ) : (
                      <View style={[styles.actionButton, { backgroundColor: app.color }]}>
                        <Text style={styles.actionTextWhite}>Get</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* App List */}
        <Text style={styles.sectionTitle}>
          {activeCategory === 'All' ? 'All Apps' : `${activeCategory} Apps`}
        </Text>
        {filteredApps.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No apps found</Text>
            <Text style={styles.emptyDesc}>Try a different search or category</Text>
          </View>
        ) : (
          filteredApps.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={styles.appRow}
              onPress={() => installedApps.has(app.id) ? handleOpen(app) : handleInstall(app)}
            >
              <View style={[styles.appIcon, { backgroundColor: app.color + '15' }]}>
                {renderIcon(app, 24)}
              </View>
              <View style={styles.appInfo}>
                <Text style={styles.appName}>{app.name}</Text>
                <Text style={styles.appDesc} numberOfLines={1}>{app.description}</Text>
                <Text style={styles.appCategory}>{app.category}</Text>
              </View>
              {app.isSystem ? (
                <View style={styles.systemBadge}>
                  <Text style={styles.systemBadgeText}>System</Text>
                </View>
              ) : installedApps.has(app.id) ? (
                <TouchableOpacity
                  style={[styles.actionButtonSmall, { backgroundColor: app.color + '15' }]}
                  onPress={() => handleOpen(app)}
                >
                  <Text style={[styles.actionTextSmall, { color: app.color }]}>Open</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButtonSmall, { backgroundColor: app.color }]}
                  onPress={() => handleInstall(app)}
                >
                  <Text style={styles.actionTextWhiteSmall}>Get</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#111827' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  profileButton: { padding: 4 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  categoryScroll: { marginBottom: 12 },
  categoryContent: { paddingHorizontal: 16, gap: 8 },
  categoryTab: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#E5E7EB', marginRight: 8,
  },
  categoryTabActive: { backgroundColor: '#4F46E5' },
  categoryTabText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  categoryTabTextActive: { color: '#FFFFFF' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginHorizontal: 16, marginBottom: 12, marginTop: 8 },
  featuredGrid: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12,
    justifyContent: 'space-between',
  },
  featuredCard: {
    width: '47%', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  featuredIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  featuredName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  featuredDesc: { fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 16 },
  featuredAction: { marginTop: 10 },
  actionButton: { paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '700' },
  actionTextWhite: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  appRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    marginHorizontal: 16, marginBottom: 8, borderRadius: 14, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  appIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  appInfo: { flex: 1 },
  appName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  appDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  appCategory: { fontSize: 11, color: '#9CA3AF', marginTop: 2, textTransform: 'uppercase', letterSpacing: 0.5 },
  systemBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F3F4F6' },
  systemBadgeText: { fontSize: 11, fontWeight: '700', color: '#9CA3AF' },
  actionButtonSmall: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  actionTextSmall: { fontSize: 13, fontWeight: '700' },
  actionTextWhiteSmall: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#9CA3AF', marginTop: 16 },
  emptyDesc: { fontSize: 13, color: '#D1D5DB', marginTop: 4 },
  bottomPadding: { height: 32 },
});
