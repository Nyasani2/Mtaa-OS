import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { APP_REGISTRY, searchApps, getInstalledApps, getInstallableApps } from "@/lib/mtaa/appstore/unified-registry";
import { installApp, uninstallApp } from "@/lib/mtaa/appstore/install-lifecycle";
import { Ionicons } from "@expo/vector-icons";

export default function AppStoreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"discover" | "installed" | "updates">("discover");
  const [installing, setInstalling] = useState<string | null>(null);

  const filtered = search ? searchApps(search) : activeTab === "installed" ? getInstalledApps() : getInstallableApps();

  const handleInstall = async (appId: string) => {
    setInstalling(appId);
    const result = await installApp(appId);
    setInstalling(null);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleUninstall = async (appId: string) => {
    const result = await uninstallApp(appId);
    if (!result.success) {
      alert(result.error);
    }
  };

  const handleLaunch = (route: string) => {
    router.push(route as any);
  };

  const categories = ["All", "Finance", "Transport", "Social", "Commerce", "Work", "Education", "Health", "Utility"];
  const [activeCategory, setActiveCategory] = useState("All");

  const categoryFiltered = activeCategory === "All" ? filtered : filtered.filter((a) => a.category === activeCategory);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AppStore</Text>
        <TouchableOpacity style={styles.profileBtn}>
          <Ionicons name="person-circle" size={32} color="#6366F1" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#64748B" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search apps..."
          placeholderTextColor="#64748B"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.tabs}>
        {(["discover", "installed", "updates"] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, activeTab === t && styles.tabActive]}
            onPress={() => setActiveTab(t)}
          >
            <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "discover" && !search && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryBar}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <FlatList
        data={categoryFiltered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.appCard}>
            <View style={[styles.appIcon, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon as any} size={28} color="#fff" />
            </View>
            <View style={styles.appInfo}>
              <Text style={styles.appName}>{item.name}</Text>
              <Text style={styles.appDesc} numberOfLines={1}>{item.description}</Text>
              <View style={styles.appMeta}>
                <Text style={styles.appRating}>★ {item.rating}</Text>
                <Text style={styles.appSize}>{item.size}</Text>
              </View>
            </View>
            <View style={styles.appActions}>
              {item.isInstalled || item.isOSApp ? (
                <>
                  <TouchableOpacity style={styles.launchBtn} onPress={() => handleLaunch(item.route)}>
                    <Text style={styles.launchText}>Open</Text>
                  </TouchableOpacity>
                  {!item.isOSApp && (
                    <TouchableOpacity style={styles.uninstallBtn} onPress={() => handleUninstall(item.id)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TouchableOpacity
                  style={[styles.installBtn, installing === item.id && styles.installingBtn]}
                  onPress={() => handleInstall(item.id)}
                  disabled={installing === item.id}
                >
                  <Text style={styles.installText}>
                    {installing === item.id ? "..." : "Get"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No apps found</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 28, fontWeight: "800" },
  profileBtn: { width: 40, height: 40, justifyContent: "center", alignItems: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a1a", marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  searchInput: { flex: 1, color: "#fff", fontSize: 15, marginLeft: 8 },
  tabs: { flexDirection: "row", justifyContent: "center", gap: 24, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  tab: { paddingHorizontal: 16, paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: "#6366F1" },
  tabText: { color: "#64748B", fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: "#6366F1" },
  categoryBar: { paddingHorizontal: 16, marginBottom: 12 },
  categoryChip: { backgroundColor: "#1a1a1a", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  categoryChipActive: { backgroundColor: "#6366F1" },
  categoryText: { color: "#94A3B8", fontSize: 13 },
  categoryTextActive: { color: "#fff", fontWeight: "600" },
  appCard: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  appIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  appInfo: { flex: 1, marginLeft: 12 },
  appName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  appDesc: { color: "#64748B", fontSize: 13, marginTop: 2 },
  appMeta: { flexDirection: "row", gap: 12, marginTop: 4 },
  appRating: { color: "#F59E0B", fontSize: 12, fontWeight: "600" },
  appSize: { color: "#64748B", fontSize: 12 },
  appActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  launchBtn: { backgroundColor: "#1a1a1a", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  launchText: { color: "#6366F1", fontSize: 14, fontWeight: "700" },
  installBtn: { backgroundColor: "#6366F1", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  installingBtn: { backgroundColor: "#334155" },
  installText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  uninstallBtn: { padding: 8 },
  emptyText: { color: "#64748B", textAlign: "center", marginTop: 40, fontSize: 15 },
});
