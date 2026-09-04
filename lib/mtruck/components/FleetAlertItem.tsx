import React from "react";
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { FleetAlert } from "@/lib/mtruck/types";

interface Props {
  alert: FleetAlert;
}

export function FleetAlertItem({ alert }: Props) {
  const severityColors: Record<string, string> = { low: "#3B82F6", medium: "#F59E0B", high: "#EF4444", critical: "#DC2626" };
  const typeIcons: Record<string, keyof typeof Ionicons.glyphMap> = { maintenance: "construct", delay: "time", fuel: "flame", safety: "warning", customs: "document" };
  return (
    <View style={[styles.card, { borderLeftColor: severityColors[alert.severity] }]}>
      <Ionicons name={typeIcons[alert.type] || "alert"} size={20} color={severityColors[alert.severity]} />
      <View style={styles.content}>
        <Text style={styles.message}>{alert.message}</Text>
        <Text style={styles.meta}>{alert.severity.toUpperCase()} • {alert.created_at}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#1E293B", borderRadius: 10, padding: 12, marginBottom: 8, marginHorizontal: 16, borderLeftWidth: 3, gap: 10 },
  content: { flex: 1 },
  message: { color: "white", fontSize: 14 },
  meta: { color: "#64748B", fontSize: 11, marginTop: 2 },
});
