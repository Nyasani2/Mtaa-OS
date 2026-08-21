import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

 
const MTAA_HOME_BG = require('@/assets/images/mtaa_home.png');

import {
  ALL_APPS,
  PUBLIC_APPS,
  OWNER_APPS,
  AppTile,
  getAppsByCategory,
} from '@/lib/catalog/app-catalog';

const { width, height } = Dimensions.get('window');
const TILE_SIZE = (width - 48) / 4;

export default function HomeScreen() {
  const router = useRouter();
  const { user, getDisplayName, refreshProfile, profile } = useAuthStore();
  React.useEffect(() => {
    if (user && !profile) refreshProfile();
  }, [user, profile]);

  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isOwner = (user as any)?.role === 'owner' || (user as any)?.role === 'admin';

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

  const visibleApps = isOwner ? ALL_APPS : PUBLIC_APPS;
  const displayedApps = activeCategory
    ? getAppsByCategory(activeCategory).filter((a) =>
        isOwner ? true : !a.ownerOnly
      )
    : visibleApps;

  const renderIcon = (app: AppTile, size: number = 24) => {
    return <Ionicons name={app.icon as any} size={size} color={app.color} />;
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
    // { key: 'CIVIC', label: 'Civic', color: '#3b82f6' },
    { key: 'TRANSPORT', label: 'Transport', color: '#10b981' },
    { key: 'SOCIAL', label: 'Social', color: '#d946ef' },
    { key: 'MEDIA', label: 'Media', color: '#6366f1' },
    { key: 'WORK', label: 'Work', color: '#f59e0b' },
    { key: 'EDUCATION', label: 'Edu', color: '#14b8a6' },
    { key: 'ADMIN', label: 'Admin', color: '#7c3aed' },
    { key: 'UTILITY', label: 'Utility', color: '#6b7280' },
  ];

  return (
    <ImageBackground
      source={MTAA_HOME_BG}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <LinearGradient
        colors={['rgba(15,23,42,0.3)', 'rgba(15,23,42,0.85)', 'rgba(15,23,42,0.95)']}
        style={styles.gradientOverlay}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Header */}
          <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
            <BlurView intensity={60} style={styles.blurHeader}>
              <View style={styles.headerContent}>
                <View>
                  <Text style={styles.greeting}>Good Day</Text>
                  <Text style={styles.userName}>
                    {getDisplayName() || 'User'}
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
              <Text style={[styles.categoryChipText, activeCategory === null && styles.categoryChipTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setActiveCategory(activeCategory === cat.key ? null : cat.key)}
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
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
          >
            <View style={styles.grid}>
              {displayedApps.map((app, index) => renderAppTile(app, index))}
            </View>

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
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  blurHeader: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(30,41,59,0.6)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  greeting: {
    fontSize: 13,
    color: '#cbd5e1',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  categoryBar: {
    maxHeight: 52,
    marginTop: 12,
  },
  categoryScroll: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: 'center',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(30,41,59,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderColor: '#3b82f6',
  },
  categoryChipText: {
    color: '#94a3b8',
    fontSize: 12,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  tileLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    width: TILE_SIZE - 8,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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
  ownerSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  ownerTitle: {
    color: '#fbbf24',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  footer: {
    height: 40,
  },
});
