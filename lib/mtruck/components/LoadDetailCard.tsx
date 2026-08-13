// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Load } from "@/lib/mtruck/types";

interface Props {
  load: Load;
}

export function LoadDetailCard({ load }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.id}>Load #{load.id.slice(-4)}</Text>
      <Text style={styles.route}>{typeof load.origin === 'string' ? load.origin : load.origin?.name} → {typeof load.destination === 'string' ? load.destination : load.destination?.name}</Text>
      <View style={styles.row}>
        <Text style={styles.detail}>{(load as any).cargo_description}</Text>
        <Text style={styles.detail}>{load.weight_kg}kg</Text>
        <Text style={styles.detail}>${(load as any).rate_amount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16 },
  id: { color: "#64748B", fontSize: 12, marginBottom: 4 },
  route: { color: "white", fontSize: 15, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", gap: 12 },
  detail: { color: "#94A3B8", fontSize: 13 },
});
