import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

interface Outbreak {
  id: string;
  disease: string;
  severity: "low" | "moderate" | "high" | "critical";
  affected_counties: string[];
  cases: number;
  deaths: number;
  started_at: string;
  status: "active" | "contained" | "resolved";
  response_level: string;
}

const SEVERITY_COLORS: Record<string, string> = {
  low: "#10b981",
  moderate: "#f59e0b",
  high: "#ef4444",
  critical: "#7c3aed",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#ef4444",
  contained: "#f59e0b",
  resolved: "#10b981",
};

export default function DiseaseSurveillance() {
  const router = useRouter();
  const { fetchDiseaseSurveillance } = useHealthStore();

  const [outbreaks, setOutbreaks] = useState<Outbreak[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "contained" | "resolved">("all");

  const loadData = async () => {
    const data = await fetchDiseaseSurveillance();
    setOutbreaks(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filtered = filter === "all" ? outbreaks : outbreaks.filter((o) => o.status === filter);

  const stats = {
    active: outbreaks.filter((o) => o.status === "active").length,
    totalCases: outbreaks.reduce((sum, o) => sum + o.cases, 0),
    totalDeaths: outbreaks.reduce((sum, o) => sum + o.deaths, 0),
    countiesAffected: new Set(outbreaks.flatMap((o) => o.affected_counties)).size,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disease Surveillance</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="add-circle" size={26} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>{stats.active}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.totalCases.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total Cases</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#6b7280" }]}>{stats.totalDeaths.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Deaths</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.countiesAffected}</Text>
            <Text style={styles.statLabel}>Counties</Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(["all", "active", "contained", "resolved"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Outbreaks */}
        {filtered.map((outbreak) => (
          <View key={outbreak.id} style={styles.outbreakCard}>
            <View style={styles.outbreakHeader}>
              <View style={styles.outbreakTitleRow}>
                <MaterialCommunityIcons name="virus" size={20} color={SEVERITY_COLORS[outbreak.severity]} />
                <Text style={styles.outbreakName}>{outbreak.disease}</Text>
              </View>
              <View style={styles.outbreakBadges}>
                <View style={[styles.severityBadge, { backgroundColor: SEVERITY_COLORS[outbreak.severity] + "20" }]}>
                  <Text style={[styles.severityText, { color: SEVERITY_COLORS[outbreak.severity] }]}>
                    {outbreak.severity.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[outbreak.status] + "20" }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[outbreak.status] }]}>
                    {outbreak.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.outbreakStats}>
              <View style={styles.outbreakStat}>
                <Text style={styles.outbreakStatValue}>{outbreak.cases.toLocaleString()}</Text>
                <Text style={styles.outbreakStatLabel}>Cases</Text>
              </View>
              <View style={styles.outbreakStat}>
                <Text style={[styles.outbreakStatValue, { color: "#6b7280" }]}>{outbreak.deaths.toLocaleString()}</Text>
                <Text style={styles.outbreakStatLabel}>Deaths</Text>
              </View>
              <View style={styles.outbreakStat}>
                <Text style={styles.outbreakStatValue}>{outbreak.affected_counties.length}</Text>
                <Text style={styles.outbreakStatLabel}>Counties</Text>
              </View>
              <View style={styles.outbreakStat}>
                <Text style={styles.outbreakStatValue}>{outbreak.response_level}</Text>
                <Text style={styles.outbreakStatLabel}>Response</Text>
              </View>
            </View>
            <Text style={styles.outbreakDate}>Started: {new Date(outbreak.started_at).toLocaleDateString()}</Text>
            <Text style={styles.outbreakCounties}>Affected: {outbreak.affected_counties.join(", ")}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  content: { padding: 12, paddingBottom: 24 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 10,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 16, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  filterScroll: { marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#e5e7eb",
  },
  filterChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  filterChipText: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  outbreakCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: "#ef4444",
  },
  outbreakHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  outbreakTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  outbreakName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  outbreakBadges: { flexDirection: "row", gap: 6 },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText: { fontSize: 9, fontWeight: "800" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 9, fontWeight: "800" },
  outbreakStats: { flexDirection: "row", gap: 16, marginBottom: 10 },
  outbreakStat: { flex: 1, alignItems: "center" },
  outbreakStatValue: { fontSize: 16, fontWeight: "800", color: "#111827" },
  outbreakStatLabel: { fontSize: 10, color: "#6b7280", marginTop: 2 },
  outbreakDate: { fontSize: 11, color: "#9ca3af" },
  outbreakCounties: { fontSize: 11, color: "#6b7280", marginTop: 4 },
});
