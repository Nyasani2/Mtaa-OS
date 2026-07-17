import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// ─── IMPORT FROM SHARED CATALOG ───
import {
  ALL_APPS,
  PUBLIC_APPS,
  OWNER_APPS,
  AppTile,
  getAppsByCategory,
  FINANCE_APPS,
  HEALTH_APPS,
  CIVIC_APPS,
  COMMERCE_APPS,
  OS_APPS,
  TRANSPORT_APPS,
  SOCIAL_APPS,
  MEDIA_APPS,
  WORK_APPS,
  EDUCATION_APPS,
  ADMIN_APPS,
  UTILITY_APPS,
} from '@/lib/catalog/app-catalog';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 48) / 4;

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isOwner = user?.role === 'owner' || user?.role === 'admin';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const navigateToApp = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  // Filter apps based on owner status
  const visibleApps = isOwner ? ALL_APPS : PUBLIC_APPS;

  // Filter by active category if selected
  const displayedApps = activeCategory
    ? getAppsByCategory(activeCategory).filter((a) =>
        isOwner ? true : !a.ownerOnly
      )
    : visibleApps;

  const renderIcon = (app: AppTile, size: number = 24) => {
    const IconComponent = Ionicons;
    return (
      <IconComponent
        name={app.icon as any}
        size={size}
        color={app.color}
      />
    );
  };

  const renderAppTile = (app: AppTile, index: number) => (
    <Animated.View
      key={app.id}
      entering={FadeInUp.delay(index * 30).duration(400)}
      style={styles.tileContainer}
    >
      <TouchableOpacity
        onPress={() => navigateToApp(app.route)}
        activeOpacity={0.7}
        style={styles.tileTouchable}
      >
        <View style={[styles.tileIcon, { backgroundColor: app.bgColor }]}>
          {renderIcon(app, 22)}
          {app.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{app.badge}</Text>
            </View>
          ) : null}
          {app.isNew ? (
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NEW</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.tileLabel} numberOfLines={1}>
          {app.name}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );

  const categories = [
    { key: 'OS', label: 'OS', color: '#3b82f6' },
    { key: 'FINANCE', label: 'Finance', color: '#f97316' },
    { key: 'HEALTH', label: 'Health', color: '#06b6d4' },
    { key: 'COMMERCE', label: 'Commerce', color: '#ec4899' },
    { key: 'CIVIC', label: 'Civic', color: '#3b82f6' },
    { key: 'TRANSPORT', label: 'Transport', color: '#10b981' },
    { key: 'SOCIAL', label: 'Social', color: '#d946ef' },
    { key: 'MEDIA', label: 'Media', color: '#6366f1' },
    { key: 'WORK', label: 'Work', color: '#f59e0b' },
    { key: 'EDUCATION', label: 'Edu', color: '#14b8a6' },
    { key: 'ADMIN', label: 'Admin', color: '#7c3aed' },
    { key: 'UTILITY', label: 'Utility', color: '#6b7280' },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={styles.headerGradient}
        >
          <BlurView intensity={80} style={styles.blurHeader}>
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.greeting}>Good Day</Text>
                <Text style={styles.userName}>
                  {user?.full_name || user?.email || 'User'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(os)/settings' as any)}
                style={styles.settingsBtn}
              >
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </LinearGradient>
      </Animated.View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
        style={styles.categoryBar}
      >
        <TouchableOpacity
          onPress={() => setActiveCategory(null)}
          style={[
            styles.categoryChip,
            activeCategory === null && styles.categoryChipActive,
          ]}
        >
          <Text
            style={[
              styles.categoryChipText,
              activeCategory === null && styles.categoryChipTextActive,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            onPress={() =>
              setActiveCategory(activeCategory === cat.key ? null : cat.key)
            }
            style={[
              styles.categoryChip,
              activeCategory === cat.key && {
                ...styles.categoryChipActive,
                borderColor: cat.color,
                backgroundColor: cat.color + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.categoryChipText,
                activeCategory === cat.key && {
                  ...styles.categoryChipTextActive,
                  color: cat.color,
                },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* App Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.grid}>
          {displayedApps.map((app, index) => renderAppTile(app, index))}
        </View>

        {/* Owner Section */}
        {isOwner && OWNER_APPS.length > 0 && activeCategory === null && (
          <View style={styles.ownerSection}>
            <Text style={styles.ownerTitle}>Owner Tools</Text>
            <View style={styles.grid}>
              {OWNER_APPS.map((app, index) =>
                renderAppTile(app, displayedApps.length + index)
              )}
            </View>
          </View>
        )}

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    width: '100%',
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  blurHeader: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  greeting: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '700',
    marginTop: 2,
  },
  settingsBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff15',
  },
  categoryBar: {
    maxHeight: 56,
    marginTop: 8,
  },
  categoryScroll: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#3b82f620',
    borderColor: '#3b82f6',
  },
  categoryChipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#3b82f6',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  tileContainer: {
    width: TILE_SIZE,
    alignItems: 'center',
    marginBottom: 16,
  },
  tileTouchable: {
    alignItems: 'center',
  },
  tileIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  tileLabel: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    width: TILE_SIZE - 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    backgroundColor: '#22c55e',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#0f172a',
  },
  newBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '700',
  },
  ownerSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  ownerTitle: {
    color: '#f59e0b',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  footer: {
    height: 40,
  },
});
