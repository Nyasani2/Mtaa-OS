import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(width * 0.78, 340);

// ─── SCREEN REGISTRY ───
// Every screen in app/(os)/studio/ organized by category
interface ScreenItem {
  label: string;
  route: string;
  icon: string;
  iconFamily: 'ion' | 'material' | 'fa5';
}

interface Category {
  key: string;
  label: string;
  icon: string;
  color: string;
  screens: ScreenItem[];
}

const CATEGORIES: Category[] = [
  {
    key: 'live',
    label: 'Live Streaming',
    icon: 'radio-button-on',
    color: '#FF3B30',
    screens: [
      { label: 'Go Live', route: '/(os)/studio/live', icon: 'videocam', iconFamily: 'ion' },
      { label: 'Active Stream', route: '/(os)/studio/live-active', icon: 'pulse', iconFamily: 'ion' },
      { label: 'Broadcast Console', route: '/(os)/studio/broadcast-console', icon: 'desktop', iconFamily: 'ion' },
      { label: 'Live Broadcast', route: '/(os)/studio/live-broadcast', icon: 'broadcast', iconFamily: 'ion' },
    ],
  },
  {
    key: 'videos',
    label: 'Videos & Content',
    icon: 'play-circle',
    color: '#007AFF',
    screens: [
      { label: 'Video Player', route: '/(os)/studio/video-player', icon: 'play', iconFamily: 'ion' },
      { label: 'Feed', route: '/(os)/studio/feed', icon: 'newspaper', iconFamily: 'ion' },
      { label: 'Trending', route: '/(os)/studio/trending', icon: 'trending-up', iconFamily: 'ion' },
      { label: 'Nearby', route: '/(os)/studio/nearby', icon: 'location', iconFamily: 'ion' },
      { label: 'Search', route: '/(os)/studio/search', icon: 'search', iconFamily: 'ion' },
      { label: 'Search Results', route: '/(os)/studio/search-results', icon: 'list', iconFamily: 'ion' },
    ],
  },
  {
    key: 'upload',
    label: 'Upload & Create',
    icon: 'cloud-upload',
    color: '#34C759',
    screens: [
      { label: 'Upload Center', route: '/(os)/studio/upload-center', icon: 'cloud-upload', iconFamily: 'ion' },
      { label: 'Publish', route: '/(os)/studio/publish', icon: 'send', iconFamily: 'ion' },
      { label: 'Drafts', route: '/(os)/studio/drafts', icon: 'document-text', iconFamily: 'ion' },
      { label: 'Editor', route: '/(os)/studio/editor', icon: 'create', iconFamily: 'ion' },
      { label: 'Thumbnail', route: '/(os)/studio/thumbnail', icon: 'image', iconFamily: 'ion' },
    ],
  },
  {
    key: 'creator',
    label: 'Creator Hub',
    icon: 'person-circle',
    color: '#AF52DE',
    screens: [
      { label: 'Creator Profile', route: '/(os)/studio/creator-profile', icon: 'person', iconFamily: 'ion' },
      { label: 'Analytics', route: '/(os)/studio/analytics', icon: 'bar-chart', iconFamily: 'ion' },
      { label: 'Revenue', route: '/(os)/studio/creator-revenue', icon: 'cash', iconFamily: 'ion' },
      { label: 'Transparency', route: '/(os)/studio/creator-transparency', icon: 'eye', iconFamily: 'ion' },
      { label: 'Following', route: '/(os)/studio/following', icon: 'people', iconFamily: 'ion' },
      { label: 'Subscriptions', route: '/(os)/studio/subscriptions', icon: 'repeat', iconFamily: 'ion' },
    ],
  },
  {
    key: 'music',
    label: 'Music & Audio',
    icon: 'musical-notes',
    color: '#FF9500',
    screens: [
      { label: 'Music Studio', route: '/(os)/studio/music-studio', icon: 'musical-note', iconFamily: 'ion' },
      { label: 'Music Feed', route: '/(os)/studio/music-feed', icon: 'albums', iconFamily: 'ion' },
      { label: 'Podcast Upload', route: '/(os)/studio/podcast-upload', icon: 'mic', iconFamily: 'ion' },
    ],
  },
  {
    key: 'education',
    label: 'Education Studio',
    icon: 'school',
    color: '#5856D6',
    screens: [
      { label: 'Education Upload', route: '/(os)/studio/education-upload', icon: 'school', iconFamily: 'ion' },
      { label: 'Learning Feed', route: '/(os)/studio/learning-feed', icon: 'book', iconFamily: 'ion' },
    ],
  },
  {
    key: 'production',
    label: 'Production Tools',
    icon: 'film',
    color: '#FF2D55',
    screens: [
      { label: 'Director', route: '/(os)/studio/director', icon: 'aperture', iconFamily: 'ion' },
      { label: 'Multi-Camera', route: '/(os)/studio/multi-camera', icon: 'camera', iconFamily: 'ion' },
      { label: 'Virtual Production', route: '/(os)/studio/virtual-production', icon: 'cube', iconFamily: 'ion' },
      { label: 'Scenes', route: '/(os)/studio/scenes', icon: 'images', iconFamily: 'ion' },
      { label: 'Camera', route: '/(os)/studio/camera', icon: 'camera', iconFamily: 'ion' },
    ],
  },
  {
    key: 'community',
    label: 'Community',
    icon: 'chatbubbles',
    color: '#5AC8FA',
    screens: [
      { label: 'Community', route: '/(os)/studio/community', icon: 'people-circle', iconFamily: 'ion' },
      { label: 'Comments', route: '/(os)/studio/comments', icon: 'chatbubble', iconFamily: 'ion' },
    ],
  },
  {
    key: 'asis',
    label: 'ASIS & AI',
    icon: 'hardware-chip',
    color: '#00C7BE',
    screens: [
      { label: 'ASIS Assistant', route: '/(os)/studio/asis', icon: 'sparkles', iconFamily: 'ion' },
      { label: 'AI Studio', route: '/(os)/studio/ai-studio', icon: 'brain', iconFamily: 'ion' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings & Safety',
    icon: 'settings',
    color: '#8E8E93',
    screens: [
      { label: 'Safety', route: '/(os)/studio/safety', icon: 'shield-checkmark', iconFamily: 'ion' },
      { label: 'Accessibility', route: '/(os)/studio/accessibility', icon: 'accessibility', iconFamily: 'ion' },
      { label: 'Copyright', route: '/(os)/studio/copyright', icon: 'document-lock', iconFamily: 'ion' },
      { label: 'Performance', route: '/(os)/studio/performance', icon: 'speedometer', iconFamily: 'ion' },
      { label: 'Children Mode', route: '/(os)/studio/children-mode', icon: 'happy', iconFamily: 'ion' },
      { label: 'Children Zone', route: '/(os)/studio/children-zone', icon: 'balloon', iconFamily: 'ion' },
      { label: 'Device Pairing', route: '/(os)/studio/pairing', icon: 'phone-portrait', iconFamily: 'ion' },
    ],
  },
  {
    key: 'system',
    label: 'System',
    icon: 'apps',
    color: '#C7C7CC',
    screens: [
      { label: 'MStudio Complete', route: '/(os)/studio/mstudio-complete', icon: 'checkmark-done-circle', iconFamily: 'ion' },
      { label: 'Unified Studio', route: '/(os)/studio/unified-studio', icon: 'grid', iconFamily: 'ion' },
    ],
  },
];

// ─── ICON RENDERER ───
function RenderIcon({ item, size = 18, color = '#fff' }: { item: ScreenItem; size?: number; color?: string }) {
  if (item.iconFamily === 'material') {
    return <MaterialCommunityIcons name={item.icon as any} size={size} color={color} />;
  }
  if (item.iconFamily === 'fa5') {
    return <FontAwesome5 name={item.icon as any} size={size} color={color} />;
  }
  return <Ionicons name={item.icon as any} size={size} color={color} />;
}

function CategoryIcon({ name, size = 20, color = '#fff' }: { name: string; size?: number; color?: string }) {
  return <Ionicons name={name as any} size={size} color={color} />;
}

// ─── MAIN COMPONENT ───
export default function MStudioDashboard() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    live: true,
    videos: true,
    upload: true,
  });
  const slideAnim = useRef(new Animated.Value(-SIDEBAR_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggleSidebar = useCallback(() => {
    const toValue = sidebarOpen ? -SIDEBAR_WIDTH : 0;
    const fadeTo = sidebarOpen ? 0 : 1;
    setSidebarOpen(!sidebarOpen);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue, duration: 280, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: fadeTo, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [sidebarOpen]);

  const closeSidebar = useCallback(() => {
    if (!sidebarOpen) return;
    setSidebarOpen(false);
    Animated.parallel([
      Animated.timing(slideAnim, { toValue: -SIDEBAR_WIDTH, duration: 200, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [sidebarOpen]);

  const toggleCategory = useCallback((key: string) => {
    setExpandedCategories(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const navigateTo = useCallback((route: string) => {
    closeSidebar();
    // Small delay to let sidebar close before navigation
    setTimeout(() => router.push(route as any), 220);
  }, [closeSidebar, router]);

  const totalScreens = CATEGORIES.reduce((sum, cat) => sum + cat.screens.length, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0f" />

      {/* ─── HEADER ─── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleSidebar} style={styles.hamburger} activeOpacity={0.7}>
          <Ionicons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MStudio</Text>
        <TouchableOpacity style={styles.headerIcon} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ─── MAIN CONTENT ─── */}
      <ScrollView style={styles.mainScroll} contentContainerStyle={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard label="Screens" value={totalScreens.toString()} icon="apps" color="#007AFF" />
          <StatCard label="Categories" value={CATEGORIES.length.toString()} icon="grid" color="#34C759" />
          <StatCard label="Live" value="0" icon="radio" color="#FF3B30" />
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <QuickButton label="Go Live" icon="videocam" color="#FF3B30" onPress={() => navigateTo('/(os)/studio/live')} />
          <QuickButton label="Upload" icon="cloud-upload" color="#34C759" onPress={() => navigateTo('/(os)/studio/upload-center')} />
          <QuickButton label="Analytics" icon="bar-chart" color="#AF52DE" onPress={() => navigateTo('/(os)/studio/analytics')} />
          <QuickButton label="Creator" icon="person" color="#FF9500" onPress={() => navigateTo('/(os)/studio/creator-profile')} />
        </View>

        {/* Category Cards */}
        <Text style={styles.sectionTitle}>All Categories</Text>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.key}
            style={[styles.categoryCard, { borderLeftColor: cat.color }]}
            onPress={() => toggleCategory(cat.key)}
            activeOpacity={0.8}
          >
            <View style={styles.categoryHeader}>
              <View style={[styles.categoryIconWrap, { backgroundColor: cat.color + '22' }]}>
                <CategoryIcon name={cat.icon} size={20} color={cat.color} />
              </View>
              <View style={styles.categoryTextWrap}>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categoryCount}>{cat.screens.length} screens</Text>
              </View>
              <Ionicons
                name={expandedCategories[cat.key] ? 'chevron-down' : 'chevron-forward'}
                size={18}
                color="#8E8E93"
              />
            </View>
            {expandedCategories[cat.key] && (
              <View style={styles.screensWrap}>
                {cat.screens.map(screen => (
                  <TouchableOpacity
                    key={screen.route}
                    style={styles.screenRow}
                    onPress={() => navigateTo(screen.route)}
                    activeOpacity={0.6}
                  >
                    <RenderIcon item={screen} size={16} color="#A1A1AA" />
                    <Text style={styles.screenLabel}>{screen.label}</Text>
                    <Ionicons name="chevron-forward" size={14} color="#3A3A3C" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ─── SIDEBAR OVERLAY ─── */}
      {sidebarOpen && (
        <TouchableOpacity style={styles.overlayTouch} onPress={closeSidebar} activeOpacity={1}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableOpacity>
      )}

      {/* ─── SIDEBAR ─── */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: slideAnim }] }]}>
        <View style={styles.sidebarHeader}>
          <View style={styles.sidebarLogoWrap}>
            <Ionicons name="play-circle" size={32} color="#FF2D55" />
          </View>
          <View>
            <Text style={styles.sidebarTitle}>MStudio</Text>
            <Text style={styles.sidebarSubtitle}>Creator OS</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarScroll}>
          {CATEGORIES.map(cat => (
            <View key={cat.key} style={styles.sidebarCategory}>
              <TouchableOpacity
                style={styles.sidebarCatHeader}
                onPress={() => toggleCategory(cat.key)}
                activeOpacity={0.7}
              >
                <CategoryIcon name={cat.icon} size={18} color={cat.color} />
                <Text style={[styles.sidebarCatLabel, { color: cat.color }]}>{cat.label}</Text>
                <Ionicons
                  name={expandedCategories[cat.key] ? 'chevron-down' : 'chevron-forward'}
                  size={14}
                  color="#8E8E93"
                />
              </TouchableOpacity>
              {expandedCategories[cat.key] && (
                <View style={styles.sidebarScreens}>
                  {cat.screens.map(screen => (
                    <TouchableOpacity
                      key={screen.route}
                      style={styles.sidebarScreenBtn}
                      onPress={() => navigateTo(screen.route)}
                      activeOpacity={0.6}
                    >
                      <RenderIcon item={screen} size={16} color="#C7C7CC" />
                      <Text style={styles.sidebarScreenLabel}>{screen.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        <View style={styles.sidebarFooter}>
          <Text style={styles.sidebarFooterText}>MTAA OS v10</Text>
          <Text style={styles.sidebarFooterSub}>{totalScreens} screens loaded</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// ─── SUB-COMPONENTS ───
function StatCard({ label, value, icon, color }: { label: string; value: string; icon: string; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon as any} size={20} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function QuickButton({ label, icon, color, onPress }: { label: string; icon: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.quickBtn, { backgroundColor: color + '18' }]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.quickLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── STYLES ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0a0a0f',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  hamburger: { padding: 4, marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  headerIcon: { padding: 4 },

  mainScroll: { flex: 1 },
  mainContent: { padding: 16 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderTopWidth: 2,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12, marginTop: 4 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  quickBtn: {
    width: (width - 52) / 2,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quickLabel: { fontSize: 13, fontWeight: '600' },

  categoryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 10,
    borderLeftWidth: 3,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTextWrap: { flex: 1 },
  categoryLabel: { fontSize: 15, fontWeight: '600', color: '#fff' },
  categoryCount: { fontSize: 12, color: '#8E8E93', marginTop: 1 },

  screensWrap: { paddingHorizontal: 14, paddingBottom: 10 },
  screenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    gap: 10,
    borderRadius: 8,
  },
  screenLabel: { flex: 1, fontSize: 13, color: '#C7C7CC' },

  overlayTouch: { ...StyleSheet.absoluteFillObject, zIndex: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },

  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#111118',
    zIndex: 20,
    borderRightWidth: 1,
    borderRightColor: '#1C1C1E',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  sidebarLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sidebarTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  sidebarSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 1 },

  sidebarScroll: { flex: 1 },
  sidebarCategory: { marginBottom: 4 },
  sidebarCatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 11,
    gap: 10,
  },
  sidebarCatLabel: { flex: 1, fontSize: 14, fontWeight: '600' },

  sidebarScreens: { paddingLeft: 46, paddingRight: 16 },
  sidebarScreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    gap: 10,
    borderRadius: 6,
  },
  sidebarScreenLabel: { fontSize: 13, color: '#C7C7CC' },

  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
    alignItems: 'center',
  },
  sidebarFooterText: { fontSize: 11, color: '#8E8E93', fontWeight: '500' },
  sidebarFooterSub: { fontSize: 10, color: '#636366', marginTop: 2 },
});
