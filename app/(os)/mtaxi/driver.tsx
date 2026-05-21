import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, Alert } from "react-native";
import { useDriverProfile, useDriverLocation } from "@/lib/mtaxi/hooks/useDriver";

export default function DriverModeScreen() {
  const { profile, loading, goOnline, goOffline } = useDriverProfile();
  const { updateLocation } = useDriverLocation();
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    if (profile) setIsOnline(profile.status === "online");
  }, [profile]);

  const handleToggle = async (value: boolean) => {
    setIsOnline(value);
    try {
      if (value) {
        await goOnline();
        // Start location updates
        await updateLocation(-1.2921, 36.8219);
        Alert.alert("Online", "You are now accepting rides");
      } else {
        await goOffline();
        Alert.alert("Offline", "You are no longer accepting rides");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
      setIsOnline(!value);
    }
  };

  if (loading) return <View style={styles.container}><Text style={styles.loading}>Loading...</Text></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚕 Driver Mode</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Status</Text>
        <View style={styles.statusRow}>
          <Text style={[styles.statusText, isOnline ? styles.online : styles.offline]}>
            {isOnline ? "🟢 Online" : "🔴 Offline"}
          </Text>
          <Switch value={isOnline} onValueChange={handleToggle} trackColor={{ false: "#334155", true: "#22c55e" }} thumbColor={isOnline ? "#fff" : "#94a3b8"} />
        </View>
      </View>

      {profile && (
        <View style={styles.card}>
          <Text style={styles.label}>Stats</Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.total_rides}</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>KES {profile.total_earnings?.toFixed(0) || 0}</Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{profile.rating || 5}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={() => Alert.alert("Coming Soon", "Ride requests will appear here")}>
        <Text style={styles.buttonText}>View Ride Requests</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a", padding: 16 },
  header: { fontSize: 28, fontWeight: "bold", color: "#f59e0b", marginTop: 40, marginBottom: 24 },
  loading: { color: "#94a3b8", fontSize: 16, textAlign: "center", marginTop: 40 },
  card: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 },
  label: { color: "#94a3b8", fontSize: 13, marginBottom: 12 },
  statusRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  statusText: { fontSize: 18, fontWeight: "600" },
  online: { color: "#22c55e" },
  offline: { color: "#ef4444" },
  statsRow: { flexDirection: "row", justifyContent: "space-around" },
  stat: { alignItems: "center" },
  statValue: { color: "#fff", fontSize: 20, fontWeight: "700" },
  statLabel: { color: "#94a3b8", fontSize: 12, marginTop: 4 },
  button: { backgroundColor: "#f59e0b", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" }
});
