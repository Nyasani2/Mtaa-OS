import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";
import { useAuthStore } from "@/lib/kernel/stores/authStore";

interface ImagingRequest {
  id: string;
  patient_name: string;
  patient_id: string;
  modality: string;
  body_part: string;
  priority: "routine" | "urgent" | "stat";
  status: "ordered" | "scheduled" | "in_progress" | "completed" | "reported";
  ordered_by: string;
  ordered_at: string;
  scheduled_at?: string;
  completed_at?: string;
}

const MODALITY_ICONS: Record<string, string> = {
  xray: "scan-circle",
  ct: "cube-scan",
  mri: "magnet",
  ultrasound: "waves",
  mammography: "heart-pulse",
  nuclear: "atom",
  fluoroscopy: "video",
};

const MODALITY_LABELS: Record<string, string> = {
  xray: "X-Ray",
  ct: "CT Scan",
  mri: "MRI",
  ultrasound: "Ultrasound",
  mammography: "Mammography",
  nuclear: "Nuclear Med",
  fluoroscopy: "Fluoroscopy",
};

const STATUS_COLORS: Record<string, string> = {
  ordered: "#f59e0b",
  scheduled: "#3b82f6",
  in_progress: "#8b5cf6",
  completed: "#10b981",
  reported: "#059669",
};

const PRIORITY_COLORS: Record<string, string> = {
  routine: "#6b7280",
  urgent: "#f59e0b",
  stat: "#ef4444",
};

export default function RadiologyDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { radiologyRequests, fetchRadiologyRequests, isLoading } = useHealthStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "ordered" | "in_progress" | "completed" | "reported">("all");

  useEffect(() => {
    fetchRadiologyRequests();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRadiologyRequests();
    setRefreshing(false);
  };

  const filtered = filter === "all"
    ? radiologyRequests
    : radiologyRequests.filter((r: ImagingRequest) => r.status === filter);

  const stats = {
    total: radiologyRequests.length,
    pending: radiologyRequests.filter((r: ImagingRequest) => ["ordered", "scheduled"].includes(r.status)).length,
    inProgress: radiologyRequests.filter((r: ImagingRequest) => r.status === "in_progress").length,
    completed: radiologyRequests.filter((r: ImagingRequest) => ["completed", "reported"].includes(r.status)).length,
  };

  const renderRequest = ({ item }: { item: ImagingRequest }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => router.push(`/(os)/health/radiology/report?id=${item.id}`)}
    >
      <View style={styles.requestHeader}>
        <View style={styles.modalityBadge}>
          <MaterialCommunityIcons
            name={MODALITY_ICONS[item.modality] || "scan-circle"}
            size={18}
            color="#fff"
          />
          <Text style={styles.modalityText}>{MODALITY_LABELS[item.modality] || item.modality}</Text>
        </View>
        <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] + "20" }]}>
          <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>{item.priority.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.patientName}>{item.patient_name}</Text>
      <Text style={styles.bodyPart}>{item.body_part}</Text>
      <View style={styles.requestFooter}>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + "20" }]}>
          <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status.replace("_", " ").toUpperCase()}</Text>
        </View>
        <Text style={styles.orderedBy}>Dr. {item.ordered_by} · {new Date(item.ordered_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Radiology</Text>
        <TouchableOpacity onPress={() => router.push("/(os)/health/radiology/request")}>
          <Ionicons name="add-circle" size={28} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#f59e0b" }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#8b5cf6" }]}>{stats.inProgress}</Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#10b981" }]}>{stats.completed}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          {(["all", "ordered", "in_progress", "completed", "reported"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f === "all" ? "All" : f.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Requests List */}
        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="scan-circle" size={48} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No imaging requests</Text>
            <Text style={styles.emptySub}>All caught up in radiology</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={renderRequest}
            scrollEnabled={false}
            contentContainerStyle={styles.listContainer}
          />
        )}
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
  statsRow: {
    flexDirection: "row", paddingHorizontal: 12, paddingTop: 12, gap: 8,
  },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: "500" },
  filterScroll: { paddingHorizontal: 12, paddingVertical: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#e5e7eb",
  },
  filterChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  filterChipText: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  filterChipTextActive: { color: "#fff" },
  listContainer: { padding: 12, paddingBottom: 24 },
  requestCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  requestHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  modalityBadge: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#2563eb", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, gap: 6,
  },
  modalityText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: "800" },
  patientName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  bodyPart: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  requestFooter: { flexDirection: "row", alignItems: "center", marginTop: 10, gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700" },
  orderedBy: { fontSize: 11, color: "#9ca3af", flex: 1 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#6b7280", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#9ca3af", marginTop: 4 },
});
