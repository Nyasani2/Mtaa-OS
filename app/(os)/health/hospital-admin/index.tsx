import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

interface BedStats {
  total: number;
  occupied: number;
  available: number;
  maintenance: number;
}

interface AdmissionStats {
  today: number;
  week: number;
  month: number;
  avgStay: number;
}

export default function HospitalAdminDashboard() {
  const router = useRouter();
  const { fetchHospitalStats, isLoading } = useHealthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [bedStats, setBedStats] = useState<BedStats>({ total: 120, occupied: 87, available: 28, maintenance: 5 });
  const [admissionStats, setAdmissionStats] = useState<AdmissionStats>({ today: 12, week: 78, month: 312, avgStay: 4.2 });

  const loadStats = async () => {
    const stats = await fetchHospitalStats();
    if (stats) {
      setBedStats(stats.beds);
      setAdmissionStats(stats.admissions);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const occupancyRate = Math.round((bedStats.occupied / bedStats.total) * 100);

  const quickActions = [
    { label: "Bed Mgmt", icon: "bed", route: "/(os)/health/hospital-admin/beds", color: "#2563eb" },
    { label: "Staff", icon: "people", route: "/(os)/health/hospital-admin/staff", color: "#8b5cf6" },
    { label: "Admissions", icon: "log-in", route: "/(os)/health/hospital-admin/admissions", color: "#10b981" },
    { label: "Discharges", icon: "log-out", route: "/(os)/health/hospital-admin/discharges", color: "#f59e0b" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hospital Admin</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="notifications-outline" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Bed Occupancy */}
        <View style={styles.occupancyCard}>
          <View style={styles.occupancyHeader}>
            <Text style={styles.occupancyTitle}>Bed Occupancy</Text>
            <Text style={[styles.occupancyRate, { color: occupancyRate > 85 ? "#ef4444" : occupancyRate > 70 ? "#f59e0b" : "#10b981" }]}>
              {occupancyRate}%
            </Text>
          </View>
          <View style={styles.occupancyBar}>
            <View style={[styles.occupancyFill, { width: `${occupancyRate}%`, backgroundColor: occupancyRate > 85 ? "#ef4444" : occupancyRate > 70 ? "#f59e0b" : "#10b981" }]} />
          </View>
          <View style={styles.bedStatsRow}>
            <View style={styles.bedStat}>
              <Text style={styles.bedStatValue}>{bedStats.total}</Text>
              <Text style={styles.bedStatLabel}>Total</Text>
            </View>
            <View style={styles.bedStat}>
              <Text style={[styles.bedStatValue, { color: "#ef4444" }]}>{bedStats.occupied}</Text>
              <Text style={styles.bedStatLabel}>Occupied</Text>
            </View>
            <View style={styles.bedStat}>
              <Text style={[styles.bedStatValue, { color: "#10b981" }]}>{bedStats.available}</Text>
              <Text style={styles.bedStatLabel}>Available</Text>
            </View>
            <View style={styles.bedStat}>
              <Text style={[styles.bedStatValue, { color: "#6b7280" }]}>{bedStats.maintenance}</Text>
              <Text style={styles.bedStatLabel}>Maint</Text>
            </View>
          </View>
        </View>

        {/* Admission Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-today" size={24} color="#2563eb" />
            <Text style={styles.statValue}>{admissionStats.today}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-week" size={24} color="#8b5cf6" />
            <Text style={styles.statValue}>{admissionStats.week}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="calendar-month" size={24} color="#10b981" />
            <Text style={styles.statValue}>{admissionStats.month}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{admissionStats.avgStay}d</Text>
            <Text style={styles.statLabel}>Avg Stay</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              style={styles.actionCard}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: action.color + "15" }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Revenue Snapshot */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueTitle}>Revenue Snapshot</Text>
            <TouchableOpacity>
              <Text style={styles.revenueLink}>View Details</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.revenueRow}>
            <View>
              <Text style={styles.revenueAmount}>KSh 2.4M</Text>
              <Text style={styles.revenuePeriod}>This Month</Text>
            </View>
            <View style={styles.revenueTrend}>
              <Ionicons name="trending-up" size={16} color="#10b981" />
              <Text style={styles.revenueTrendText}>+12.5%</Text>
            </View>
          </View>
          <View style={styles.revenueBreakdown}>
            <View style={styles.revenueItem}>
              <View style={[styles.revenueDot, { backgroundColor: "#2563eb" }]} />
              <Text style={styles.revenueItemLabel}>Inpatient</Text>
              <Text style={styles.revenueItemValue}>58%</Text>
            </View>
            <View style={styles.revenueItem}>
              <View style={[styles.revenueDot, { backgroundColor: "#8b5cf6" }]} />
              <Text style={styles.revenueItemLabel}>Outpatient</Text>
              <Text style={styles.revenueItemValue}>32%</Text>
            </View>
            <View style={styles.revenueItem}>
              <View style={[styles.revenueDot, { backgroundColor: "#10b981" }]} />
              <Text style={styles.revenueItemLabel}>Pharmacy</Text>
              <Text style={styles.revenueItemValue}>10%</Text>
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
  occupancyCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  occupancyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  occupancyTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  occupancyRate: { fontSize: 24, fontWeight: "800" },
  occupancyBar: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, marginBottom: 14 },
  occupancyFill: { height: "100%", borderRadius: 4 },
  bedStatsRow: { flexDirection: "row", justifyContent: "space-between" },
  bedStat: { alignItems: "center", flex: 1 },
  bedStatValue: { fontSize: 18, fontWeight: "800", color: "#111827" },
  bedStatLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  statCard: {
    width: "48%", backgroundColor: "#fff", borderRadius: 14, padding: 14,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#111827", marginTop: 6 },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10, marginTop: 4 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  actionCard: {
    width: "48%", backgroundColor: "#fff", borderRadius: 14, padding: 16,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  actionIcon: {
    width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  actionLabel: { fontSize: 13, fontWeight: "600", color: "#374151" },
  revenueCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  revenueHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  revenueTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  revenueLink: { fontSize: 13, color: "#2563eb", fontWeight: "600" },
  revenueRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  revenueAmount: { fontSize: 24, fontWeight: "800", color: "#111827" },
  revenuePeriod: { fontSize: 12, color: "#6b7280" },
  revenueTrend: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#10b98115", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  revenueTrendText: { fontSize: 13, color: "#059669", fontWeight: "700" },
  revenueBreakdown: { flexDirection: "row", gap: 16 },
  revenueItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  revenueDot: { width: 8, height: 8, borderRadius: 4 },
  revenueItemLabel: { fontSize: 12, color: "#6b7280" },
  revenueItemValue: { fontSize: 12, fontWeight: "700", color: "#374151" },
});
