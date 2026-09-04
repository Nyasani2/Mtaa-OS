// lib/mtaxi/components/BodaRequest.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, Navigation, CreditCard, Wallet, Banknote, Bike, Package, Users } from "lucide-react-native";
import { useRides } from "../hooks/useRides";
import { useAuthStore as useAuth } from "@/lib/auth/store/auth.store";
import type { VehicleType, PaymentMethod } from "../types";

const BODA_TYPES: { type: VehicleType; label: string; base: string; icon: typeof Bike; color: string; desc: string }[] = [
  { type: "boda", label: "Standard Boda", base: "$1.00", icon: Bike, color: "#f59e0b", desc: "1 passenger · Helmet included" },
  { type: "boda_xl", label: "Boda XL", base: "$1.50", icon: Users, color: "#3b82f6", desc: "2 passengers · Extra storage" },
  { type: "boda_delivery", label: "Boda Delivery", base: "$2.00", icon: Package, color: "#10b981", desc: "Packages up to 10kg" },
];

const PAYMENT_METHODS: { key: PaymentMethod; label: string; icon: typeof Wallet }[] = [
  { key: "wallet", label: "MTAA Wallet", icon: Wallet },
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "card", label: "Credit Card", icon: CreditCard },
];

export default function BodaRequest() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { createRide, getFare, loading, error } = useRides(user?.id || "");

  const [pickupAddress, setPickupAddress] = useState("Current Location");
  const [dropoffAddress, setDropoffAddress] = useState((params.dropoffAddress as string) || "");
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>((params.rideType as VehicleType) || "boda");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [fare, setFare] = useState<{ total: number; distance: number } | null>(null);
  const [estimating, setEstimating] = useState(false);

  const pickupLat = -1.2921;
  const pickupLng = 36.8219;
  const dropoffLat = params.dropoffLat ? parseFloat(params.dropoffLat as string) : -1.3;
  const dropoffLng = params.dropoffLng ? parseFloat(params.dropoffLng as string) : 36.83;

  const estimate = async () => {
    if (!dropoffAddress) { Alert.alert("Error", "Please enter a destination"); return; }
    setEstimating(true);
    try {
      const result = await getFare({ lat: pickupLat, lng: pickupLng }, { lat: dropoffLat, lng: dropoffLng }, selectedVehicle);
      setFare({ total: result.total_fare, distance: result.distance_km });
    } catch (e: any) {
      Alert.alert("Estimate Error", e.message);
    } finally {
      setEstimating(false);
    }
  };

  const handleRequest = async () => {
    if (!fare) { Alert.alert("Error", "Please get a fare estimate first"); return; }
    try {
      const ride = await createRide({
        pickup: { lat: pickupLat, lng: pickupLng, address: pickupAddress },
        dropoff: { lat: dropoffLat, lng: dropoffLng, address: dropoffAddress },
        ride_type: selectedVehicle,
        payment_method: paymentMethod,
      });
      router.push({ pathname: "/(mtaxi)/tracking", params: { rideId: ride.id } });
    } catch (e: any) {
      Alert.alert("Request Failed", e.message);
    }
  };

  const handleVehicleSelect = (type: VehicleType) => {
    setSelectedVehicle(type);
    setFare(null);
  };

  const getButtonText = () => {
    if (loading) return "Requesting...";
    if (!fare) return `Request ${selectedVehicle}`;
    return `Request ${selectedVehicle} — $${fare.total.toFixed(2)}`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Bike size={28} color="#f59e0b" />
        <Text style={styles.headerTitle}>Request Boda</Text>
      </View>

      <View style={styles.locationBox}>
        <View style={styles.locationRow}>
          <Navigation size={20} color="#10b981" />
          <TextInput style={styles.locationInput} value={pickupAddress} onChangeText={setPickupAddress} placeholder="Pickup location" />
        </View>
        <View style={styles.divider} />
        <View style={styles.locationRow}>
          <MapPin size={20} color="#ef4444" />
          <TextInput style={styles.locationInput} value={dropoffAddress} onChangeText={setDropoffAddress} placeholder="Where to?" />
        </View>
      </View>

      <TouchableOpacity style={styles.estimateBtn} onPress={estimate} disabled={estimating}>
        <Text style={styles.estimateBtnText}>{estimating ? "Calculating..." : "Get Fare Estimate"}</Text>
      </TouchableOpacity>

      {fare && (
        <View style={styles.fareBox}>
          <Text style={styles.fareLabel}>Estimated Fare</Text>
          <Text style={styles.fareAmount}>${fare.total.toFixed(2)}</Text>
          <Text style={styles.fareDetail}>{fare.distance.toFixed(1)} km · {selectedVehicle}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Boda Type</Text>
        {BODA_TYPES.map((v) => (
          <TouchableOpacity key={v.type}
            style={[styles.vehicleCard, selectedVehicle === v.type && { borderColor: v.color, borderWidth: 2 }]}
            onPress={() => handleVehicleSelect(v.type)}>
            <v.icon size={24} color={v.color} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.vehicleLabel}>{v.label}</Text>
              <Text style={styles.vehicleDesc}>{v.desc}</Text>
              <Text style={styles.vehicleBase}>Base: {v.base}</Text>
            </View>
            {selectedVehicle === v.type && <View style={[styles.check, { backgroundColor: v.color }]}><Text style={{ color: "#fff", fontSize: 12 }}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {PAYMENT_METHODS.map((p) => (
          <TouchableOpacity key={p.key}
            style={[styles.paymentCard, paymentMethod === p.key && { borderColor: "#f59e0b", borderWidth: 2 }]}
            onPress={() => setPaymentMethod(p.key)}>
            <p.icon size={20} color="#f59e0b" />
            <Text style={styles.paymentLabel}>{p.label}</Text>
            {paymentMethod === p.key && <View style={[styles.check, { backgroundColor: "#f59e0b" }]}><Text style={{ color: "#fff", fontSize: 12 }}>✓</Text></View>}
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={[styles.requestBtn, (!fare || loading) && { opacity: 0.5 }]} onPress={handleRequest} disabled={!fare || loading}>
        <Text style={styles.requestBtnText}>{getButtonText()}</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingTop: 60, backgroundColor: "#1e293b", justifyContent: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff", marginLeft: 10 },
  locationBox: { margin: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, elevation: 3 },
  locationRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  locationInput: { flex: 1, marginLeft: 12, fontSize: 16, color: "#1a1a1a" },
  divider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 4 },
  estimateBtn: { marginHorizontal: 16, padding: 14, backgroundColor: "#f59e0b", borderRadius: 10, alignItems: "center" },
  estimateBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  fareBox: { margin: 16, padding: 20, backgroundColor: "#fff", borderRadius: 12, alignItems: "center", elevation: 3 },
  fareLabel: { fontSize: 14, color: "#666" },
  fareAmount: { fontSize: 36, fontWeight: "800", color: "#1a1a1a", marginVertical: 4 },
  fareDetail: { fontSize: 14, color: "#666" },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", marginBottom: 10 },
  vehicleCard: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#fff", borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  vehicleLabel: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  vehicleDesc: { fontSize: 12, color: "#666", marginTop: 1 },
  vehicleBase: { fontSize: 12, color: "#999", marginTop: 1 },
  paymentCard: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#fff", borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: "#e5e7eb" },
  paymentLabel: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: "500", color: "#1a1a1a" },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  requestBtn: { margin: 16, padding: 16, backgroundColor: "#10b981", borderRadius: 12, alignItems: "center", marginTop: 30 },
  requestBtnText: { color: "#fff", fontSize: 17, fontWeight: "700" },
  errorText: { color: "#ef4444", textAlign: "center", marginTop: 8 },
});
