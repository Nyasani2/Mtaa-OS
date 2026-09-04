// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import type { Truck } from "@/lib/mtruck/types";

interface Props {
  truck: Truck;
}

export function TruckCard({ truck }: Props) {
  const statusColors: Record<string, string> = { active: "#10B981", idle: "#F59E0B", maintenance: "#EF4444", offline: "#64748B" };
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <View style={[styles.iconBox, { backgroundColor: statusColors[truck.status] + "20" }]}>
          <Ionicons name="bus" size={20} color={statusColors[truck.status]} />
        </View>
        <View>
          <Text style={styles.reg}>{(truck as any).registration_number}</Text>
          <Text style={styles.status}>{truck.status.toUpperCase()}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748B" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16 },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  reg: { color: "white", fontSize: 15, fontWeight: "600" },
  status: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
});
