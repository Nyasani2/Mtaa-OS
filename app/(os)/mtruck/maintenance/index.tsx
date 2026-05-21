import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useMaintenanceStore } from "@/lib/mtruck/hooks/use-maintenance-store";
import { MaintenanceItem } from "@/lib/mtruck/components/MaintenanceItem";

export default function MaintenanceScreen() {
  const { scheduled, overdue, completed } = useMaintenanceStore();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryBox, { borderColor: "#F59E0B" }]}><Text style={styles.summaryCount}>{scheduled.length}</Text><Text style={styles.summaryLabel}>Scheduled</Text></View>
        <View style={[styles.summaryBox, { borderColor: "#EF4444" }]}><Text style={styles.summaryCount}>{overdue.length}</Text><Text style={styles.summaryLabel}>Overdue</Text></View>
        <View style={[styles.summaryBox, { borderColor: "#10B981" }]}><Text style={styles.summaryCount}>{completed.length}</Text><Text style={styles.summaryLabel}>Completed</Text></View>
      </View>
      {overdue.length > 0 && <><Text style={[styles.sectionTitle, { color: "#EF4444" }]}>Overdue</Text>{overdue.map((item) => <MaintenanceItem key={item.id} item={item} urgent />)}</>}
      <Text style={styles.sectionTitle}>Scheduled</Text>
      {scheduled.map((item) => <MaintenanceItem key={item.id} item={item} />)}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  summaryRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginTop: 12, marginBottom: 8 },
  summaryBox: { flex: 1, backgroundColor: "#1E293B", borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1 },
  summaryCount: { fontSize: 22, fontWeight: "bold", color: "white" },
  summaryLabel: { fontSize: 11, color: "#94A3B8", marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "white", marginTop: 20, marginBottom: 12, paddingHorizontal: 20 },
});
