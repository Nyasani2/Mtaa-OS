import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  value: number | string;
  change: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

export function FleetStatCard({ label, value, change, icon, color }: Props) {
  const isPositive = change >= 0;
  return (
    <View style={[styles.card, { borderColor: color + "30" }]}>
      <View style={styles.top}>
        <View style={[styles.iconBox, { backgroundColor: color + "20" }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <View style={[styles.changeBadge, { backgroundColor: isPositive ? "#10B98120" : "#EF444420" }]}>
          <Text style={[styles.changeText, { color: isPositive ? "#10B981" : "#EF4444" }]}>{isPositive ? "+" : ""}{change}%</Text>
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: "#1E293B", borderRadius: 14, padding: 14, borderWidth: 1 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  iconBox: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  changeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  changeText: { fontSize: 11, fontWeight: "bold" },
  value: { fontSize: 22, fontWeight: "bold", color: "white" },
  label: { fontSize: 12, color: "#94A3B8", marginTop: 4 },
});
