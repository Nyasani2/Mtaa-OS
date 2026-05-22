import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Dimensions,
  Animated,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import {
  getUnifiedRegistry,
  setRemoteApps,
} from "@/lib/apps-store/registry";
import {
  getLaunchRoute,
  getAppIcon,
  getAppColor,
} from "@/lib/apps-store/launcher";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W * 0.42;
const HERO_H = 220;

// ============================================
// MODERN APP STORE — iOS/Google Play style
// Hero banners | Featured carousel | Category grids
// ============================================

interface AppItem {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  icon?: string;
  color?: string;
  isCore?: boolean;
  isLocal?: boolean;
  installed?: boolean;
  rating?: number;
  downloads?: string;
}

const categories = [
  { id: "all", label: "All", icon: "apps" },
  { id: "system", label: "System", icon: "settings" },
  { id: "transport", label: "Transport", icon: "car" },
  { id: "finance", label: "Finance", icon: "wallet" },
  { id: "health", label: "Health", icon: "heart-pulse" },
  { id: "commerce", label: "Commerce", icon: "cart" },
  { id: "social", label: "Social", icon: "people" },
  { id: "work", label: "Work", icon: "briefcase" },
  { id: "education", label: "Education", icon: "school" },
  { id: "utility", label: "Utility", icon: "build" },
];

const heroApps = ["mtaxi", "wallet", "health", "marketplace"];

