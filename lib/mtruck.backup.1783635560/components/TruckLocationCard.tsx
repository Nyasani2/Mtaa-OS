import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { Truck } from "@/lib/mtruck/types";

interface Props {
  truck: Truck;
}

export function TruckLocationCard({ truck }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.reg}>{truck.registration}</Text>
        <View style={[styles.status, { backgroundColor: truck.status === "active" ? "#10B98120" : "#F59E0B20" }]}>
          <Text style={[styles.statusText, { color: truck.status === "active" ? "#10B981" : "#F59E0B" }]}>{truck.status.toUpperCase()}</Text>
        </View>
      </View>
      {truck.currentLocation && <Text style={styles.coords}>{truck.currentLocation.lat.toFixed(4)}, {truck.currentLocation.lng.toFixed(4)}</Text>}
      {truck.lastUpdated && <Text style={styles.updated}>Updated {truck.lastUpdated}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#0F172A", borderRadius: 10, padding: 12, marginTop: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  reg: { color: "white", fontSize: 16, fontWeight: "bold" },
  status: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "bold" },
  coords: { color: "#94A3B8", fontSize: 13 },
  updated: { color: "#64748B", fontSize: 11, marginTop: 4 },
});
