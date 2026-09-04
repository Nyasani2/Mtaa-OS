// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import type { Load } from "@/lib/mtruck/types";

interface Props {
  load: Load;
  onAssign: () => void;
  onTrack: () => void;
}

export function LoadCard({ load, onAssign, onTrack }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.route}>{typeof load.origin === 'string' ? load.origin : load.origin?.name} → {typeof load.destination === 'string' ? load.destination : load.destination?.name}</Text>
        <Text style={(styles as any).rate_amount}>${(load as any).rate_amount}</Text>
      </View>
      <Text style={styles.detail}>{(load as any).cargo_description} • {load.weight_kg}kg • {(load as any).distance_km}km</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onAssign}>
          <Ionicons name="navigate" size={16} color="#6366F1" />
          <Text style={styles.actionText}>Assign</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onTrack}>
          <Ionicons name="location" size={16} color="#10B981" />
          <Text style={styles.actionText}>Track</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 10, marginHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  route: { color: "white", fontSize: 15, fontWeight: "600", flex: 1 },
  rate: { color: "#10B981", fontSize: 15, fontWeight: "bold" },
  detail: { color: "#94A3B8", fontSize: 13, marginBottom: 10 },
  actions: { flexDirection: "row", gap: 12 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  actionText: { color: "#94A3B8", fontSize: 13 },
});
