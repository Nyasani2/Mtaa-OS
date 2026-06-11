import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, TextInput
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  status: "on-duty" | "off-duty" | "on-call" | "leave";
  shift: string;
  phone: string;
  email: string;
}

const DEPARTMENTS = ["All", "Emergency", "Surgery", "Medicine", "Pediatrics", "Ob/Gyn", "Radiology", "Laboratory", "Pharmacy", "Admin"];

const STATUS_COLORS: Record<string, string> = {
  "on-duty": "#10b981",
  "off-duty": "#6b7280",
  "on-call": "#3b82f6",
  leave: "#f59e0b",
};

export default function StaffRoster() {
  const router = useRouter();
  const { fetchStaffRoster } = useHealthStore();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [refreshing, setRefreshing] = useState(false);

  const loadStaff = async () => {
    const data = await fetchStaffRoster();
    setStaff(data || []);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStaff();
    setRefreshing(false);
  };

  const filtered = staff.filter((s) => {
    const matchesDept = selectedDept === "All" || s.department === selectedDept;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const statusCounts = {
    onDuty: staff.filter((s) => s.status === "on-duty").length,
    onCall: staff.filter((s) => s.status === "on-call").length,
    offDuty: staff.filter((s) => s.status === "off-duty").length,
    onLeave: staff.filter((s) => s.status === "leave").length,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Roster</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="add-circle" size={26} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search staff by name or role..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Summary */}
        <View style={styles.statusRow}>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: "#10b981" }]} />
            <Text style={styles.statusPillText}>{statusCounts.onDuty} On Duty</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: "#3b82f6" }]} />
            <Text style={styles.statusPillText}>{statusCounts.onCall} On Call</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: "#6b7280" }]} />
            <Text style={styles.statusPillText}>{statusCounts.offDuty} Off</Text>
          </View>
        </View>

        {/* Department Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
          {DEPARTMENTS.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[styles.deptChip, selectedDept === dept && styles.deptChipActive]}
              onPress={() => setSelectedDept(dept)}
            >
              <Text style={[styles.deptChipText, selectedDept === dept && styles.deptChipTextActive]}>{dept}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Staff List */}
        {filtered.map((member) => (
          <View key={member.id} style={styles.staffCard}>
            <View style={styles.staffHeader}>
              <View style={styles.staffAvatar}>
                <Text style={styles.staffInitials}>{member.name.split(" ").map((n) => n[0]).join("")}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.staffName}>{member.name}</Text>
                <Text style={styles.staffRole}>{member.role} · {member.department}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[member.status] + "20" }]}>
                <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[member.status] }]}>
                  {member.status.replace("-", " ").toUpperCase()}
                </Text>
              </View>
            </View>
            <View style={styles.staffDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={14} color="#9ca3af" />
                <Text style={styles.detailText}>{member.shift}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="call-outline" size={14} color="#9ca3af" />
                <Text style={styles.detailText}>{member.phone}</Text>
              </View>
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
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  content: { padding: 12, paddingBottom: 24 },
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#111827" },
  statusRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: "#e5e7eb",
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusPillText: { fontSize: 11, fontWeight: "600", color: "#374151" },
  deptScroll: { marginBottom: 12 },
  deptChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16,
    backgroundColor: "#fff", marginRight: 6, borderWidth: 1, borderColor: "#e5e7eb",
  },
  deptChipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  deptChipText: { fontSize: 11, color: "#6b7280", fontWeight: "500" },
  deptChipTextActive: { color: "#fff", fontWeight: "600" },
  staffCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  staffHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  staffAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#2563eb",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  staffInitials: { color: "#fff", fontSize: 14, fontWeight: "700" },
  staffName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  staffRole: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 9, fontWeight: "800" },
  staffDetails: { flexDirection: "row", gap: 16, paddingLeft: 52 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 12, color: "#6b7280" },
});
