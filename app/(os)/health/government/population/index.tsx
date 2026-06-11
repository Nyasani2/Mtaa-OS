import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

interface Citizen {
  id: string;
  national_id: string;
  name: string;
  dob: string;
  gender: string;
  county: string;
  sub_county: string;
  ward: string;
  phone: string;
  blood_type: string;
  registered_at: string;
}

export default function PopulationRegistry() {
  const router = useRouter();
  const { fetchPopulationRegistry } = useHealthStore();

  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    const data = await fetchPopulationRegistry();
    setCitizens(data || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const filtered = citizens.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.national_id.includes(searchQuery)
  );

  const stats = {
    total: citizens.length,
    male: citizens.filter((c) => c.gender === "male").length,
    female: citizens.filter((c) => c.gender === "female").length,
    children: citizens.filter((c) => {
      const age = new Date().getFullYear() - new Date(c.dob).getFullYear();
      return age < 18;
    }).length,
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Population Registry</Text>
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="add-circle" size={26} color="#2563eb" />
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
            <Text style={styles.statValue}>{stats.total.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#3b82f6" }]}>{stats.male.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Male</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#ec4899" }]}>{stats.female.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Female</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#10b981" }]}>{stats.children.toLocaleString()}</Text>
            <Text style={styles.statLabel}>Under 18</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or ID number..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Citizens List */}
        {filtered.map((citizen) => (
          <TouchableOpacity
            key={citizen.id}
            style={styles.citizenCard}
            onPress={() => router.push(`/(os)/health/government/population/${citizen.id}`)}
          >
            <View style={styles.citizenHeader}>
              <View style={styles.citizenAvatar}>
                <Text style={styles.citizenInitials}>{citizen.name.split(" ").map((n) => n[0]).join("")}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.citizenName}>{citizen.name}</Text>
                <Text style={styles.citizenId}>ID: {citizen.national_id}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
            </View>
            <View style={styles.citizenDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="calendar" size={12} color="#9ca3af" />
                <Text style={styles.detailText}>{new Date(citizen.dob).toLocaleDateString()}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="location" size={12} color="#9ca3af" />
                <Text style={styles.detailText}>{citizen.county}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="water" size={12} color="#9ca3af" />
                <Text style={styles.detailText}>{citizen.blood_type}</Text>
              </View>
            </View>
          </TouchableOpacity>
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
  searchBox: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#111827" },
  citizenCard: {
    backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  citizenHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  citizenAvatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: "#2563eb",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  citizenInitials: { color: "#fff", fontSize: 14, fontWeight: "700" },
  citizenName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  citizenId: { fontSize: 12, color: "#6b7280", marginTop: 1 },
  citizenDetails: { flexDirection: "row", gap: 16, paddingLeft: 52 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  detailText: { fontSize: 11, color: "#6b7280" },
});
