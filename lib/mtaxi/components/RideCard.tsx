import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Ride } from "../types";

const STATUS_COLORS: Record<string, string> = {
  requested: "#f59e0b", accepted: "#3b82f6", driver_arrived: "#8b5cf6",
  in_progress: "#10b981", completed: "#22c55e", cancelled: "#ef4444"
};

interface Props { ride: Ride; onPress?: (ride: Ride) => void; }

export default function RideCard({ ride, onPress }: Props) {
  const pickup = typeof ride.pickup_location === "string" ? ride.pickup_location : ride.pickup_location?.address || "Unknown pickup";
  const dropoff = typeof ride.dropoff_location === "string" ? ride.dropoff_location : ride.dropoff_location?.address || "Unknown destination";

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(ride)}>
      <View style={styles.header}>
        <Text style={styles.code}>{ride.ride_code}</Text>
        <View style={[styles.badge, { backgroundColor: STATUS_COLORS[ride.status] + "20" }]}>
          <Text style={[styles.status, { color: STATUS_COLORS[ride.status] }]}>{ride.status.replace("_", " ")}</Text>
        </View>
      </View>
      <View style={styles.route}>
        <Text style={styles.location}>📍 {pickup}</Text>
        <Text style={styles.arrow}>↓</Text>
        <Text style={styles.location}>🏁 {dropoff}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.fare}>KES {ride.final_fare || ride.estimated_fare}</Text>
        <Text style={styles.date}>{new Date(ride.created_at).toLocaleDateString()}</Text>
      </View>
      {ride.rating_driver && <Text style={styles.rating}>⭐ {ride.rating_driver}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  code: { color: "#f59e0b", fontSize: 14, fontWeight: "700" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  status: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  route: { marginBottom: 10 },
  location: { color: "#e2e8f0", fontSize: 14, marginBottom: 2 },
  arrow: { color: "#64748b", fontSize: 12, marginLeft: 4, marginVertical: 2 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  fare: { color: "#fff", fontSize: 16, fontWeight: "700" },
  date: { color: "#64748b", fontSize: 12 },
  rating: { color: "#fbbf24", fontSize: 13, marginTop: 6 }
});
