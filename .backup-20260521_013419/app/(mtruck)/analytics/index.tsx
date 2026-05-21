import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useAnalyticsStore } from "@/lib/mtruck/hooks/use-analytics-store";
import { MetricCard } from "@/lib/mtruck/components/MetricCard";

export default function AnalyticsScreen() {
  const { metrics } = useAnalyticsStore();
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Fleet Analytics</Text>
      <View style={styles.grid}>
        <MetricCard label="Total Distance" value={`${metrics.totalDistance} km`} change="+12%" color="#F59E0B" />
        <MetricCard label="Fuel Efficiency" value={`${metrics.fuelEfficiency} L/100km`} change="-5%" color="#10B981" />
        <MetricCard label="On-Time Rate" value={`${metrics.onTimeRate}%`} change="+3%" color="#6366F1" />
        <MetricCard label="Cost Per Mile" value={`$${metrics.costPerMile}`} change="-8%" color="#EC4899" />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  title: { fontSize: 24, fontWeight: "bold", color: "white", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 12 },
});
