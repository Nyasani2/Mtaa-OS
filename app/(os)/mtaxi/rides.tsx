import React from "react";
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useRides } from "@/lib/mtaxi/hooks/useRides";
import RideCard from "@/lib/mtaxi/components/RideCard";
import type { Ride } from "@/lib/mtaxi/types";

export default function RidesScreen() {
  const router = useRouter();
  const { rides, loading, error, refresh } = useRides();

  const handlePress = (ride: Ride) => {
    router.push(`/(os)/mtaxi/ride/${ride.id}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Rides</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RideCard ride={item} onPress={handlePress} />}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#f59e0b" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No rides yet</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => router.push("/(os)/mtaxi")}>
              <Text style={styles.emptyButtonText}>Request a Ride</Text>
            </TouchableOpacity>
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
  empty: { alignItems: "center", marginTop: 60 },
  emptyText: { color: "#64748b", fontSize: 16, marginBottom: 16 },
  emptyButton: { backgroundColor: "#f59e0b", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  emptyButtonText: { color: "#fff", fontWeight: "600" }
});
