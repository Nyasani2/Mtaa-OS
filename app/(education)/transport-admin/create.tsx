import React, { useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Ionicons } from '@expo/vector-icons';

export default function CreateTransportRouteScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [routeName, setRouteName] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [stops, setStops] = useState("");
  const [schedule, setSchedule] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!routeName.trim() || !vehicleId.trim() || !driverId.trim()) {
      Alert.alert("Required", "Route name, vehicle and driver are required.");
      return;
    }
    if (!user?.id) { Alert.alert("Error", "Not authenticated"); return; }

    setLoading(true);
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_transport_routes").insert({
        route_name: routeName.trim(),
        vehicle_id: vehicleId.trim(),
        driver_id: driverId.trim(),
        stops: stops.trim() || null,
        schedule: schedule.trim() || null,
        created_by: user.id,
        status: "active",
      });
      if (error) throw error;
      Alert.alert("Success", "Transport route created.");
      router.back();
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to create route");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.title}>New Transport Route</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Route Name</Text>
        <TextInput style={styles.input} value={routeName} onChangeText={setRouteName} placeholder="e.g. Route A - CBD to School" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Vehicle ID</Text>
        <TextInput style={styles.input} value={vehicleId} onChangeText={setVehicleId} placeholder="Enter vehicle ID" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Driver ID</Text>
        <TextInput style={styles.input} value={driverId} onChangeText={setDriverId} placeholder="Enter driver ID" placeholderTextColor="#64748b" />
        <Text style={styles.label}>Stops (comma separated)</Text>
        <TextInput style={[styles.input, { height: 80 }]} value={stops} onChangeText={setStops} multiline placeholder="Stop 1, Stop 2, Stop 3..." placeholderTextColor="#64748b" />
        <Text style={styles.label}>Schedule</Text>
        <TextInput style={styles.input} value={schedule} onChangeText={setSchedule} placeholder="e.g. 7:00 AM - 4:00 PM" placeholderTextColor="#64748b" />
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Route</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  title: { color: "#e2e8f0", fontSize: 18, fontWeight: "700" },
  form: { padding: 16 },
  label: { color: "#94a3b8", fontSize: 14, marginTop: 16, marginBottom: 6 },
  input: { backgroundColor: "#1e293b", color: "#e2e8f0", borderRadius: 10, padding: 14, fontSize: 15, borderWidth: 1, borderColor: "#334155" },
  button: { backgroundColor: "#60a5fa", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  buttonText: { color: "#0f172a", fontSize: 16, fontWeight: "700" },
});
