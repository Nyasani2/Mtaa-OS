import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useRide, useRealtimeRide } from "@/lib/mtaxi/hooks/useRides";
import { useDriverTracking } from "@/lib/mtaxi/hooks/useDriver";
import { cancelRide, completeRide, rateRide } from "@/lib/mtaxi/services/rideService";
import { useAuthStore } from "@/hooks/useAuthStore";

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { ride: initialRide, loading } = useRide(id as string);
  const liveRide = useRealtimeRide(id as string);
  const ride = liveRide || initialRide;

  const [rating, setRating] = useState("");
  const [review, setReview] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const driverLocation = useDriverTracking(ride?.driver_id || null);

  const isRider = ride?.rider_id === user?.id;
  const isDriver = ride?.driver_id === user?.id;

  const handleCancel = async () => {
    setActionLoading(true);
    try { await cancelRide(id as string, "Cancelled by user"); Alert.alert("Cancelled", "Ride has been cancelled"); }
    catch (err: any) { Alert.alert("Error", err.message); } finally { setActionLoading(false); }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try { await completeRide(id as string); Alert.alert("Completed", "Ride completed successfully"); }
    catch (err: any) { Alert.alert("Error", err.message); } finally { setActionLoading(false); }
  };

  const handleRate = async () => {
    const numRating = parseInt(rating);
    if (!numRating || numRating < 1 || numRating > 5) { Alert.alert("Error", "Enter rating 1-5"); return; }
    setActionLoading(true);
    try { await rateRide(id as string, numRating, review, isRider ? "rider" : "driver"); Alert.alert("Rated", "Thank you for your feedback"); }
    catch (err: any) { Alert.alert("Error", err.message); } finally { setActionLoading(false); }
  };

  if (loading) return <View style={styles.container}><ActivityIndicator color="#f59e0b" /></View>;
  if (!ride) return <View style={styles.container}><Text style={styles.error}>Ride not found</Text></View>;

  const STATUS_COLORS: Record<string, string> = {
    requested: "#f59e0b", accepted: "#3b82f6", driver_arrived: "#8b5cf6",
    in_progress: "#10b981", completed: "#22c55e", cancelled: "#ef4444"
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Ride {ride.ride_code}</Text>

      <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[ride.status] + "20" }]}>
        <Text style={[styles.statusText, { color: STATUS_COLORS[ride.status] }]}>{ride.status.replace("_", " ")}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Pickup</Text>
        <Text style={styles.value}>{typeof ride.pickup_location === "string" ? ride.pickup_location : ride.pickup_location?.address}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Destination</Text>
        <Text style={styles.value}>{typeof ride.dropoff_location === "string" ? ride.dropoff_location : ride.dropoff_location?.address}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Fare</Text>
        <Text style={styles.fare}>KES {ride.final_fare || ride.estimated_fare}</Text>
        {ride.surge_multiplier && ride.surge_multiplier > 1 && (
          <Text style={styles.surge}>Surge: {ride.surge_multiplier}x</Text>
        )}
      </View>

      {driverLocation && (
        <View style={styles.section}>
          <Text style={styles.label}>Driver Location</Text>
          <Text style={styles.value}>Lat: {driverLocation.lat.toFixed(4)}, Lng: {driverLocation.lng.toFixed(4)}</Text>
        </View>
      )}

      {ride.status === "requested" && isRider && (
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleCancel} disabled={actionLoading}>
          <Text style={styles.buttonText}>Cancel Ride</Text>
        </TouchableOpacity>
      )}

      {ride.status === "accepted" && isDriver && (
        <TouchableOpacity style={[styles.button, styles.completeButton]} onPress={handleComplete} disabled={actionLoading}>
          <Text style={styles.buttonText}>Complete Ride</Text>
        </TouchableOpacity>
      )}

      {ride.status === "completed" && !ride.rating_driver && isRider && (
        <View style={styles.rateSection}>
          <Text style={styles.label}>Rate Driver</Text>
          <TextInput style={styles.input} placeholder="Rating 1-5" placeholderTextColor="#64748b" keyboardType="numeric" value={rating} onChangeText={setRating} />
          <TextInput style={styles.input} placeholder="Review (optional)" placeholderTextColor="#64748b" value={review} onChangeText={setReview} multiline />
          <TouchableOpacity style={[styles.button, styles.rateButton]} onPress={handleRate} disabled={actionLoading}>
            <Text style={styles.buttonText}>Submit Rating</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", color: "#f59e0b", marginTop: 40, marginBottom: 16 },
  statusBadge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginBottom: 16 },
  statusText: { fontSize: 14, fontWeight: "600", textTransform: "capitalize" },
  section: { marginBottom: 16 },
  label: { color: "#94a3b8", fontSize: 13, marginBottom: 4 },
  value: { color: "#e2e8f0", fontSize: 15 },
  fare: { color: "#fff", fontSize: 20, fontWeight: "700" },
  surge: { color: "#ef4444", fontSize: 13, marginTop: 4 },
  button: { padding: 14, borderRadius: 12, alignItems: "center", marginTop: 12 },
  cancelButton: { backgroundColor: "#ef4444" },
  completeButton: { backgroundColor: "#22c55e" },
  rateButton: { backgroundColor: "#3b82f6" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  rateSection: { marginTop: 16 },
  input: { backgroundColor: "#1e293b", color: "#fff", padding: 12, borderRadius: 10, marginBottom: 8, fontSize: 15 },
  backButton: { marginTop: 20 },
  backText: { color: "#94a3b8", fontSize: 15 },
  error: { color: "#ef4444", fontSize: 16, textAlign: "center", marginTop: 40 }
});
