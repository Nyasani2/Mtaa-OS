import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

interface AmbulanceUnit {
  id: string;
  unit_number: string;
  status: "available" | "dispatched" | "en-route" | "on-scene" | "transporting" | "at-hospital" | "off-duty";
  crew: string[];
  current_call?: {
    id: string;
    patient_name: string;
    location: string;
    priority: "routine" | "urgent" | "emergency";
    eta: string;
  };
}

const STATUS_COLORS: Record<string, string> = {
  available: "#10b981",
  dispatched: "#3b82f6",
  "en-route": "#f59e0b",
  "on-scene": "#ef4444",
  transporting: "#8b5cf6",
  "at-hospital": "#06b6d4",
  "off-duty": "#6b7280",
};

export default function AmbulanceDashboard() {
  const router = useRouter();
  const { fetchAmbulanceUnits } = useHealthStore();

  const [units, setUnits] = useState<AmbulanceUnit[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadUnits = async () => {
    const data = await fetchAmbulanceUnits();
    setUnits(data || []);
  };

  useEffect(() => {
    loadUnits();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUnits();
    setRefreshing(false);
  };

  const stats = {
    available: units.filter((u) => u.status === "available").length,
    dispatched: units.filter((u) => ["dispatched", "en-route", "on-scene", "transporting", "at-hospital"].includes(u.status)).length,
    offDuty: units.filter((u) => u.status === "off-duty").length,
    total: units.length,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ambulance Control</Text>
        <TouchableOpacity onPress={() => router.push("/(os)/health/ambulance/dispatch")}>
          <Ionicons name="add-circle" size={28} color="#ef4444" />
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
            <Text style={[styles.statValue, { color: "#10b981" }]}>{stats.available}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#ef4444" }]}>{stats.dispatched}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#6b7280" }]}>{stats.offDuty}</Text>
            <Text style={styles.statLabel}>Off Duty</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Units</Text>
          </View>
        </View>

        {/* Active Dispatches */}
        <Text style={styles.sectionTitle}>Active Dispatches</Text>
        {units.filter((u) => u.current_call).length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="ambulance" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No active dispatches</Text>
          </View>
        ) : (
          units.filter((u) => u.current_call).map((unit) => (
            <TouchableOpacity
              key={unit.id}
              style={styles.dispatchCard}
              onPress={() => router.push(`/(os)/health/ambulance/handover?unitId=${unit.id}`)}
            >
              <View style={styles.dispatchHeader}>
                <View style={[styles.unitBadge, { backgroundColor: STATUS_COLORS[unit.status] }]}>
                  <Text style={styles.unitBadgeText}>{unit.unit_number}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: unit.current_call!.priority === "emergency" ? "#ef444420" : "#f59e0b20" }]}>
                  <Text style={[styles.priorityText, { color: unit.current_call!.priority === "emergency" ? "#ef4444" : "#f59e0b" }]}>
                    {unit.current_call!.priority.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.patientName}>{unit.current_call!.patient_name}</Text>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={14} color="#ef4444" />
                <Text style={styles.locationText}>{unit.current_call!.location}</Text>
              </View>
              <View style={styles.dispatchFooter}>
                <View style={styles.crewRow}>
                  {unit.crew.map((member, i) => (
                    <View key={i} style={styles.crewBadge}>
                      <Text style={styles.crewText}>{member}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.etaRow}>
                  <Ionicons name="time" size={14} color="#6b7280" />
                  <Text style={styles.etaText}>ETA {unit.current_call!.eta}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* All Units */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>All Units</Text>
        {units.map((unit) => (
          <View key={unit.id} style={styles.unitRow}>
            <View style={[styles.unitDot, { backgroundColor: STATUS_COLORS[unit.status] }]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.unitNumber}>{unit.unit_number}</Text>
              <Text style={styles.unitStatus}>{unit.status.replace("-", " ").toUpperCase()}</Text>
            </View>
            <View style={styles.crewRow}>
              {unit.crew.slice(0, 2).map((member, i) => (
                <View key={i} style={[styles.crewBadge, { backgroundColor: "#f3f4f6" }]}>
                  <Text style={[styles.crewText, { color: "#6b7280" }]}>{member}</Text>
                </View>
              ))}
            </View>
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  content: { padding: 12, paddingBottom: 24 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: "500" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 },
  emptyCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 30, alignItems: "center",
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2, marginBottom: 16,
  },
  emptyText: { fontSize: 14, color: "#9ca3af", marginTop: 8 },
  dispatchCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
    borderLeftWidth: 4, borderLeftColor: "#ef4444",
  },
  dispatchHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  unitBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  unitBadgeText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  priorityBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: "800" },
  patientName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  locationText: { fontSize: 13, color: "#6b7280", flex: 1 },
  dispatchFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  crewRow: { flexDirection: "row", gap: 6 },
  crewBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: "#2563eb15" },
  crewText: { fontSize: 10, color: "#2563eb", fontWeight: "600" },
  etaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  etaText: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  unitRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12,
    padding: 12, marginBottom: 6, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  unitDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  unitNumber: { fontSize: 15, fontWeight: "700", color: "#111827" },
  unitStatus: { fontSize: 11, color: "#9ca3af", marginTop: 1 },
});
