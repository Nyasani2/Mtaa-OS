// lib/mtaxi/components/DriverRequests.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Navigation, Clock, DollarSign, Check, X, Car } from "lucide-react-native";
import { useDriver } from "../hooks/useDriver";
import { useAuthStore as useAuth } from "@/lib/auth/store/auth.store";

export default function DriverRequests() {
  const router = useRouter();
  const { user } = useAuth();
  const { pendingRides: initialPending, loading, error, accept, driver } = useDriver(user?.id || "");
  const [pendingRides, setPendingRides] = useState(initialPending);

  useEffect(() => {
    setPendingRides(initialPending);
  }, [initialPending]);

  const handleAccept = async (rideId: string) => {
    try {
      await accept(rideId);
      setPendingRides((prev) => prev.filter((r) => r.id !== rideId));
      router.push({ pathname: "/(mtaxi)/driver-ride", params: { rideId } });
    } catch (e: any) {
      // Error handled in hook
    }
  };

  const handleDecline = (rideId: string) => {
    setPendingRides((prev) => prev.filter((r) => r.id !== rideId));
    // No edge function for decline — just remove from local pending list
    // The ride remains in "searching" status for other drivers
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Car size={20} color="#f59e0b" />
        <Text style={styles.rideType}>{item.ride_type || "economy"}</Text>
        <Text style={styles.fare}>${item.fare_estimate?.toFixed(2) || "--"}</Text>
      </View>
      <View style={styles.route}>
        <View style={styles.routeRow}>
          <Navigation size={14} color="#10b981" />
          <Text style={styles.routeText} numberOfLines={1}>{item.pickup_address || "Pickup location"}</Text>
        </View>
        <View style={styles.routeRow}>
          <MapPin size={14} color="#ef4444" />
          <Text style={styles.routeText} numberOfLines={1}>{item.dropoff_address || "Destination"}</Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Clock size={14} color="#64748b" />
        <Text style={styles.metaText}>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</Text>
        <DollarSign size={14} color="#64748b" />
        <Text style={styles.metaText}>{item.payment_method || "wallet"}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item.id)}>
          <Check size={18} color="#fff" />
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.rejectBtn} onPress={() => handleDecline(item.id)}>
          <X size={18} color="#ef4444" />
          <Text style={styles.rejectText}>Decline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride Requests</Text>
        <Text style={styles.headerSub}>{pendingRides.length} pending nearby</Text>
      </View>
      {loading && pendingRides.length === 0 ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#f59e0b" /></View>
      ) : (
        <FlatList
          data={pendingRides}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          ListEmptyComponent={<Text style={styles.emptyText}>No pending requests</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#1e293b" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  rideType: { fontSize: 15, fontWeight: "600", color: "#fff", marginLeft: 8, flex: 1 },
  fare: { fontSize: 16, fontWeight: "700", color: "#f59e0b" },
  route: { marginBottom: 10 },
  routeRow: { flexDirection: "row", alignItems: "center", paddingVertical: 3 },
  routeText: { marginLeft: 8, fontSize: 14, color: "#e2e8f0", flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  metaText: { marginLeft: 4, marginRight: 16, fontSize: 12, color: "#64748b" },
  actions: { flexDirection: "row", gap: 10 },
  acceptBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, backgroundColor: "#10b981", borderRadius: 10 },
  acceptText: { marginLeft: 8, color: "#fff", fontSize: 15, fontWeight: "700" },
  rejectBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, backgroundColor: "#334155", borderRadius: 10 },
  rejectText: { marginLeft: 8, color: "#ef4444", fontSize: 15, fontWeight: "600" },
  emptyText: { textAlign: "center", color: "#64748b", marginTop: 40, fontSize: 16 },
});

