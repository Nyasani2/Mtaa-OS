import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useDispatchStore } from "@/lib/mtruck/hooks/use-dispatch-store";
import { LoadDetailCard } from "@/lib/mtruck/components/LoadDetailCard";

export default function LoadsScreen() {
  const { allLoads } = useDispatchStore();
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = statusFilter === "all" ? allLoads : allLoads.filter((l) => l.status === statusFilter);
  const statuses = ["all", "pending", "assigned", "in_transit", "delivered", "cancelled"];
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {statuses.map((s) => (
          <TouchableOpacity key={s} style={[styles.filterChip, statusFilter === s && styles.filterChipActive]} onPress={() => setStatusFilter(s)}>
            <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>{s.replace("_", " ").toUpperCase()}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <ScrollView style={styles.list}>
        {filtered.map((load) => <LoadDetailCard key={load.id} load={load} />)}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  filterScroll: { flexGrow: 0, paddingHorizontal: 16, marginTop: 12, marginBottom: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: "#1E293B", marginRight: 8 },
  filterChipActive: { backgroundColor: "#6366F1" },
  filterText: { color: "#94A3B8", fontSize: 11 },
  filterTextActive: { color: "white" },
  list: { flex: 1, paddingHorizontal: 16 },
});
