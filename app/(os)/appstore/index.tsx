import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import {
  getUnifiedRegistry,
  listInstallableApps,
  listSystemApps,
  isSystemApp,
  setRemoteApps,
  getRemoteApps,
} from "@/lib/mtaa/appstore/registry";
import {
  getLaunchRoute,
  canLaunch,
  getAppIcon,
  getAppColor,
} from "@/lib/mtaa/appstore/launcher";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Ionicons } from "@expo/vector-icons";

// ============================================
// UNIFIED APP STORE UI
// Merges: Local manifests + Remote Supabase apps + System apps
// ============================================

interface AppItem {
  id: string;
  name: string;
  version: string;
  category: string;
  description: string;
  status: string;
  installable: boolean;
  isSystem?: boolean;
  isLocal?: boolean;
  installed?: boolean;
  icon_url?: string;
}

export default function AppStoreScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [apps, setApps] = useState<AppItem[]>([]);
  const [installedIds, setInstalledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Fetch user's installed apps from Supabase
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

  // Fetch remote apps from Supabase app_store_apps table
  const fetchRemoteApps = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("app_store_apps")
        .select("*")
        .eq("status", "published");

      if (error) throw error;

      // Update the registry with remote apps
      setRemoteApps(data || []);
      return data || [];
    } catch (err) {
      console.error("Failed to fetch remote apps:", err);
      setError("Could not load remote apps");
      return [];
    }
  }, []);

  // Build unified app list
  const buildAppList = useCallback(async () => {
    setLoading(true);
    setError(null);

    // 1. Fetch remote apps
    const remoteApps = await fetchRemoteApps();

    // 2. Fetch installed status
    await fetchInstalledApps();

    // 3. Get unified registry (local + system + remote)
    const unified = getUnifiedRegistry();

    // 4. Mark installed status
    const processed = unified.map((app: any) => ({
      ...app,
      installed: isSystemApp(app.id) || installedIds.has(app.id) || app.isLocal,
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

  // Install app
  const handleInstall = async (app: AppItem) => {
    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to install apps");
      return;
    }

    try {
      // For local apps, just mark as installed in user_apps
      const { error } = await supabase.from("user_apps").upsert({
        user_id: user.id,
        app_id: app.id,
        installed_at: new Date().toISOString(),
        version: app.version,
      });

      if (error) throw error;

      setInstalledIds(prev => new Set([...prev, app.id]));
      Alert.alert("Installed", `${app.name} has been installed`);
    } catch (err) {
      Alert.alert("Error", "Failed to install app");
    }
  };

  // Uninstall app
  const handleUninstall = async (app: AppItem) => {
    if (app.isSystem) {
      Alert.alert("System App", "System apps cannot be uninstalled");
      return;
    }

    try {
      const { error } = await supabase
        .from("user_apps")
        .delete()
        .eq("user_id", user?.id)
        .eq("app_id", app.id);

      if (error) throw error;

      setInstalledIds(prev => {
        const next = new Set(prev);
        next.delete(app.id);
        return next;
      });
      Alert.alert("Uninstalled", `${app.name} has been removed`);
    } catch (err) {
      Alert.alert("Error", "Failed to uninstall app");
    }
  };

  // Launch app
  const handleLaunch = (app: AppItem) => {
    const route = getLaunchRoute(app.id);
    if (route) {
      router.push(route as any);
    } else {
      Alert.alert("Error", "Could not launch app");
    }
  };

  // Filter by category
  const categories = ["all", "system", "social", "logistics", "finance", "health"];
  const filteredApps = activeCategory === "all"
    ? apps
    : activeCategory === "system"
    ? apps.filter(a => a.isSystem)
    : apps.filter(a => a.category === activeCategory);

  const renderAppCard = (app: AppItem) => {
    const isInstalled = app.installed || app.isSystem;
    const iconName = getAppIcon(app.id);
    const color = getAppColor(app.id);

    return (
      <View key={app.id} style={styles.card}>
        <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
          {app.icon_url ? (
            <Image source={{ uri: app.icon_url }} style={styles.iconImage} />
          ) : (
            <Ionicons name={iconName as any} size={32} color={color} />
          )}
        </View>

        <View style={styles.cardContent}>
          <Text style={styles.appName}>{app.name}</Text>
          <Text style={styles.appVersion}>v{app.version} • {app.category}</Text>
          <Text style={styles.appDesc} numberOfLines={2}>{app.description}</Text>

          {app.isSystem && (
            <View style={styles.badgeSystem}>
              <Text style={styles.badgeText}>SYSTEM</Text>
            </View>
          )}
          {app.isLocal && !app.isSystem && (
            <View style={styles.badgeLocal}>
              <Text style={styles.badgeText}>BUNDLED</Text>
            </View>
          )}
        </View>

        <View style={styles.actions}>
          {isInstalled ? (
            <>
              <TouchableOpacity
                style={[styles.button, styles.launchButton]}
                onPress={() => handleLaunch(app)}
              >
                <Text style={styles.launchText}>OPEN</Text>
              </TouchableOpacity>
              {!app.isSystem && (
                <TouchableOpacity
                  style={[styles.button, styles.uninstallButton]}
                  onPress={() => handleUninstall(app)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.installButton]}
              onPress={() => handleInstall(app)}
            >
              <Text style={styles.installText}>GET</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

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
      <View style={styles.header}>
        <Text style={styles.title}>App Store</Text>
        <Text style={styles.subtitle}>{apps.length} apps available</Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip,
              activeCategory === cat && styles.categoryChipActive,
            ]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text
              style={[
                styles.categoryText,
                activeCategory === cat && styles.categoryTextActive,
              ]}
            >
              {cat.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={buildAppList}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* System Apps Section */}
        {activeCategory === "all" || activeCategory === "system" ? (
          <>
            <Text style={styles.sectionTitle}>System Apps</Text>
            {listSystemApps().map(renderAppCard)}
          </>
        ) : null}

        {/* Installable Apps Section */}
        <Text style={styles.sectionTitle}>
          {activeCategory === "all" ? "Available Apps" : `${activeCategory} Apps`}
        </Text>
        {filteredApps.filter(a => !a.isSystem).length === 0 ? (
          <Text style={styles.emptyText}>No apps in this category</Text>
        ) : (
          filteredApps.filter(a => !a.isSystem).map(renderAppCard)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#050816",
  },
  loadingText: {
    color: "#94A3B8",
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    marginTop: 4,
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 8,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: "#6366F1",
  },
  categoryText: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "white",
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginTop: 16,
    marginBottom: 12,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  iconImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  cardContent: {
    flex: 1,
  },
  appName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  appVersion: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 2,
  },
  appDesc: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    lineHeight: 18,
  },
  badgeSystem: {
    backgroundColor: "#10B98130",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  badgeLocal: {
    backgroundColor: "#6366F130",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#94A3B8",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  installButton: {
    backgroundColor: "#6366F1",
  },
  launchButton: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
  },
  uninstallButton: {
    backgroundColor: "#1E293B",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 10,
  },
  installText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 13,
  },
  launchText: {
    color: "#6366F1",
    fontWeight: "bold",
    fontSize: 13,
  },
  emptyText: {
    color: "#64748B",
    textAlign: "center",
    marginTop: 20,
    fontSize: 14,
  },
  errorBanner: {
    backgroundColor: "#EF444420",
    padding: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
  },
  retryText: {
    color: "#6366F1",
    fontWeight: "bold",
    fontSize: 13,
  },
});
