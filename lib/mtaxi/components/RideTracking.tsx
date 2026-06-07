// lib/mtaxi/components/RideTracking.tsx
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, Phone, MessageSquare, X, Navigation, Clock, Star, User } from "lucide-react-native";
import { useRides } from "../hooks/useRides";
import { useAuth } from "@/hooks/useAuth";

export default function RideTracking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { currentRide, fetchCurrentRide, cancelCurrentRide, loading, error } = useRides(user?.id || "");
  const rideId = params.rideId as string;

  useEffect(() => {
    if (rideId) fetchCurrentRide(rideId);
  }, [rideId]);

  const handleCancel = () => {
    if (!currentRide) return;
    Alert.alert("Cancel Ride?", "Are you sure you want to cancel this ride?", [
      { text: "No", style: "cancel" },
      { text: "Yes, Cancel", style: "destructive", onPress: () => cancelCurrentRide(currentRide.id, "Rider cancelled") },
    ]);
  };

  const callDriver = () => {
    if (!currentRide?.driver?.phone) {
      Alert.alert("No Phone", "Driver phone number not available");
      return;
    }
    Linking.openURL(`tel:${currentRide.driver.phone}`);
  };

  const messageDriver = () => {
    if (!currentRide?.driver?.phone) {
      Alert.alert("No Phone", "Driver phone number not available");
      return;
    }
    Linking.openURL(`sms:${currentRide.driver.phone}`);
  };

  const statusMap: Record<string, { label: string; color: string; desc: string }> = {
    searching: { label: "Finding Driver", color: "#f59e0b", desc: "Looking for nearby drivers..." },
    accepted: { label: "Driver Assigned", color: "#2563eb", desc: "Your driver is on the way" },
    arrived: { label: "Driver Arrived", color: "#10b981", desc: "Your driver has arrived at pickup" },
    in_progress: { label: "On Trip", color: "#2563eb", desc: "Heading to destination" },
    completed: { label: "Completed", color: "#10b981", desc: "Ride finished — thank you!" },
    cancelled: { label: "Cancelled", color: "#ef4444", desc: "This ride was cancelled" },
  };

  const status = currentRide ? statusMap[currentRide.status] : null;

  if (loading && !currentRide) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#2563eb" /><Text style={{ marginTop: 12, color: "#666" }}>Loading ride...</Text></View>;
  }

  if (!currentRide) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: "#666" }}>Ride not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/(mtaxi)")}>
          <Text style={styles.backBtnText}>Back to MTaxi</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.statusBar, { backgroundColor: status?.color || "#666" }]}>
        <Text style={styles.statusLabel}>{status?.label}</Text>
        <Text style={styles.statusDesc}>{status?.desc}</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <MapPin size={48} color="#2563eb" />
        <Text style={styles.mapText}>Live Map View</Text>
        <Text style={styles.mapSub}>Driver location updates in real-time</Text>
      </View>

      <View style={styles.rideInfo}>
        <View style={styles.locationRow}>
          <Navigation size={18} color="#10b981" />
          <Text style={styles.locationText}>{currentRide.pickup_address || "Pickup location"}</Text>
        </View>
        <View style={styles.locationRow}>
          <MapPin size={18} color="#ef4444" />
          <Text style={styles.locationText}>{currentRide.dropoff_address || "Destination"}</Text>
        </View>
      </View>

      {currentRide.driver && (
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}><User size={28} color="#fff" /></View>
          <View style={styles.driverInfo}>
            <Text style={styles.driverName}>{currentRide.driver.full_name}</Text>
            <Text style={styles.driverMeta}>{currentRide.driver.vehicle_type} · {currentRide.driver.vehicle_plate}</Text>
            <View style={styles.ratingRow}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{currentRide.driver.rating?.toFixed(1) || "4.8"}</Text>
            </View>
          </View>
          <View style={styles.driverActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={callDriver}>
              <Phone size={20} color="#2563eb" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={messageDriver}>
              <MessageSquare size={20} color="#2563eb" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.fareBox}>
        <Text style={styles.fareLabel}>Estimated Fare</Text>
        <Text style={styles.fareAmount}>${currentRide.fare_estimate?.toFixed(2) || "--"}</Text>
        <Text style={styles.fareDetail}>{currentRide.payment_method} · {currentRide.ride_type}</Text>
      </View>

      {currentRide.status !== "completed" && currentRide.status !== "cancelled" && (
        <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
          <X size={18} color="#ef4444" />
          <Text style={styles.cancelText}>Cancel Ride</Text>
        </TouchableOpacity>
      )}

      {currentRide.status === "completed" && (
        <TouchableOpacity style={styles.doneBtn} onPress={() => router.push("/(mtaxi)/history")}>
          <Text style={styles.doneBtnText}>View Ride History</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa" },
  statusBar: { padding: 20, paddingTop: 60, alignItems: "center" },
  statusLabel: { fontSize: 20, fontWeight: "700", color: "#fff" },
  statusDesc: { fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 },
  mapPlaceholder: { height: 280, backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  mapText: { fontSize: 18, fontWeight: "600", color: "#666", marginTop: 8 },
  mapSub: { fontSize: 13, color: "#999", marginTop: 4 },
  rideInfo: { padding: 16, backgroundColor: "#fff", marginTop: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  locationText: { marginLeft: 10, fontSize: 15, color: "#1a1a1a" },
  driverCard: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "#fff", marginTop: 8 },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  driverMeta: { fontSize: 13, color: "#666", marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  ratingText: { marginLeft: 4, fontSize: 13, color: "#666" },
  driverActions: { flexDirection: "row", gap: 10 },
  iconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#eff6ff", alignItems: "center", justifyContent: "center" },
  fareBox: { padding: 16, backgroundColor: "#fff", marginTop: 8, alignItems: "center" },
  fareLabel: { fontSize: 13, color: "#666" },
  fareAmount: { fontSize: 28, fontWeight: "800", color: "#1a1a1a", marginVertical: 4 },
  fareDetail: { fontSize: 13, color: "#666" },
  cancelBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", margin: 16, padding: 14, backgroundColor: "#fef2f2", borderRadius: 10, borderWidth: 1, borderColor: "#fecaca" },
  cancelText: { marginLeft: 8, fontSize: 15, fontWeight: "600", color: "#ef4444" },
  doneBtn: { margin: 16, padding: 16, backgroundColor: "#2563eb", borderRadius: 12, alignItems: "center" },
  doneBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  backBtn: { marginTop: 16, padding: 12, backgroundColor: "#2563eb", borderRadius: 10 },
  backBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});

