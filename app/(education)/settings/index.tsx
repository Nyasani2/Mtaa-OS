// @ts-nocheck
import React, { useState } from "react";
import { Alert, View, Text, TouchableOpacity, ScrollView, StyleSheet, Switch, Alert } from "react-native";
import { Alert, useRouter } from "expo-router";
import { Alert, useAuthStore } from "@/lib/auth/store/auth.store";
import { Alert, Ionicons } from "@expo/vector-icons";

export default function EducationSettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => router.replace("/(os)/auth") },
    ]);
  };

  const SettingRow = ({ icon, label, value, onToggle }: any) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={22} color="#60a5fa" />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ false: "#334155", true: "#60a5fa" }} thumbColor={value ? "#fff" : "#94a3b8"} />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#e2e8f0" />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.section}>Preferences</Text>
        <SettingRow icon="notifications-outline" label="Push Notifications" value={notifications} onToggle={setNotifications} />
        <SettingRow icon="moon-outline" label="Dark Mode" value={darkMode} onToggle={setDarkMode} />
        <SettingRow icon="sync-outline" label="Auto Sync" value={autoSync} onToggle={setAutoSync} />

        <Text style={styles.section}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={() => router.push("/(os as any)/profile" as any)}>
          <View style={styles.rowLeft}>
            <Ionicons name="person-outline" size={22} color="#60a5fa" />
            <Text style={styles.rowLabel}>My Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => router.push("/(os as any)/wallet" as any)}>
          <View style={styles.rowLeft}>
            <Ionicons name="wallet-outline" size={22} color="#60a5fa" />
            <Text style={styles.rowLabel}>Wallet</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.row, { marginTop: 24 }]} onPress={handleLogout}>
          <View style={styles.rowLeft}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={[styles.rowLabel, { color: "#ef4444" }]}>Log Out</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ef4444" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  title: { color: "#e2e8f0", fontSize: 18, fontWeight: "700" },
  form: { padding: 16 },
  section: { color: "#64748b", fontSize: 13, fontWeight: "700", textTransform: "uppercase", marginTop: 24, marginBottom: 8, letterSpacing: 1 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#1e293b", padding: 16, borderRadius: 12, marginBottom: 8 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowLabel: { color: "#e2e8f0", fontSize: 15, marginLeft: 12 },
});
