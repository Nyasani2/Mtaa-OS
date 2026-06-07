import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppStoreHeader } from '@/components/appstore/AppStoreHeader';
import { FeaturedBanner } from '@/components/appstore/FeaturedBanner';
import { AppCard } from '@/components/appstore/AppCard';
import { CategoryPill } from '@/components/appstore/CategoryPill';
import { useAppStore } from '@/hooks/useAppStore';
import { useOSKernel } from '@/hooks/useOSKernel';
import { AppItem } from '@/types/appstore';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CATEGORIES = ['All', 'Transport', 'Finance', 'Social', 'Productivity', 'Health', 'Education', 'Government'];

export default function AppStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { installApp, uninstallApp, isInstalled, getInstalledApps } = useAppStore();
  const { kernel } = useOSKernel();

  const [activeTab, setActiveTab] = useState<'discover' | 'installed'>('discover');
  const [activeCategory, setActiveCategory] = useState('All');
  const [apps, setApps] = useState<AppItem[]>([]);
  const [installedAppsList, setInstalledAppsList] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);

  // ── installedApps as a Set for O(1) lookups ──
  const installedAppsSet = useMemo(() => {
    const ids = new Set<string>();
    installedAppsList.forEach(a => ids.add(a.id));
    return ids;
  }, [installedAppsList]);

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      const allApps = await kernel?.appStore?.getCatalog?.() ?? [];
      const installed = await getInstalledApps?.() ?? [];
      setApps(allApps);
      setInstalledAppsList(installed);
    } catch (err) {
      console.error('[AppStore] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [kernel, getInstalledApps]);

  useEffect(() => { fetchApps(); }, [fetchApps]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApps();
  }, [fetchApps]);

  const filteredApps = useMemo(() => {
    if (activeCategory === 'All') return apps;
    return apps.filter(a => a.category === activeCategory);
  }, [apps, activeCategory]);

  const handleInstall = useCallback(async (app: AppItem) => {
    if (installingId) return;
    setInstallingId(app.id);
    try {
      await installApp(app);
      const installed = await getInstalledApps?.() ?? [];
      setInstalledAppsList(installed);
    } catch (err) {
      console.error('[AppStore] install error:', err);
    } finally {
      setInstallingId(null);
    }
  }, [installApp, getInstalledApps, installingId]);

  const handleUninstall = useCallback(async (appId: string) => {
    try {
      await uninstallApp(appId);
      const installed = await getInstalledApps?.() ?? [];
      setInstalledAppsList(installed);
    } catch (err) {
      console.error('[AppStore] uninstall error:', err);
    }
  }, [uninstallApp, getInstalledApps]);

  const renderApp = useCallback(({ item }: { item: AppItem }) => {
    const isAppInstalled = installedAppsSet.has(item.id);
    return (
      <AppCard
        app={item}
        installed={isAppInstalled}
        installing={installingId === item.id}
        onInstall={() => handleInstall(item)}
        onUninstall={() => handleUninstall(item.id)}
        onPress={() => router.push(`/appstore/${item.id}` as any)}
      />
    );
  }, [installedAppsSet, installingId, handleInstall, handleUninstall, router]);

  const renderInstalledApp = useCallback(({ item }: { item: AppItem }) => (
    <TouchableOpacity
      style={styles.installedRow}
      onPress={() => router.push(`/(os)/${item.route}` as any)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.icon }} style={styles.installedIcon} />
      <View style={styles.installedInfo}>
        <Text style={styles.installedName}>{item.name}</Text>
        <Text style={styles.installedCategory}>{item.category}</Text>
      </View>
      <TouchableOpacity
        style={styles.openBtn}
        onPress={() => router.push(`/(os)/${item.route}` as any)}
      >
        <Text style={styles.openBtnText}>OPEN</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  ), [router]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <AppStoreHeader />

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'discover' && styles.tabActive]}
          onPress={() => setActiveTab('discover')}
        >
          <Text style={[styles.tabText, activeTab === 'discover' && styles.tabTextActive]}>
            Discover
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'installed' && styles.tabActive]}
          onPress={() => setActiveTab('installed')}
        >
          <Text style={[styles.tabText, activeTab === 'installed' && styles.tabTextActive]}>
            Installed
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'discover' ? (
        <>
          <FeaturedBanner apps={apps.slice(0, 3)} />

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContent}
          >
            {CATEGORIES.map(cat => (
              <CategoryPill
                key={cat}
                label={cat}
                active={activeCategory === cat}
                onPress={() => setActiveCategory(cat)}
              />
            ))}
          </ScrollView>

          <FlatList
            data={filteredApps}
            keyExtractor={item => item.id}
            renderItem={renderApp}
            numColumns={2}
            columnWrapperStyle={styles.columnWrapper}
            contentContainerStyle={styles.gridContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No apps found in this category.</Text>
            }
          />
        </>
      ) : (
        <FlatList
          data={installedAppsList}
          keyExtractor={item => item.id}
          renderItem={renderInstalledApp}
          contentContainerStyle={styles.installedList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyInstalled}>
              <Text style={styles.emptyInstalledText}>
                No apps installed yet.
Browse the Discover tab to find apps.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: SIZES.md,
    marginTop: SIZES.sm,
    gap: SIZES.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.sm,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontFamily: FONTS.medium, fontSize: 14, color: COLORS.textSecondary },
  tabTextActive: { color: '#fff', fontFamily: FONTS.bold },
  categoryScroll: { maxHeight: 48, marginTop: SIZES.sm },
  categoryContent: { paddingHorizontal: SIZES.md, gap: SIZES.sm },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: SIZES.md },
  gridContent: { paddingBottom: SIZES.xl },
  emptyText: { textAlign: 'center', marginTop: SIZES.xl, color: COLORS.textSecondary, fontFamily: FONTS.regular },
  installedList: { paddingHorizontal: SIZES.md, paddingBottom: SIZES.xl },
  installedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  installedIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.surface },
  installedInfo: { flex: 1, marginLeft: SIZES.md },
  installedName: { fontFamily: FONTS.bold, fontSize: 16, color: COLORS.text },
  installedCategory: { fontFamily: FONTS.regular, fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  openBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.xs,
    borderRadius: SIZES.sm,
  },
  openBtnText: { color: '#fff', fontFamily: FONTS.bold, fontSize: 13 },
  emptyInstalled: { alignItems: 'center', marginTop: SIZES.xl * 2 },
  emptyInstalledText: { textAlign: 'center', color: COLORS.textSecondary, fontFamily: FONTS.regular, lineHeight: 22 },
});
