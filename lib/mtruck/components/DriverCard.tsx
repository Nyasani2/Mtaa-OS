// @ts-nocheck
import React from "react";
import { View, Text, StyleSheet } from 'react-native';
import type { Driver } from "@/lib/mtruck/types";

interface Props {
  driver: Driver;
}

export function DriverCard({ driver }: Props) {
  const statusColors: Record<string, string> = { on_duty: "#10B981", off_duty: "#64748B", resting: "#F59E0B" };
  return (
    <View style={styles.card}>
      <View style={styles.avatar}><Text style={styles.avatarText}>{(driver as any).full_name[0]}</Text></View>
      <View style={styles.info}>
        <Text style={(styles as any).full_name}>{(driver as any).full_name}</Text>
        <Text style={styles.meta}>{(driver as any).trips_completed} trips • {driver.rating}★</Text>
      </View>
      <View style={[styles.badge, { backgroundColor: statusColors[driver.status] + "20" }]}>
        <Text style={[styles.badgeText, { color: statusColors[driver.status] }]}>{driver.status.replace("_", " ").toUpperCase()}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#6366F1", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "white", fontSize: 16, fontWeight: "bold" },
  info: { flex: 1 },
  name: { color: "white", fontSize: 15, fontWeight: "600" },
  meta: { color: "#94A3B8", fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "bold" },
});
