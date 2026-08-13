// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Load } from "@/lib/mtruck/types";

interface Props {
  load: Load;
}

export function ActiveLoadItem({ load }: Props) {
  const statusColors: Record<string, string> = { pending: "#F59E0B", assigned: "#6366F1", in_transit: "#10B981", delivered: "#3B82F6", cancelled: "#EF4444" };
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.route}>{typeof load.origin === 'string' ? load.origin : load.origin?.name} → {typeof load.destination === 'string' ? load.destination : load.destination?.name}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[load.status] + "20" }]}>
          <Text style={[styles.badgeText, { color: statusColors[load.status] }]}>{load.status.replace("_", " ").toUpperCase()}</Text>
        </View>
      </View>
      <Text style={(styles as any).cargo_description}>{(load as any).cargo_description} • {load.weight_kg}kg</Text>
      <View style={styles.footer}>
        <Text style={(styles as any).rate_amount}>${(load as any).rate_amount}</Text>
        <Text style={(styles as any).distance_km}>{(load as any).distance_km}km</Text>
        {(load as any).estimated_arrival && <Text style={(styles as any).estimated_arrival}>ETA {(load as any).estimated_arrival}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  route: { color: "white", fontSize: 14, fontWeight: "600", flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  cargo: { color: "#94A3B8", fontSize: 13, marginBottom: 8 },
  footer: { flexDirection: "row", gap: 12 },
  rate: { color: "#10B981", fontSize: 14, fontWeight: "bold" },
  distance: { color: "#94A3B8", fontSize: 13 },
  eta: { color: "#F59E0B", fontSize: 13 },
});
