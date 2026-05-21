import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { VehicleType } from "../types";

const VEHICLES: { type: VehicleType; label: string; icon: string; baseRate: number }[] = [
  { type: "boda", label: "Boda Boda", icon: "🏍️", baseRate: 30 },
  { type: "tuk_tuk", label: "Tuk Tuk", icon: "🛺", baseRate: 40 },
  { type: "sedan", label: "Sedan", icon: "🚗", baseRate: 50 },
  { type: "van", label: "Van", icon: "🚐", baseRate: 60 },
  { type: "truck", label: "Truck", icon: "🚛", baseRate: 80 },
];

interface Props { selected: VehicleType; onSelect: (type: VehicleType) => void; }

export default function VehicleSelector({ selected, onSelect }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Vehicle</Text>
      <View style={styles.row}>
        {VEHICLES.map((v) => (
          <TouchableOpacity key={v.type} style={[styles.card, selected === v.type && styles.cardActive]} onPress={() => onSelect(v.type)}>
            <Text style={styles.icon}>{v.icon}</Text>
            <Text style={[styles.label, selected === v.type && styles.labelActive]}>{v.label}</Text>
            <Text style={styles.rate}>KES {v.baseRate}/km</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 12 },
  title: { color: "#fff", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: { backgroundColor: "#1e293b", borderRadius: 12, padding: 12, alignItems: "center", minWidth: 80, borderWidth: 2, borderColor: "transparent" },
  cardActive: { borderColor: "#f59e0b", backgroundColor: "#334155" },
  icon: { fontSize: 24, marginBottom: 4 },
  label: { color: "#94a3b8", fontSize: 12, fontWeight: "500" },
  labelActive: { color: "#f59e0b" },
  rate: { color: "#64748b", fontSize: 10, marginTop: 2 }
});
