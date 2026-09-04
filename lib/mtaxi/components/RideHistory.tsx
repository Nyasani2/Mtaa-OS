// lib/mtaxi/components/RideHistory.tsx
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from "expo-router";
import { MapPin, Clock, Star, ChevronRight, Car, Navigation } from "lucide-react-native";
import { useRides } from "../hooks/useRides";
import { useAuthStore as useAuth } from "@/lib/auth/store/auth.store";

const STATUS_COLORS: Record<string, string> = {
  completed: "#10b981",
  cancelled: "#ef4444",
  searching: "#f59e0b",
  accepted: "#2563eb",
  in_progress: "#2563eb",
};

export default function RideHistory() {
  const router = useRouter();
  const { user } = useAuth();
  const { rides, loading, fetchMyRides } = useRides(user?.id || "");

  useEffect(() => {
    fetchMyRides();
  }, [fetchMyRides]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.rideCard} onPress={() => router.push({ pathname: "/(mtaxi)/tracking", params: { rideId: item.id } })}>
      <View style={styles.rideHeader}>
        <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] || "#666" }]} />
        <Text style={styles.statusText}>{item.status}</Text>
        <Text style={styles.rideDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={styles.rideRoute}>
        <View style={styles.routeRow}>
          <Navigation size={14} color="#10b981" />
          <Text style={styles.routeText} numberOfLines={1}>{item.pickup_address || "Pickup"}</Text>
        </View>
        <View style={styles.routeRow}>
          <MapPin size={14} color="#ef4444" />
          <Text style={styles.routeText} numberOfLines={1}>{item.dropoff_address || "Destination"}</Text>
        </View>
      </View>
      <View style={styles.rideFooter}>
        <View style={styles.rideMeta}>
          <Car size={14} color="#666" />
          <Text style={styles.metaText}>{item.ride_type}</Text>
        </View>
        <View style={styles.rideMeta}>
          <Clock size={14} color="#666" />
          <Text style={styles.metaText}>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
        </View>
        <Text style={styles.fareText}>${item.final_fare?.toFixed(2) || item.fare_estimate?.toFixed(2) || "--"}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && rides.length === 0) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride History</Text>
      </View>
      <FlatList
        data={rides}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={<Text style={styles.emptyText}>No rides yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#2563eb" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  rideCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  rideHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize", flex: 1 },
  rideDate: { fontSize: 12, color: "#666" },
  rideRoute: { marginBottom: 10 },
  routeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
  routeText: { marginLeft: 8, fontSize: 14, color: "#1a1a1a", flex: 1 },
  rideFooter: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 10 },
  rideMeta: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  metaText: { marginLeft: 4, fontSize: 12, color: "#666" },
  fareText: { marginLeft: "auto", fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  emptyText: { textAlign: "center", color: "#666", marginTop: 40, fontSize: 16 },
});

