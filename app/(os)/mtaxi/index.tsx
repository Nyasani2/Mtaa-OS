import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { requestRide } from "@/lib/mtaxi/services/rideService";
import VehicleSelector from "@/lib/mtaxi/components/VehicleSelector";
import FareEstimateCard from "@/lib/mtaxi/components/FareEstimateCard";
import LocationInput from "@/lib/mtaxi/components/LocationInput";
import { useFareEstimate } from "@/lib/mtaxi/hooks/useFareEstimate";
import type { VehicleType, GeoLocation } from "@/lib/mtaxi/types";

export default function MtaxiHomeScreen() {
  const router = useRouter();
  const { estimate, loading: fareLoading, calculate } = useFareEstimate();

  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("sedan");
  const [requesting, setRequesting] = useState(false);

  const handleEstimate = useCallback(async () => {
    if (!pickup || !dropoff) { Alert.alert("Error", "Enter both locations"); return; }
    const pickupLoc: GeoLocation = { lat: -1.2921, lng: 36.8219, address: pickup };
    const dropoffLoc: GeoLocation = { lat: -1.3, lng: 36.83, address: dropoff };
    await calculate(pickupLoc, dropoffLoc, vehicleType);
  }, [pickup, dropoff, vehicleType, calculate]);

  const handleRequest = useCallback(async () => {
    if (!pickup || !dropoff) { Alert.alert("Error", "Enter pickup and dropoff locations"); return; }
    setRequesting(true);
    try {
      const pickupLoc: GeoLocation = { lat: -1.2921, lng: 36.8219, address: pickup };
      const dropoffLoc: GeoLocation = { lat: -1.3, lng: 36.83, address: dropoff };
      const ride = await requestRide(pickupLoc, dropoffLoc, "instant", vehicleType);
      Alert.alert("Ride Requested", `Code: ${ride.ride_code}`, [
        { text: "Track", onPress: () => router.push(`/(os)/mtaxi/ride/${ride.id}`) },
        { text: "OK", style: "cancel" }
      ]);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to request ride");
    } finally {
      setRequesting(false);
    }
  }, [pickup, dropoff, vehicleType, router]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>🚕 mTaxi</Text>
        <Text style={styles.subheader}>Request a ride</Text>

        <LocationInput label="Pickup Location" value={pickup} onChangeText={setPickup} placeholder="Enter pickup address" />
        <LocationInput label="Dropoff Location" value={dropoff} onChangeText={setDropoff} placeholder="Enter destination" />

        <VehicleSelector selected={vehicleType} onSelect={setVehicleType} />

        <TouchableOpacity style={styles.estimateButton} onPress={handleEstimate} disabled={fareLoading}>
          <Text style={styles.estimateText}>{fareLoading ? "Calculating..." : "Get Fare Estimate"}</Text>
        </TouchableOpacity>

        <FareEstimateCard estimate={estimate} loading={fareLoading} />

        <TouchableOpacity style={[styles.button, requesting && styles.buttonDisabled]} onPress={handleRequest} disabled={requesting}>
          {requesting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Request Ride</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(os)/mtaxi/rides")}>
          <Text style={styles.secondaryButtonText}>My Rides</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(os)/mtaxi/carpool")}>
          <Text style={styles.secondaryButtonText}>Carpool</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push("/(os)/mtaxi/driver")}>
          <Text style={styles.secondaryButtonText}>Driver Mode</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  header: { fontSize: 32, fontWeight: "bold", color: "#f59e0b", marginTop: 40, marginBottom: 4 },
  subheader: { fontSize: 16, color: "#94a3b8", marginBottom: 24 },
  estimateButton: { backgroundColor: "#334155", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 8 },
  estimateText: { color: "#e2e8f0", fontSize: 15, fontWeight: "600" },
  button: { backgroundColor: "#f59e0b", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  secondaryButton: { backgroundColor: "#1e293b", padding: 14, borderRadius: 12, alignItems: "center", marginTop: 10, borderWidth: 1, borderColor: "#334155" },
  secondaryButtonText: { color: "#e2e8f0", fontSize: 15, fontWeight: "600" }
});
