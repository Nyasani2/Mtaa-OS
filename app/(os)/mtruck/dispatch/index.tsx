import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useDispatchStore } from "@/lib/mtruck/hooks/use-dispatch-store";
import { LoadCard } from "@/lib/mtruck/components/LoadCard";

export default function DispatchScreen() {
  const router = useRouter();
  const { availableLoads, assignedLoads, assignLoad, unassignLoad } = useDispatchStore();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = (filter === "all" ? availableLoads : assignedLoads).filter(
    (load) => load.origin.toLowerCase().includes(search.toLowerCase()) || load.destination.toLowerCase().includes(search.toLowerCase()) || load.cargo.toLowerCase().includes(search.toLowerCase())
  );

  const handleAssign = (loadId: string) => {
    Alert.alert("Assign Load", "Dispatch truck to this load?", [
      { text: "Cancel", style: "cancel" },
      { text: "Assign", onPress: () => assignLoad(loadId) },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#64748B" />
        <TextInput style={styles.searchInput} placeholder="Search loads by route or cargo..." placeholderTextColor="#64748B" value={search} onChangeText={setSearch} />
      </View>
      <View style={styles.filterRow}>
        {["all", "assigned", "urgent"].map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.list}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cube-outline" size={48} color="#334155" />
            <Text style={styles.emptyText}>No loads found</Text>
          </View>
        ) : filtered.map((load) => (
          <LoadCard key={load.id} load={load} onAssign={() => handleAssign(load.id)} onTrack={() => router.push(`/(mtruck)/tracking?load=${load.id}` as any)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 16, marginTop: 12, gap: 10 },
  searchInput: { flex: 1, color: "white", fontSize: 15 },
  filterRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginTop: 12, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "#1E293B" },
  filterChipActive: { backgroundColor: "#6366F1" },
  filterText: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  filterTextActive: { color: "white" },
  list: { flex: 1, paddingHorizontal: 16 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#64748B", marginTop: 12, fontSize: 15 },
});
