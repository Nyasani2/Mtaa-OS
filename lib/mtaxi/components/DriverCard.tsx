import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { NearbyDriver } from "../types";

interface Props { driver: NearbyDriver; onPress?: (driver: NearbyDriver) => void; }

export default function DriverCard({ driver, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(driver)}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>🚗</Text></View>
        <View style={styles.info}>
          <Text style={styles.name}>Driver {driver.driver_user_id.slice(0, 8)}{driver.is_favorite && <Text style={styles.favorite}> ⭐</Text>}</Text>
          <Text style={styles.vehicle}>{driver.vehicle?.type || "Vehicle"} • {driver.vehicle?.color || ""} • {driver.vehicle?.plate_number || ""}</Text>
        </View>
        <View style={styles.distance}><Text style={styles.distanceText}>{driver.distance_km} km</Text></View>
      </View>
      <View style={styles.stats}>
        <Text style={styles.stat}>Reputation: {driver.reputation_score}/100</Text>
        <Text style={styles.stat}>Rank: #{Math.round(driver.rank_score * 100)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10 },
  header: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#334155", alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20 },
  info: { flex: 1, marginLeft: 12 },
  name: { color: "#fff", fontSize: 15, fontWeight: "600" },
  favorite: { color: "#fbbf24" },
  vehicle: { color: "#94a3b8", fontSize: 12, marginTop: 2 },
  distance: { backgroundColor: "#0f172a", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  distanceText: { color: "#f59e0b", fontSize: 13, fontWeight: "600" },
  stats: { flexDirection: "row", marginTop: 10, gap: 16 },
  stat: { color: "#64748b", fontSize: 12 }
});