export default function AppStoreScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const fetchInstalledApps = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("user_apps")
        .select("app_id")
        .eq("user_id", user.id);
      if (error) throw error;
      setInstalledIds(new Set(data?.map((d: any) => d.app_id) || []));
    } catch (err) {
      console.error("Failed to fetch installed apps:", err);
    }
  }, [user]);

  const fetchRemoteApps = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("app_store_apps")
        .select("*")
        .eq("status", "published");
      if (error) throw error;
      setRemoteApps(data || []);
      return data || [];
    } catch (err) {
      setError("Could not load remote apps");
      return [];
    }
  }, []);

  const buildAppList = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchRemoteApps();
    await fetchInstalledApps();
    const unified = getUnifiedRegistry();
    const processed = unified.map((app: any) => ({
      ...app,
      installed: app.isCore || app.isLocal || installedIds.has(app.id),
      rating: (4 + Math.random()).toFixed(1),
      downloads: Math.floor(Math.random() * 500) + "K+",
    }));
    setApps(processed);
    setLoading(false);
  }, [fetchRemoteApps, fetchInstalledApps, installedIds]);

  useEffect(() => {
    buildAppList();
  }, [buildAppList]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await buildAppList();
    setRefreshing(false);
  }, [buildAppList]);

  const handleInstall = async (app: AppItem) => {
    if (!user) { Alert.alert("Sign In Required", "Please sign in to install apps"); return; }
    try {
      const { error } = await supabase.from("user_apps").upsert({
        user_id: user.id,
        app_id: app.id,
        installed_at: new Date().toISOString(),
        version: app.version,
      });
      if (error) throw error;
      setInstalledIds(prev => new Set([...prev, app.id]));
      Alert.alert("Installed", `${app.name} has been installed`);
    } catch (err) { Alert.alert("Error", "Failed to install app"); }
  };

  const handleLaunch = (app: AppItem) => {
    const route = getLaunchRoute(app.id);
    if (route) router.push(route as any);
    else Alert.alert("Error", "Could not launch app");
  };

  const filteredApps = activeCategory === "all"
    ? apps
    : activeCategory === "system"
    ? apps.filter(a => a.isCore)
    : apps.filter(a => a.category === activeCategory);

  const featuredApps = apps.filter(a => heroApps.includes(a.id));
  const newApps = apps.filter(a => !a.isCore).slice(0, 6);
  const topFree = apps.filter(a => !a.isCore).slice(6, 12);

  // HERO BANNER
  const renderHero = () => (
    <View style={styles.heroContainer}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {featuredApps.map((app, i) => (
          <TouchableOpacity
            key={app.id}
            style={[styles.heroCard, { backgroundColor: app.color || '#6366F1' }]}
            onPress={() => handleLaunch(app)}
          >
            <View style={styles.heroContent}>
              <Ionicons name={getAppIcon(app.id) as any} size={48} color="white" />
              <Text style={styles.heroTitle}>{app.name}</Text>
              <Text style={styles.heroDesc} numberOfLines={2}>{app.description}</Text>
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>FEATURED</Text>
              </View>
            </View>
            <Ionicons name="arrow-forward" size={24} color="white" style={styles.heroArrow} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // CATEGORY CHIPS
  const renderCategories = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryScroll}
    >
      {categories.map(cat => (
        <TouchableOpacity
          key={cat.id}
          style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
          onPress={() => setActiveCategory(cat.id)}
        >
          <Ionicons
            name={cat.icon as any}
            size={18}
            color={activeCategory === cat.id ? "white" : "#94A3B8"}
          />
          <Text style={[styles.catText, activeCategory === cat.id && styles.catTextActive]}>
            {cat.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // HORIZONTAL APP CAROUSEL (Featured / New / Top)
  const renderCarousel = (title: string, data: AppItem[]) => (
    <View style={styles.carouselSection}>
      <View style={styles.carouselHeader}>
        <Text style={styles.carouselTitle}>{title}</Text>
        <TouchableOpacity>
          <Text style={styles.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingLeft: 16 }}>
        {data.map(app => (
          <TouchableOpacity
            key={app.id}
            style={styles.appCard}
            onPress={() => app.installed ? handleLaunch(app) : handleInstall(app)}
          >
            <View style={[styles.appIconBox, { backgroundColor: (app.color || '#6366F1') + '20' }]}>
              <Ionicons name={getAppIcon(app.id) as any} size={32} color={app.color || '#6366F1'} />
            </View>
            <Text style={styles.appCardName} numberOfLines={1}>{app.name}</Text>
            <Text style={styles.appCardCategory}>{app.category}</Text>
            <View style={styles.appCardMeta}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text style={styles.appCardRating}>{app.rating}</Text>
            </View>
            {app.installed ? (
              <View style={styles.openChip}>
                <Text style={styles.openChipText}>OPEN</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.getChip} onPress={() => handleInstall(app)}>
                <Text style={styles.getChipText}>GET</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // VERTICAL LIST (for category view)
  const renderList = () => (
    <View style={{ paddingHorizontal: 16 }}>
      {filteredApps.map(app => (
        <TouchableOpacity
          key={app.id}
          style={styles.listRow}
          onPress={() => app.installed ? handleLaunch(app) : handleInstall(app)}
        >
          <View style={[styles.listIcon, { backgroundColor: (app.color || '#6366F1') + '20' }]}>
            <Ionicons name={getAppIcon(app.id) as any} size={28} color={app.color || '#6366F1'} />
          </View>
          <View style={styles.listInfo}>
            <Text style={styles.listName}>{app.name}</Text>
            <Text style={styles.listDesc} numberOfLines={1}>{app.description}</Text>
            <View style={styles.listMeta}>
              <Ionicons name="star" size={10} color="#F59E0B" />
              <Text style={styles.listRating}>{app.rating}</Text>
              <Text style={styles.listDot}>•</Text>
              <Text style={styles.listDownloads}>{app.downloads}</Text>
            </View>
          </View>
          {app.installed ? (
            <TouchableOpacity style={styles.listOpenBtn} onPress={() => handleLaunch(app)}>
              <Text style={styles.listOpenText}>OPEN</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.listGetBtn} onPress={() => handleInstall(app)}>
              <Text style={styles.listGetText}>GET</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={styles.loadingText}>Loading App Store...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Floating header */}
      <Animated.View style={[styles.floatingHeader, { opacity: headerOpacity }]}>
        <Text style={styles.floatingTitle}>App Store</Text>
      </Animated.View>

      <Animated.ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      >
        <View style={styles.mainHeader}>
          <Text style={styles.mainTitle}>App Store</Text>
          <Text style={styles.mainSubtitle}>Discover amazing apps</Text>
        </View>

        {renderHero()}
        {renderCategories()}

        {activeCategory === "all" ? (
          <>
            {renderCarousel("New & Noteworthy", newApps)}
            {renderCarousel("Top Free", topFree)}
            <Text style={styles.sectionHeader}>All Apps</Text>
            {renderList()}
          </>
        ) : (
          <>
            <Text style={styles.sectionHeader}>
              {categories.find(c => c.id === activeCategory)?.label} Apps
            </Text>
            {renderList()}
          </>
        )}

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#050816" },
  loadingText: { color: "#94A3B8", marginTop: 12, fontSize: 14 },

  // Floating header
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: "#050816E6",
    zIndex: 100,
    justifyContent: "flex-end",
    paddingBottom: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  floatingTitle: { fontSize: 18, fontWeight: "bold", color: "white" },

  // Main header
  mainHeader: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  mainTitle: { fontSize: 32, fontWeight: "bold", color: "white" },
  mainSubtitle: { fontSize: 14, color: "#94A3B8", marginTop: 4 },

  // Hero
  heroContainer: { marginTop: 8 },
  heroCard: {
    width: SCREEN_W - 48,
    height: HERO_H,
    borderRadius: 24,
    marginRight: 12,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroContent: { flex: 1 },
  heroTitle: { fontSize: 28, fontWeight: "bold", color: "white", marginTop: 8 },
  heroDesc: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 6, lineHeight: 20 },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 12,
  },
  heroBadgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
  heroArrow: { opacity: 0.6 },

  // Categories
  categoryScroll: { paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    marginRight: 8,
  },
  catChipActive: { backgroundColor: "#6366F1" },
  catText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  catTextActive: { color: "white" },

  // Carousel
  carouselSection: { marginTop: 24 },
  carouselHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  carouselTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  seeAll: { color: "#6366F1", fontSize: 14, fontWeight: "600" },
  appCard: {
    width: CARD_W,
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 14,
    marginRight: 10,
    alignItems: "center",
  },
  appIconBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  appCardName: { color: "white", fontSize: 14, fontWeight: "600", textAlign: "center" },
  appCardCategory: { color: "#94A3B8", fontSize: 11, marginTop: 2 },
  appCardMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  appCardRating: { color: "#94A3B8", fontSize: 12 },
  getChip: {
    backgroundColor: "#6366F120",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 10,
  },
  getChipText: { color: "#6366F1", fontSize: 12, fontWeight: "bold" },
  openChip: {
    backgroundColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 10,
  },
  openChipText: { color: "#94A3B8", fontSize: 12, fontWeight: "bold" },

  // List
  sectionHeader: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  listIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  listInfo: { flex: 1, marginLeft: 14 },
  listName: { color: "white", fontSize: 15, fontWeight: "600" },
  listDesc: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  listMeta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  listRating: { color: "#94A3B8", fontSize: 11 },
  listDot: { color: "#64748B", fontSize: 11 },
  listDownloads: { color: "#64748B", fontSize: 11 },
  listGetBtn: {
    backgroundColor: "#6366F120",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  listGetText: { color: "#6366F1", fontSize: 12, fontWeight: "bold" },
  listOpenBtn: {
    backgroundColor: "#334155",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
  },
  listOpenText: { color: "#94A3B8", fontSize: 12, fontWeight: "bold" },
});
