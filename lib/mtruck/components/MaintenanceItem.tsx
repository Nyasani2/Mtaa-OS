import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { MaintenanceRecord } from "@/lib/mtruck/types";

interface Props {
  item: MaintenanceRecord;
  urgent?: boolean;
}

export function MaintenanceItem({ item, urgent }: Props) {
  const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = { oil_change: "water", tire: "disc", brake: "stop", engine: "hardware-chip", inspection: "clipboard", other: "construct" };
  return (
    <View style={[styles.card, urgent && styles.urgentCard]}>
      <View style={[styles.iconBox, { backgroundColor: urgent ? "#EF444420" : "#F59E0B20" }]}>
        <Ionicons name={typeIcons[item.type] || "construct"} size={18} color={urgent ? "#EF4444" : "#F59E0B"} />
      </View>
      <View style={styles.info}>
        <Text style={styles.desc}>{item.description}</Text>
        <Text style={styles.meta}>Truck {item.truck_id} • {item.scheduled_date}</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: urgent ? "#EF4444" : "#F59E0B" }]}>
        <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 12, padding: 12, marginBottom: 8, marginHorizontal: 16, gap: 10 },
  urgentCard: { borderWidth: 1, borderColor: "#EF444440" },
  iconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  info: { flex: 1 },
  desc: { color: "white", fontSize: 14 },
  meta: { color: "#94A3B8", fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: "white", fontSize: 10, fontWeight: "bold" },
});
