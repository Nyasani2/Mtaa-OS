import React from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useCarpoolTrips } from "@/lib/mtaxi/hooks/useCarpool";
import type { CarpoolTrip } from "@/lib/mtaxi/types";

export default function CarpoolScreen() {
  const router = useRouter();
  const { trips, loading, error, refresh } = useCarpoolTrips();

  const renderTrip = ({ item }: { item: CarpoolTrip }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.route}>{typeof item.origin === "string" ? item.origin : item.origin?.address} → {typeof item.destination === "string" ? item.destination : item.destination?.address}</Text>
        <Text style={styles.price}>KES {item.price_per_seat}/seat</Text>
      </View>
      <View style={styles.details}>
        <Text style={styles.detail}>🕐 {new Date(item.departure_time).toLocaleString()}</Text>
        <Text style={styles.detail}>🪑 {item.available_seats} seats left</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚐 Carpool</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={trips}
        keyExtractor={(item) => item.id}
        renderItem={renderTrip}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#f59e0b" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No carpool trips available</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", color: "#fff", marginTop: 40, marginBottom: 16 },
  error: { color: "#ef4444", marginBottom: 12, textAlign: "center" },
  card: { backgroundColor: "#1e293b", borderRadius: 12, padding: 14, marginBottom: 10 },
  header_row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  route: { color: "#e2e8f0", fontSize: 15, fontWeight: "600", flex: 1 },
  price: { color: "#f59e0b", fontSize: 14, fontWeight: "700" },
  details: { marginTop: 4 },
  detail: { color: "#94a3b8", fontSize: 13, marginBottom: 2 },
  empty: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#64748b", fontSize: 16 }
});
