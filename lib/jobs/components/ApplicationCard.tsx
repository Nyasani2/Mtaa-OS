import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { JobApplication } from "@/lib/jobs/types";

interface Props {
  app: JobApplication;
}

export function ApplicationCard({ app }: Props) {
  const statusColors: Record<string, string> = { pending: "#F59E0B", reviewing: "#6366F1", interview: "#8B5CF6", offer: "#10B981", rejected: "#EF4444", hired: "#3B82F6" };
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.jobTitle}>{(app as any).jobs?.title || "Job"}</Text>
        <View style={[styles.badge, { backgroundColor: statusColors[app.status] + "20" }]}>
          <Text style={[styles.badgeText, { color: statusColors[app.status] }]}>{app.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.meta}>Applied {app.appliedAt}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, marginBottom: 8, marginHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  jobTitle: { color: "white", fontSize: 15, fontWeight: "600", flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: "bold" },
  meta: { color: "#94A3B8", fontSize: 12 },
});

