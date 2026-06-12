// app/(os)/pulse/(tabs)/trending.tsx
// MTAA Pulse — Trending Tab

import React, { useEffect } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator
} from "react-native";
import { usePulseStore } from "@/domains/pulse/state/store";
import { pulseService } from "@/domains/pulse/services/pulseService";
import { TrendingUp, Flame, ChevronUp, ChevronDown, Minus } from "lucide-react-native";

const PERIODS = [
  { key: "hourly", label: "1H" },
  { key: "daily", label: "24H" },
  { key: "weekly", label: "7D" },
  { key: "monthly", label: "30D" },
] as const;

export default function PulseTrendingScreen() {
  const store = usePulseStore();
  const [period, setPeriod] = React.useState<PulsePeriod>("daily");
  const [loading, setLoading] = React.useState(false);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const trends = await pulseService.getTrends({ period, limit: 50 });
      store.setTrending(trends);
    } catch (e: any) {
      console.error("Failed to load trends:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrends();
  }, [period]);

  const trends = store.trending;

  return (
    <View style={styles.container}>
      {/* Period Filter */}
      <View style={styles.periodBar}>
        {PERIODS.map((p) => (
          <TouchableOpacity
            key={p.key}
            style={[styles.periodBtn, period === p.key && styles.periodBtnActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && trends.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={loading} onRefresh={loadTrends} tintColor="#FF6B35" />}
          showsVerticalScrollIndicator={false}
        >
          {trends.map((item, index) => (
            <View key={item.id} style={styles.trendRow}>
              <Text style={styles.rank}>#{item.rank}</Text>
              <View style={styles.trendInfo}>
                <Text style={styles.trendName}>{item.entity_name}</Text>
                <Text style={styles.trendMeta}>{item.entity_type} • {item.view_count.toLocaleString()} views • {item.engagement_count.toLocaleString()} engagements</Text>
              </View>
              <View style={styles.trendScore}>
                {item.velocity > 0 ? (
                  <View style={styles.changeUp}>
                    <ChevronUp size={14} color="#34D399" />
                    <Text style={styles.changeTextUp}>+{item.velocity}%</Text>
                  </View>
                ) : item.velocity < 0 ? (
                  <View style={styles.changeDown}>
                    <ChevronDown size={14} color="#FF3B30" />
                    <Text style={styles.changeTextDown}>{item.velocity}%</Text>
                  </View>
                ) : (
                  <View style={styles.changeFlat}>
                    <Minus size={14} color="rgba(255,255,255,0.3)" />
                    <Text style={styles.changeTextFlat}>—</Text>
                  </View>
                )}
                <Text style={styles.scoreText}>{item.score.toFixed(1)}</Text>
              </View>
            </View>
          ))}
          {trends.length === 0 && (
            <View style={styles.empty}>
              <Flame size={40} color="rgba(255,255,255,0.2)" />
              <Text style={styles.emptyText}>No trends yet</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

type PulsePeriod = "hourly" | "daily" | "weekly" | "monthly";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  periodBar: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
  },
  periodBtn: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: "rgba(255,255,255,0.05)",
  },
  periodBtnActive: { backgroundColor: "#FF6B35" },
  periodText: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "600" },
  periodTextActive: { color: "#fff" },

  trendRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.04)",
  },
  rank: { width: 36, color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: "700" },
  trendInfo: { flex: 1 },
  trendName: { color: "#fff", fontSize: 15, fontWeight: "600", marginBottom: 2 },
  trendMeta: { color: "rgba(255,255,255,0.4)", fontSize: 12 },
  trendScore: { alignItems: "flex-end" },
  changeUp: { flexDirection: "row", alignItems: "center", gap: 2 },
  changeTextUp: { color: "#34D399", fontSize: 12, fontWeight: "600" },
  changeDown: { flexDirection: "row", alignItems: "center", gap: 2 },
  changeTextDown: { color: "#FF3B30", fontSize: 12, fontWeight: "600" },
  changeFlat: { flexDirection: "row", alignItems: "center", gap: 2 },
  changeTextFlat: { color: "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: "600" },
  scoreText: { color: "rgba(255,255,255,0.3)", fontSize: 11, marginTop: 2 },

  empty: { alignItems: "center", marginTop: 80 },
  emptyText: { color: "rgba(255,255,255,0.3)", fontSize: 14, marginTop: 12 },
});
