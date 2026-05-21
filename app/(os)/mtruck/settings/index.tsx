import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const settings = [
  { id: "notifications", label: "Push Notifications", icon: "notifications", type: "toggle", value: true },
  { id: "tracking", label: "Background Tracking", icon: "location", type: "toggle", value: true },
  { id: "fuel_alerts", label: "Fuel Price Alerts", icon: "flame", type: "toggle", value: false },
  { id: "maintenance", label: "Maintenance Reminders", icon: "construct", type: "toggle", value: true },
  { id: "units", label: "Units & Measurements", icon: "options", type: "link" },
  { id: "region", label: "Operating Region", icon: "globe", type: "link" },
  { id: "api", label: "API Integration", icon: "code", type: "link" },
];

export default function MTruckSettingsScreen() {
  const [values, setValues] = useState<Record<string, boolean>>({ notifications: true, tracking: true, fuel_alerts: false, maintenance: true });
  const toggle = (id: string) => setValues((prev) => ({ ...prev, [id]: !prev[id] }));
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>MTruck Settings</Text>
      {settings.map((setting) => (
        <View key={setting.id} style={styles.row}>
          <View style={styles.left}>
            <View style={styles.iconBox}><Ionicons name={setting.icon as any} size={20} color="#6366F1" /></View>
            <Text style={styles.label}>{setting.label}</Text>
          </View>
          {setting.type === "toggle" ? <Switch value={values[setting.id]} onValueChange={() => toggle(setting.id)} trackColor={{ false: "#334155", true: "#6366F1" }} thumbColor={values[setting.id] ? "white" : "#94A3B8"} /> : <Ionicons name="chevron-forward" size={20} color="#64748B" />}
        </View>
      ))}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  title: { fontSize: 24, fontWeight: "bold", color: "white", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1E293B", padding: 16, marginHorizontal: 16, marginBottom: 8, borderRadius: 12 },
  left: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#6366F120", justifyContent: "center", alignItems: "center" },
  label: { color: "white", fontSize: 15 },
});
