import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase/client";

const WORKSPACES = [
  { key: "video", label: "Video Studio", icon: "video-camera", color: "#E53935", route: "/studio/camera" },
  { key: "music", label: "Music Studio", icon: "music", color: "#9C27B0", route: "/studio/music-studio" },
  { key: "podcast", label: "Podcast Studio", icon: "microphone", color: "#FF9800", route: "/studio/podcast-studio" },
  { key: "broadcast", label: "Broadcast Studio", icon: "broadcast-tower", color: "#2196F3", route: "/studio/broadcast-console" },
  { key: "education", label: "Education Studio", icon: "graduation-cap", color: "#4CAF50", route: "/studio/education-studio" },
  { key: "live", label: "Live Studio", icon: "wifi", color: "#f44336", route: "/studio/live-broadcast" },
];

interface CreatorStats {
  total_content: number; total_subscribers: number; total_revenue: number;
  total_views: number; wallet_balance: number;
}

export default function UnifiedStudioScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [recentContent, setRecentContent] = useState<any[]>([]);

  useEffect(() => { loadStats(); loadRecent(); }, []);

  async function loadStats() {
    if (!user) return;
    const { data: videos } = await supabase.from("studio_videos").select("views_count, likes_count").eq("creator_id", user.id);
    const { data: subs } = await supabase.from("studio_subscriptions").select("id").eq("creator_id", user.id);
    const { data: wallet } = await supabase.from("wallets").select("balance").eq("user_id", user.id).single();
    const totalViews = (videos || []).reduce((sum, v) => sum + (v.views_count || 0), 0);
    setStats({
      total_content: videos?.length || 0, total_subscribers: subs?.length || 0,
      total_revenue: 0, total_views: totalViews, wallet_balance: wallet?.balance || 0,
    });
  }

  async function loadRecent() {
    if (!user) return;
    const { data } = await supabase
      .from("studio_videos")
      .select("id, title, thumbnail_url, status, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setRecentContent(data || []);
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Studio</Text>
        <TouchableOpacity onPress={() => router.push("/studio/settings")}><Feather name="settings" size={22} color="#888" /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {stats && (
          <View style={styles.statsRow}>
            <View style={styles.statBox}><Text style={styles.statValue}>{stats.total_content}</Text><Text style={styles.statLabel}>Videos</Text></View>
            <View style={styles.statBox}><Text style={styles.statValue}>{stats.total_subscribers}</Text><Text style={styles.statLabel}>Subscribers</Text></View>
            <View style={styles.statBox}><Text style={styles.statValue}>{(stats.total_views / 1000).toFixed(1)}K</Text><Text style={styles.statLabel}>Views</Text></View>
            <View style={styles.statBox}><Text style={styles.statValue}>{stats.wallet_balance.toFixed(2)}</Text><Text style={styles.statLabel}>Wallet</Text></View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Production Workspaces</Text>
        <View style={styles.workspaceGrid}>
          {WORKSPACES.map(ws => (
            <TouchableOpacity key={ws.key} style={[styles.workspaceCard, { borderColor: ws.color }]} onPress={() => router.push(ws.route)}>
              <FontAwesome5 name={ws.icon} size={28} color={ws.color} />
              <Text style={styles.workspaceLabel}>{ws.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Shared Resources</Text>
        <View style={styles.resourceList}>
          <TouchableOpacity style={styles.resourceItem} onPress={() => router.push("/studio/content-library")}>
            <Feather name="folder" size={22} color="#E53935" /><Text style={styles.resourceText}>Content Library</Text><Feather name="chevron-right" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem} onPress={() => router.push("/studio/analytics")}>
            <Feather name="bar-chart-2" size={22} color="#E53935" /><Text style={styles.resourceText}>Analytics</Text><Feather name="chevron-right" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem} onPress={() => router.push("/wallet")}>
            <Feather name="credit-card" size={22} color="#E53935" /><Text style={styles.resourceText}>Wallet & Revenue</Text><Feather name="chevron-right" size={18} color="#888" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem} onPress={() => router.push("/studio/asis-assistant")}>
            <Ionicons name="sparkles" size={22} color="#E53935" /><Text style={styles.resourceText}>ASIS AI Assistant</Text><Feather name="chevron-right" size={18} color="#888" />
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Content</Text>
        {recentContent.length === 0 ? (
          <Text style={styles.emptyText}>No content yet. Start creating from a workspace above.</Text>
        ) : (
          recentContent.map(item => (
            <TouchableOpacity key={item.id} style={styles.contentRow} onPress={() => router.push(`/studio/video-player?id=${item.id}`)}>
              <View style={styles.contentThumb}><Feather name="play" size={18} color="#fff" /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contentTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.contentMeta}>{item.status} · {new Date(item.created_at).toLocaleDateString()}</Text>
              </View>
              <Feather name="more-vertical" size={18} color="#888" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  scroll: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  statBox: { backgroundColor: "#141414", borderRadius: 12, padding: 14, alignItems: "center", flex: 1, marginHorizontal: 4 },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "800" },
  statLabel: { color: "#888", fontSize: 11, marginTop: 4, fontWeight: "600" },
  sectionTitle: { color: "#fff", fontSize: 16, fontWeight: "700", marginBottom: 12, marginTop: 8 },
  workspaceGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  workspaceCard: { width: "48%", backgroundColor: "#141414", borderRadius: 12, padding: 20, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#222" },
  workspaceLabel: { color: "#fff", fontSize: 13, fontWeight: "600", marginTop: 10 },
  resourceList: { backgroundColor: "#141414", borderRadius: 12, overflow: "hidden" },
  resourceItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1a1a1a" },
  resourceText: { color: "#fff", fontSize: 15, flex: 1, marginLeft: 12 },
  emptyText: { color: "#888", fontSize: 14, textAlign: "center", marginVertical: 20 },
  contentRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#141414", borderRadius: 10, padding: 12, marginBottom: 8 },
  contentThumb: { width: 56, height: 40, borderRadius: 6, backgroundColor: "#222", alignItems: "center", justifyContent: "center", marginRight: 12 },
  contentTitle: { color: "#fff", fontSize: 14, fontWeight: "600" },
  contentMeta: { color: "#888", fontSize: 12, marginTop: 2 },
});
