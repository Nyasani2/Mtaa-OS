// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Route } from "@/lib/mtruck/types";

interface Props {
  route: Route;
}

export function RouteCard({ route }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.route}>{route.origin} → {route.destination}</Text>
        {route.optimized && <View style={styles.optimized}><Ionicons name="checkmark-circle" size={14} color="#10B981" /><Text style={styles.optimizedText}>Optimized</Text></View>}
      </View>
      <View style={styles.stats}>
        <Text style={styles.stat}>{(route as any).distance}km</Text>
        <Text style={styles.stat}>{Math.floor(route.duration / 60)}h {route.duration % 60}m</Text>
        <Text style={styles.stat}>{route.fuel_estimate}L fuel</Text>
        <Text style={styles.stat}>${route.tolls} tolls</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  route: { color: "white", fontSize: 15, fontWeight: "600", flex: 1 },
  optimized: { flexDirection: "row", alignItems: "center", gap: 4 },
  optimizedText: { color: "#10B981", fontSize: 12 },
  stats: { flexDirection: "row", gap: 12 },
  stat: { color: "#94A3B8", fontSize: 12 },
});
