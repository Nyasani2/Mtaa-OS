import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function StreetsHome() {
  const router = useRouter();
  const actions = [
    { label: "Map", icon: "map", route: "/(os)/streets/map", color: "#6366F1" },
    { label: "Report", icon: "alert-circle", route: "/(os)/streets/report", color: "#EF4444" },
    { label: "Services", icon: "business", route: "/(os)/streets/services", color: "#10B981" },
  ];
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Streets</Text>
        <Text style={styles.subtitle}>City navigation & civic reporting</Text>
      </View>
      <View style={styles.actionsRow}>
        {actions.map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route as any)}>
            <View style={[styles.actionIcon, { backgroundColor: a.color + "20" }]}>
              <Ionicons name={a.icon as any} size={22} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.betaBanner}>
        <Ionicons name="construct" size={20} color="#F59E0B" />
        <Text style={styles.betaText}>Street intelligence engine connecting to civic infrastructure. Full mapping integration coming in Phase 2.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "white" },
  subtitle: { color: "#94A3B8", fontSize: 14, marginTop: 4 },
  actionsRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginBottom: 20 },
  actionBtn: { alignItems: "center" },
  actionIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { color: "white", fontSize: 12 },
  betaBanner: { flexDirection: "row", alignItems: "center", backgroundColor: "#F59E0B20", borderRadius: 12, padding: 16, margin: 20, gap: 10 },
  betaText: { color: "#F59E0B", fontSize: 13, flex: 1, lineHeight: 18 },
});
