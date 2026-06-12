// app/(os)/pulse/(tabs)/index.tsx
// MTAA Pulse — Home Tab

import React, { useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Image, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { usePulseHome } from "@/domains/pulse/hooks/usePulseHome";
import { usePulseStore } from "@/domains/pulse/state/store";
import {
  TrendingUp, AlertTriangle, Zap, Users, ChevronRight,
  Flame, MapPin, Briefcase, GraduationCap, Globe, Africa
} from "lucide-react-native";

const FEED_TABS = [
  { key: "for_you", label: "For You", icon: Zap },
  { key: "trending", label: "Trending", icon: Flame },
  { key: "business", label: "Business", icon: Briefcase },
  { key: "learning", label: "Learning", icon: GraduationCap },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "africa", label: "Africa", icon: Africa },
  { key: "global", label: "Global", icon: Globe },
  { key: "nearby", label: "Nearby", icon: MapPin },
] as const;

export default function PulseHomeScreen() {
  const router = useRouter();
  const { trending, alerts, recommendations, topics, creators, isLoading, error, refresh } = usePulseHome();
  const activeTab = usePulseStore((s) => s.activeTab);
  const setActiveTab = usePulseStore((s) => s.setActiveTab);

  const onRefresh = useCallback(() => {
    refresh();
  }, [refresh]);

  if (isLoading && trending.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading Pulse...</Text>
      </View>
    );
  }

  if (error && trending.length === 0) {
    return (
      <View style={styles.center}>
        <AlertTriangle size={40} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor="#FF6B35" />}
    >
      {/* Feed Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {FEED_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <tab.icon size={14} color={activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.5)"} />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Trending Section */}
      {trending.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <TrendingUp size={18} color="#FF6B35" />
              <Text style={styles.sectionTitle}>Trending Now</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(os)/pulse/(tabs)/trending")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}>
            {trending.slice(0, 5).map((item, i) => (
              <TouchableOpacity key={item.id} style={styles.trendCard} onPress={() => {}}>
                <View style={styles.trendRank}>
                  <Text style={styles.trendRankText}>#{item.rank}</Text>
                </View>
                <Text style={styles.trendName} numberOfLines={2}>{item.entity_name}</Text>
                <Text style={styles.trendMeta}>{item.entity_type} • {item.view_count.toLocaleString()} views</Text>
                {item.velocity > 0 && (
                  <View style={styles.velocityBadge}>
                    <Flame size={10} color="#FF6B35" />
                    <Text style={styles.velocityText}>+{item.velocity}%</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Alerts Section */}
      {alerts.filter((a) => !a.is_dismissed).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <AlertTriangle size={18} color="#FBBF24" />
              <Text style={styles.sectionTitle}>Alerts</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(os)/pulse/(tabs)/alerts")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {alerts.filter((a) => !a.is_dismissed).slice(0, 3).map((alert) => (
            <TouchableOpacity key={alert.id} style={[styles.alertCard, getSeverityStyle(alert.severity)]}>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDesc} numberOfLines={2}>{alert.description}</Text>
                <Text style={styles.alertMeta}>{alert.alert_type} • {alert.region || "All regions"}</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Topics Section */}
      {topics.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Zap size={18} color="#34D399" />
              <Text style={styles.sectionTitle}>Hot Topics</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(os)/pulse/(tabs)/topics")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.topicGrid}>
            {topics.slice(0, 6).map((topic) => (
              <TouchableOpacity key={topic.id} style={styles.topicChip}>
                <Text style={styles.topicName}>#{topic.name}</Text>
                <Text style={styles.topicCount}>{topic.post_count.toLocaleString()} posts</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Users size={18} color="#818CF8" />
              <Text style={styles.sectionTitle}>Recommended For You</Text>
            </View>
          </View>
          {recommendations.slice(0, 3).map((rec) => (
            <TouchableOpacity key={rec.id} style={styles.recCard}>
              <View style={styles.recAvatar}>
                <Text style={styles.recAvatarText}>{rec.entity_name.charAt(0)}</Text>
              </View>
              <View style={styles.recContent}>
                <Text style={styles.recName}>{rec.entity_name}</Text>
                <Text style={styles.recReason}>{rec.reason}</Text>
              </View>
              <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Top Creators */}
      {creators.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Users size={18} color="#F472B6" />
              <Text style={styles.sectionTitle}>Top Creators</Text>
            </View>
            <TouchableOpacity onPress={() => router.push("/(os)/pulse/creators")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontal}>
            {creators.slice(0, 5).map((creator) => (
              <TouchableOpacity key={creator.id} style={styles.creatorCard}>
                <View style={styles.creatorAvatar}>
                  <Text style={styles.creatorAvatarText}>{creator.creator_id.charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.creatorScore}>{creator.overall_score}</Text>
                <Text style={styles.creatorMeta}>{creator.follower_count.toLocaleString()} followers</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Quick Links */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Explore</Text>
        <View style={styles.quickGrid}>
          <QuickLink icon={Flame} label="Events" route="events" color="#FF6B35" />
          <QuickLink icon={Users} label="Creators" route="creators" color="#F472B6" />
          <QuickLink icon={Briefcase} label="Businesses" route="businesses" color="#60A5FA" />
          <QuickLink icon={Zap} label="Communities" route="communities" color="#34D399" />
          <QuickLink icon={TrendingUp} label="Analytics" route="analytics" color="#A78BFA" />
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function QuickLink({ icon: Icon, label, route, color }: any) {
  const router = useRouter();
  return (
    <TouchableOpacity style={styles.quickCard} onPress={() => router.push(`/(os)/pulse/${route}` as any)}>
      <View style={[styles.quickIcon, { backgroundColor: `${color}20` }]}>
        <Icon size={22} color={color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function getSeverityStyle(severity: string) {
  switch (severity) {
    case "emergency": return { borderLeftColor: "#FF3B30", borderLeftWidth: 3 };
    case "critical": return { borderLeftColor: "#FF6B35", borderLeftWidth: 3 };
    case "warning": return { borderLeftColor: "#FBBF24", borderLeftWidth: 3 };
    default: return { borderLeftColor: "#60A5FA", borderLeftWidth: 3 };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f0f1a" },
  loadingText: { color: "rgba(255,255,255,0.5)", marginTop: 12, fontSize: 14 },
  errorText: { color: "#FF3B30", marginTop: 12, fontSize: 14, textAlign: "center", paddingHorizontal: 32 },
  retryBtn: { marginTop: 16, backgroundColor: "#FF6B35", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: "#fff", fontWeight: "700", fontSize: 14 },

  tabBar: { maxHeight: 50, marginBottom: 8 },
  tabBarContent: { paddingHorizontal: 12, gap: 8 },
  tabBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)",
  },
  tabBtnActive: { backgroundColor: "#FF6B35" },
  tabText: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#fff" },

  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  seeAll: { fontSize: 12, color: "#FF6B35", fontWeight: "600" },

  horizontal: { marginHorizontal: -16, paddingHorizontal: 16 },
  trendCard: {
    width: 160, backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16, padding: 14, marginRight: 12,
  },
  trendRank: { backgroundColor: "rgba(255,107,53,0.2)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: "flex-start", marginBottom: 8 },
  trendRankText: { color: "#FF6B35", fontSize: 11, fontWeight: "700" },
  trendName: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  trendMeta: { color: "rgba(255,255,255,0.4)", fontSize: 11 },
  velocityBadge: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  velocityText: { color: "#FF6B35", fontSize: 11, fontWeight: "600" },

  alertCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  alertContent: { flex: 1 },
  alertTitle: { color: "#fff", fontSize: 14, fontWeight: "600", marginBottom: 4 },
  alertDesc: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 4 },
  alertMeta: { color: "rgba(255,255,255,0.3)", fontSize: 11 },

  topicGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  topicChip: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  topicName: { color: "#34D399", fontSize: 13, fontWeight: "600" },
  topicCount: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 },

  recCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12, padding: 14, marginBottom: 8,
  },
  recAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#818CF8", justifyContent: "center", alignItems: "center",
  },
  recAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  recContent: { flex: 1, marginLeft: 12 },
  recName: { color: "#fff", fontSize: 14, fontWeight: "600" },
  recReason: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 },

  creatorCard: {
    width: 100, backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16, padding: 12, marginRight: 12, alignItems: "center",
  },
  creatorAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: "#F472B6", justifyContent: "center", alignItems: "center",
    marginBottom: 8,
  },
  creatorAvatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  creatorScore: { color: "#fff", fontSize: 16, fontWeight: "700" },
  creatorMeta: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 },

  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: {
    width: "30%", backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16, padding: 14, alignItems: "center",
  },
  quickIcon: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  quickLabel: { color: "#fff", fontSize: 12, fontWeight: "600", textAlign: "center" },
});
