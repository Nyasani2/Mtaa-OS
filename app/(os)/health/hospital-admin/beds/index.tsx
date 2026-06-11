import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

interface Bed {
  id: string;
  ward: string;
  number: string;
  type: "standard" | "icu" | "maternity" | "pediatric" | "isolation";
  status: "available" | "occupied" | "maintenance" | "reserved";
  patient_name?: string;
  patient_id?: string;
  admission_date?: string;
}

const WARDS = ["All", "General", "ICU", "Maternity", "Pediatric", "Isolation", "Surgery"];

const STATUS_COLORS: Record<string, string> = {
  available: "#10b981",
  occupied: "#ef4444",
  maintenance: "#f59e0b",
  reserved: "#3b82f6",
};

const TYPE_LABELS: Record<string, string> = {
  standard: "Standard",
  icu: "ICU",
  maternity: "Maternity",
  pediatric: "Pediatric",
  isolation: "Isolation",
};

export default function BedManagement() {
  const router = useRouter();
  const { fetchBeds, updateBedStatus } = useHealthStore();

  const [beds, setBeds] = useState<Bed[]>([]);
  const [selectedWard, setSelectedWard] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const loadBeds = async () => {
    const data = await fetchBeds();
    setBeds(data || []);
  };

  useEffect(() => {
    loadBeds();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBeds();
    setRefreshing(false);
  };

  const filteredBeds = selectedWard === "All" ? beds : beds.filter((b) => b.ward === selectedWard);

  const handleBedAction = (bed: Bed) => {
    if (bed.status === "available") {
      Alert.alert("Admit Patient", `Assign patient to Bed ${bed.number}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Admit", onPress: () => router.push(`/(os)/health/hospital-admin/admissions?bedId=${bed.id}`) },
      ]);
    } else if (bed.status === "occupied") {
      Alert.alert("Bed Actions", `Bed ${bed.number} - ${bed.patient_name}`, [
        { text: "Transfer", onPress: () => {} },
        { text: "Discharge", onPress: () => router.push(`/(os)/health/hospital-admin/discharges?bedId=${bed.id}`) },
        { text: "Cancel", style: "cancel" },
      ]);
    } else if (bed.status === "maintenance") {
      Alert.alert("Maintenance", `Mark Bed ${bed.number} as available?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Make Available", onPress: () => updateBedStatus(bed.id, "available") },
      ]);
    }
  };

  const wardStats = WARDS.filter((w) => w !== "All").map((ward) => ({
    ward,
    total: beds.filter((b) => b.ward === ward).length,
    occupied: beds.filter((b) => b.ward === ward && b.status === "occupied").length,
    available: beds.filter((b) => b.ward === ward && b.status === "available").length,
  }));

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bed Management</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="filter" size={24} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Ward Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wardScroll}>
          {WARDS.map((ward) => (
            <TouchableOpacity
              key={ward}
              style={[styles.wardChip, selectedWard === ward && styles.wardChipActive]}
              onPress={() => setSelectedWard(ward)}
            >
              <Text style={[styles.wardChipText, selectedWard === ward && styles.wardChipTextActive]}>{ward}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Ward Overview */}
        {selectedWard === "All" && (
          <View style={styles.wardGrid}>
            {wardStats.map((w) => (
              <View key={w.ward} style={styles.wardCard}>
                <Text style={styles.wardName}>{w.ward}</Text>
                <View style={styles.wardBar}>
                  <View style={[styles.wardBarFill, { width: `${w.total > 0 ? (w.occupied / w.total) * 100 : 0}%`, backgroundColor: "#ef4444" }]} />
                </View>
                <View style={styles.wardNumbers}>
                  <Text style={styles.wardOccupied}>{w.occupied}/{w.total}</Text>
                  <Text style={styles.wardAvailable}>{w.available} free</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Bed Grid */}
        <Text style={styles.sectionTitle}>
          {selectedWard === "All" ? "All Beds" : `${selectedWard} Ward`}
        </Text>
        <View style={styles.bedGrid}>
          {filteredBeds.map((bed) => (
            <TouchableOpacity
              key={bed.id}
              style={[styles.bedCard, { borderColor: STATUS_COLORS[bed.status] }]}
              onPress={() => handleBedAction(bed)}
            >
              <View style={[styles.bedIndicator, { backgroundColor: STATUS_COLORS[bed.status] }]} />
              <Text style={styles.bedNumber}>{bed.number}</Text>
              <Text style={styles.bedType}>{TYPE_LABELS[bed.type]}</Text>
              {bed.patient_name && (
                <Text style={styles.bedPatient} numberOfLines={1}>{bed.patient_name}</Text>
              )}
              <Text style={[styles.bedStatus, { color: STATUS_COLORS[bed.status] }]}>
                {bed.status.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  content: { padding: 12, paddingBottom: 24 },
  wardScroll: { marginBottom: 12 },
  wardChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: "#fff", marginRight: 8, borderWidth: 1, borderColor: "#e5e7eb",
  },
  wardChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  wardChipText: { fontSize: 12, color: "#6b7280", fontWeight: "600" },
  wardChipTextActive: { color: "#fff" },
  wardGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  wardCard: {
    width: "48%", backgroundColor: "#fff", borderRadius: 14, padding: 14,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  wardName: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 8 },
  wardBar: { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, marginBottom: 8 },
  wardBarFill: { height: "100%", borderRadius: 3 },
  wardNumbers: { flexDirection: "row", justifyContent: "space-between" },
  wardOccupied: { fontSize: 12, fontWeight: "700", color: "#ef4444" },
  wardAvailable: { fontSize: 12, color: "#10b981", fontWeight: "600" },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 10 },
  bedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bedCard: {
    width: "31%", backgroundColor: "#fff", borderRadius: 12, padding: 10,
    borderLeftWidth: 4, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
    alignItems: "center",
  },
  bedIndicator: { width: 8, height: 8, borderRadius: 4, marginBottom: 6 },
  bedNumber: { fontSize: 16, fontWeight: "800", color: "#111827" },
  bedType: { fontSize: 10, color: "#9ca3af", marginTop: 2 },
  bedPatient: { fontSize: 10, color: "#374151", marginTop: 4, maxWidth: "100%" },
  bedStatus: { fontSize: 9, fontWeight: "800", marginTop: 4 },
});
