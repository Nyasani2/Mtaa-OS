import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useDriverStore } from "@/lib/mtruck/hooks/use-driver-store";
import { DriverCard } from "@/lib/mtruck/components/DriverCard";

export default function DriversScreen() {
  const { drivers } = useDriverStore();
  const stats = { active: drivers.filter((d) => d.status === "on_duty").length, offDuty: drivers.filter((d) => d.status === "off_duty").length, resting: drivers.filter((d) => d.status === "resting").length };
  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsRow}>
        {Object.entries(stats).map(([status, count]) => (
          <View key={status} style={styles.statBox}>
            <Text style={styles.statValue}>{count}</Text>
            <Text style={styles.statLabel}>{status.replace("_", " ").toUpperCase()}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sectionTitle}>All Drivers</Text>
      {drivers.map((driver) => <DriverCard key={driver.id} driver={driver} />)}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 10, marginTop: 12, marginBottom: 8 },
  statBox: { flex: 1, backgroundColor: "#1E293B", borderRadius: 12, padding: 12, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "bold", color: "white" },
  statLabel: { fontSize: 10, color: "#94A3B8", marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "white", marginTop: 20, marginBottom: 12, paddingHorizontal: 20 },
});
