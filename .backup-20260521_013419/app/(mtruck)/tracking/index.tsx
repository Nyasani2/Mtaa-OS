import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTrackingStore } from "@/lib/mtruck/hooks/use-tracking-store";
import { TruckLocationCard } from "@/lib/mtruck/components/TruckLocationCard";

export default function TrackingScreen() {
  const { load } = useLocalSearchParams();
  const { trucks, refresh, loading } = useTrackingStore();
  const [selectedTruck, setSelectedTruck] = useState<string | null>(null);

  useEffect(() => { refresh(); const interval = setInterval(refresh, 30000); return () => clearInterval(interval); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Ionicons name="map-outline" size={64} color="#334155" />
        <Text style={styles.mapText}>Live Fleet Map</Text>
        <Text style={styles.mapSubtext}>{trucks.length} trucks tracked</Text>
      </View>
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle}>Fleet Status</Text>
          {loading && <ActivityIndicator size="small" color="#6366F1" />}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.truckList}>
          {trucks.map((truck) => (
            <TouchableOpacity key={truck.id} style={[styles.truckChip, selectedTruck === truck.id && styles.truckChipActive]} onPress={() => setSelectedTruck(truck.id)}>
              <Ionicons name="bus" size={18} color={selectedTruck === truck.id ? "white" : "#94A3B8"} />
              <Text style={[styles.truckChipText, selectedTruck === truck.id && styles.truckChipTextActive]}>{truck.registration}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {selectedTruck && <TruckLocationCard truck={trucks.find((t) => t.id === selectedTruck)!} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  mapPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F172A", margin: 12, borderRadius: 16 },
  mapText: { color: "#94A3B8", fontSize: 18, fontWeight: "bold", marginTop: 12 },
  mapSubtext: { color: "#64748B", fontSize: 14, marginTop: 4 },
  panel: { backgroundColor: "#1E293B", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: "45%" },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  panelTitle: { fontSize: 16, fontWeight: "bold", color: "white" },
  truckList: { flexGrow: 0, marginBottom: 12 },
  truckChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#0F172A", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, gap: 6 },
  truckChipActive: { backgroundColor: "#6366F1" },
  truckChipText: { color: "#94A3B8", fontSize: 13, fontWeight: "600" },
  truckChipTextActive: { color: "white" },
});
