import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard } from '@/components/appstore/AppCard';
import { useAppStore } from '@/hooks/useAppStore';
import { useOSKernel } from '@/hooks/useOSKernel';
import { AppItem } from '@/types/appstore';
import { COLORS, FONTS, SIZES } from '@/constants/theme';

const CATEGORIES = [
  { id: 'transport', label: 'Transport', icon: '🚕' },
  { id: 'finance', label: 'Finance', icon: '💰' },
  { id: 'social', label: 'Social', icon: '👥' },
  { id: 'productivity', label: 'Productivity', icon: '⚡' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'government', label: 'Government', icon: '🏛️' },
  { id: 'utilities', label: 'Utilities', icon: '🔧' },
];

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { installApp, uninstallApp, isInstalled, getInstalledApps } = useAppStore();
  const { kernel } = useOSKernel();

  const [activeCategory, setActiveCategory] = useState<string>('transport');
  const [apps, setApps] = useState<AppItem[]>([]);
  const [categoryApps, setCategoryApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const all = await kernel?.appStore?.getCatalog?.() ?? [];
      const installed = await getInstalledApps?.() ?? [];
      setApps(all);
      setInstalledIds(new Set(installed.map((a: AppItem) => a.id)));
    } catch (err) {
      console.error('[Categories] fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [kernel, getInstalledApps]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Filter apps by active category — replaces broken getAppsByCategory
  useEffect(() => {
    const filtered = apps.filter(a =>
      a.category?.toLowerCase() === activeCategory.toLowerCase()
    );
    setCategoryApps(filtered);
  }, [apps, activeCategory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleInstall = useCallback(async (app: AppItem) => {
    if (installingId) return;
    setInstallingId(app.id);
    try {
      await installApp(app);
      const installed = await getInstalledApps?.() ?? [];
      setInstalledIds(new Set(installed.map((a: AppItem) => a.id)));
    } catch (err) {
      console.error('[Categories] install error:', err);
    } finally {
      setInstallingId(null);
    }
  }, [installApp, getInstalledApps, installingId]);

  const handleUninstall = useCallback(async (appId: string) => {
    try {
      await uninstallApp(appId);
      const installed = await getInstalledApps?.() ?? [];
      setInstalledIds(new Set(installed.map((a: AppItem) => a.id)));
    } catch (err) {
      console.error('[Categories] uninstall error:', err);
    }
  }, [uninstallApp, getInstalledApps]);

  const renderApp = useCallback(({ item }: { item: AppItem }) => (
    <AppCard
      app={item}
      installed={installedIds.has(item.id)}
      installing={installingId === item.id}
      onInstall={() => handleInstall(item)}
      onUninstall={() => handleUninstall(item.id)}
      onPress={() => router.push(`/appstore/${item.id}` as any)}
    />
  ), [installedIds, installingId, handleInstall, handleUninstall, router]);

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Categories</Text>
      </View>

      {/* Category Selector */}
      <FlatList
        horizontal
        data={CATEGORIES}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        style={styles.catList}
        contentContainerStyle={styles.catContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.catBtn, activeCategory === item.id && styles.catBtnActive]}
            onPress={() => setActiveCategory(item.id)}
          >
            <Text style={styles.catIcon}>{item.icon}</Text>
            <Text style={[styles.catLabel, activeCategory === item.id && styles.catLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Apps in Category */}
      <FlatList
        data={categoryApps}
        keyExtractor={item => item.id}
        renderItem={renderApp}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.gridContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No apps yet</Text>
            <Text style={styles.emptySub}>
              No apps available in {CATEGORIES.find(c => c.id === activeCategory)?.label}.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: SIZES.md,
    paddingTop: SIZES.md,
    paddingBottom: SIZES.sm,
  },
  headerTitle: { fontFamily: FONTS.bold, fontSize: 28, color: COLORS.text },
  catList: { maxHeight: 80, marginTop: SIZES.sm },
  catContent: { paddingHorizontal: SIZES.md, gap: SIZES.sm },
  catBtn: {
    alignItems: 'center',
    paddingHorizontal: SIZES.md,
    paddingVertical: SIZES.sm,
    borderRadius: SIZES.md,
    backgroundColor: COLORS.surface,
    minWidth: 72,
  },
  catBtnActive: { backgroundColor: COLORS.primary },
  catIcon: { fontSize: 24, marginBottom: 4 },
  catLabel: { fontFamily: FONTS.medium, fontSize: 12, color: COLORS.textSecondary },
  catLabelActive: { color: '#fff', fontFamily: FONTS.bold },
  columnWrapper: { justifyContent: 'space-between', paddingHorizontal: SIZES.md },
  gridContent: { paddingBottom: SIZES.xl },
  emptyBox: { alignItems: 'center', marginTop: SIZES.xl * 2, paddingHorizontal: SIZES.xl },
  emptyEmoji: { fontSize: 48, marginBottom: SIZES.md },
  emptyTitle: { fontFamily: FONTS.bold, fontSize: 18, color: COLORS.text, marginBottom: SIZES.xs },
  emptySub: { fontFamily: FONTS.regular, fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
