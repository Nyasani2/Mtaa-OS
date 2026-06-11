import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

interface HealthMetric {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  icon: string;
  color: string;
}

export default function GovernmentHealthDashboard() {
  const router = useRouter();
  const { fetchGovernmentHealthMetrics } = useHealthStore();

  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadMetrics = async () => {
    const data = await fetchGovernmentHealthMetrics();
    setMetrics(data || [
      { label: "Population Covered", value: "4.2M", change: "+2.1%", trend: "up", icon: "account-group", color: "#2563eb" },
      { label: "Facilities", value: "1,847", change: "+12", trend: "up", icon: "hospital-building", color: "#8b5cf6" },
      { label: "Vaccinations", value: "2.1M", change: "+5.3%", trend: "up", icon: "needle", color: "#10b981" },
      { label: "Births Registered", value: "89,432", change: "+1.2%", trend: "up", icon: "baby-face", color: "#f59e0b" },
      { label: "Deaths Registered", value: "12,104", change: "-0.8%", trend: "down", icon: "grave-stone", color: "#ef4444" },
      { label: "Disease Outbreaks", value: "3", change: "-2", trend: "down", icon: "virus", color: "#ef4444" },
    ]);
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  };

  const modules = [
    { label: "Population Registry", icon: "people", route: "/(os)/health/government/population", color: "#2563eb" },
    { label: "Vital Statistics", icon: "stats-chart", route: "/(os)/health/government/vitals", color: "#8b5cf6" },
    { label: "Disease Surveillance", icon: "warning", route: "/(os)/health/government/surveillance", color: "#ef4444" },
    { label: "Health Facilities", icon: "business", route: "/(os)/health/government/facilities", color: "#10b981" },
    { label: "Immunization", icon: "shield-checkmark", route: "/(os)/health/government/immunization", color: "#f59e0b" },
    { label: "Regulations", icon: "document-text", route: "/(os)/health/government/regulations", color: "#6b7280" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ministry of Health</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {metrics.map((m, i) => (
            <View key={i} style={styles.metricCard}>
              <View style={[styles.metricIcon, { backgroundColor: m.color + "15" }]}>
                <MaterialCommunityIcons name={m.icon as any} size={22} color={m.color} />
              </View>
              <Text style={styles.metricValue}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <View style={styles.metricTrend}>
                <Ionicons
                  name={m.trend === "up" ? "trending-up" : m.trend === "down" ? "trending-down" : "remove"}
                  size={12}
                  color={m.trend === "up" ? "#10b981" : m.trend === "down" && m.label.includes("Deaths") ? "#10b981" : m.trend === "down" ? "#ef4444" : "#6b7280"}
                />
                <Text style={[styles.metricChange, { color: m.trend === "up" ? "#10b981" : m.trend === "down" && m.label.includes("Deaths") ? "#10b981" : m.trend === "down" ? "#ef4444" : "#6b7280" }]}>
                  {m.change}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Modules */}
        <Text style={styles.sectionTitle}>Government Modules</Text>
        <View style={styles.modulesGrid}>
          {modules.map((mod) => (
            <TouchableOpacity
              key={mod.label}
              style={styles.moduleCard}
              onPress={() => router.push(mod.route as any)}
            >
              <View style={[styles.moduleIcon, { backgroundColor: mod.color + "15" }]}>
                <Ionicons name={mod.icon as any} size={24} color={mod.color} />
              </View>
              <Text style={styles.moduleLabel}>{mod.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Alerts */}
        <View style={styles.alertCard}>
          <View style={styles.alertHeader}>
            <Ionicons name="warning" size={20} color="#ef4444" />
            <Text style={styles.alertTitle}>Active Alerts</Text>
          </View>
          <View style={styles.alertItem}>
            <View style={[styles.alertDot, { backgroundColor: "#ef4444" }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertText}>Cholera outbreak detected in 3 counties</Text>
              <Text style={styles.alertMeta}>Updated 2 hours ago</Text>
            </View>
          </View>
          <View style={styles.alertItem}>
            <View style={[styles.alertDot, { backgroundColor: "#f59e0b" }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertText}>Vaccine stock low in 12 facilities</Text>
              <Text style={styles.alertMeta}>Updated 5 hours ago</Text>
            </View>
          </View>
        </View>
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  content: { padding: 12, paddingBottom: 24 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  metricCard: {
    width: "48%", backgroundColor: "#fff", borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  metricIcon: {
    width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 10,
  },
  metricValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  metricLabel: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  metricTrend: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  metricChange: { fontSize: 11, fontWeight: "700" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10, marginTop: 4 },
  modulesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  moduleCard: {
    width: "31%", backgroundColor: "#fff", borderRadius: 14, padding: 14,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  moduleIcon: {
    width: 44, height: 44, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  moduleLabel: { fontSize: 11, fontWeight: "600", color: "#374151", textAlign: "center" },
  alertCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  alertHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  alertTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  alertItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  alertDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  alertText: { fontSize: 13, fontWeight: "600", color: "#374151" },
  alertMeta: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
});
