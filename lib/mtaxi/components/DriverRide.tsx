// lib/mtaxi/components/DriverRide.tsx
import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, Navigation, Phone, MessageSquare, CheckCircle, Flag, AlertTriangle } from "lucide-react-native";
import { useDriver } from "../hooks/useDriver";
import { useAuth } from "@/lib/auth/useAuthStore";
import { supabase } from "@/lib/supabase";

export default function DriverRide() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { currentRide, loading, error, complete, driver } = useDriver(user?.id || "");

  const rideId = params.rideId as string;

  useEffect(() => {
    // currentRide is already tracked via realtime subscription in useDriver
  }, [rideId]);

  const handleArrived = async () => {
    if (!currentRide) return;
    const { error } = await supabase
      .from("mtaxi_rides")
      .update({ status: "arrived", updated_at: new Date().toISOString() })
      .eq("id", currentRide.id);
    if (error) Alert.alert("Error", error.message);
  };

  const handleStart = async () => {
    if (!currentRide) return;
    const { error } = await supabase
      .from("mtaxi_rides")
      .update({ status: "in_progress", started_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", currentRide.id);
    if (error) Alert.alert("Error", error.message);
  };

  const handleComplete = () => {
    if (!currentRide) return;
    Alert.alert("Complete Ride?", "Confirm this ride is finished.", [
      { text: "Cancel", style: "cancel" },
      { text: "Complete", onPress: () => complete(currentRide.id) },
    ]);
  };

  const callSupport = () => {
    Linking.openURL("tel:0800729729");
  };

  const emergency = () => {
    Alert.alert("Emergency", "Call emergency services?", [
      { text: "Cancel", style: "cancel" },
      { text: "Call 999", style: "destructive", onPress: () => Linking.openURL("tel:999") },
    ]);
  };

  const statusActions: Record<string, { label: string; color: string; icon: typeof CheckCircle; action: () => void }> = {
    accepted: { label: "Navigate to Pickup", color: "#3b82f6", icon: Navigation, action: () => {} },
    arrived: { label: "Start Ride", color: "#10b981", icon: Flag, action: handleStart },
    in_progress: { label: "Complete Ride", color: "#f59e0b", icon: CheckCircle, action: handleComplete },
    completed: { label: "Ride Completed", color: "#10b981", icon: CheckCircle, action: () => {} },
  };

  if (loading && !currentRide) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#f59e0b" /><Text style={{ marginTop: 12, color: "#94a3b8" }}>Loading ride...</Text></View>;
  }

  if (!currentRide) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, color: "#94a3b8" }}>No active ride</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/(mtaxi)/driver" as any)}>
          <Text style={styles.backBtnText}>Back to Driver Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = statusActions[currentRide.status] || statusActions.accepted;

  return (
    <View style={styles.container}>
      <View style={[styles.statusBar, { backgroundColor: status.color }]}>
        <Text style={styles.statusLabel}>{currentRide.status.replace("_", " ").toUpperCase()}</Text>
      </View>

      <View style={styles.mapPlaceholder}>
        <Navigation size={48} color="#3b82f6" />
        <Text style={styles.mapText}>Navigation View</Text>
        <Text style={styles.mapSub}>Turn-by-turn directions</Text>
      </View>

      <View style={styles.rideInfo}>
        <View style={styles.locationRow}>
          <Navigation size={18} color="#10b981" />
          <Text style={styles.locationText}>{currentRide.pickup_address || "Pickup"}</Text>
        </View>
        <View style={styles.locationRow}>
          <MapPin size={18} color="#ef4444" />
          <Text style={styles.locationText}>{currentRide.dropoff_address || "Destination"}</Text>
        </View>
      </View>

      <View style={styles.fareBox}>
        <Text style={styles.fareLabel}>Estimated Fare</Text>
        <Text style={styles.fareAmount}>${currentRide.fare_estimate?.toFixed(2) || "--"}</Text>
        <Text style={styles.fareDetail}>{currentRide.payment_method} · {currentRide.ride_type}</Text>
      </View>

      <TouchableOpacity
        style={[styles.actionBtn, { backgroundColor: status.color }]}
        onPress={status.action}
        disabled={currentRide.status === "completed"}
      >
        <status.icon size={24} color="#fff" />
        <Text style={styles.actionText}>{status.label}</Text>
      </TouchableOpacity>

      {currentRide.status === "accepted" && (
        <TouchableOpacity style={[styles.secondaryBtn, { backgroundColor: "#10b981" }]} onPress={handleArrived}>
          <Flag size={20} color="#fff" />
          <Text style={styles.secondaryText}>I've Arrived at Pickup</Text>
        </TouchableOpacity>
      )}

      {currentRide.status !== "completed" && (
        <View style={styles.safetyRow}>
          <TouchableOpacity style={styles.safetyBtn} onPress={callSupport}>
            <Phone size={20} color="#3b82f6" />
            <Text style={styles.safetyText}>Call Support</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.safetyBtn} onPress={emergency}>
            <AlertTriangle size={20} color="#ef4444" />
            <Text style={styles.safetyText}>Emergency</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" },
  statusBar: { padding: 20, paddingTop: 60, alignItems: "center" },
  statusLabel: { fontSize: 18, fontWeight: "700", color: "#fff", textTransform: "capitalize" },
  mapPlaceholder: { height: 280, backgroundColor: "#1e293b", justifyContent: "center", alignItems: "center" },
  mapText: { fontSize: 18, fontWeight: "600", color: "#94a3b8", marginTop: 8 },
  mapSub: { fontSize: 13, color: "#64748b", marginTop: 4 },
  rideInfo: { padding: 16, backgroundColor: "#1e293b", marginTop: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
  locationText: { marginLeft: 10, fontSize: 15, color: "#e2e8f0" },
  fareBox: { padding: 16, backgroundColor: "#1e293b", marginTop: 8, alignItems: "center" },
  fareLabel: { fontSize: 13, color: "#64748b" },
  fareAmount: { fontSize: 28, fontWeight: "800", color: "#fff", marginVertical: 4 },
  fareDetail: { fontSize: 13, color: "#64748b" },
  actionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", margin: 16, padding: 16, borderRadius: 12 },
  actionText: { marginLeft: 10, color: "#fff", fontSize: 17, fontWeight: "700" },
  secondaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 10 },
  secondaryText: { marginLeft: 10, color: "#fff", fontSize: 15, fontWeight: "600" },
  safetyRow: { flexDirection: "row", gap: 10, marginHorizontal: 16 },
  safetyBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, backgroundColor: "#1e293b", borderRadius: 10 },
  safetyText: { marginLeft: 8, fontSize: 14, color: "#94a3b8" },
  backBtn: { marginTop: 16, padding: 12, backgroundColor: "#f59e0b", borderRadius: 10 },
  backBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
