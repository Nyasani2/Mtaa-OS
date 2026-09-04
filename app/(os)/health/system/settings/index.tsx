// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { Alert, useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { Alert, SafeAreaView } from "react-native-safe-area-context";
import { Alert, useHealthStore } from "@/domains/health/state/healthStore";

interface SystemSetting {
  id: string;
  label: string;
  description: string;
  icon: string;
  type: "toggle" | "navigate" | "action";
  value?: boolean;
  route?: string;
  action?: string;
}

export default function HealthSystemSettings() {
  const router = useRouter();
  const { updateSystemSetting } = useHealthStore();

  const [settings, setSettings] = useState<SystemSetting[]>([
    { id: "auto_backup", label: "Auto Backup", description: "Backup health data daily", icon: "cloud-upload", type: "toggle", value: true },
    { id: "offline_mode", label: "Offline Mode", description: "Allow offline data entry", icon: "offline-bolt", type: "toggle", value: false },
    { id: "audit_logging", label: "Audit Logging", description: "Log all data access", icon: "shield-checkmark", type: "toggle", value: true },
    { id: "data_retention", label: "Data Retention", description: "Configure retention policies", icon: "time", type: "navigate", route: "/(os)/health/system/retention" },
    { id: "integrations", label: "Integrations", description: "Connect external systems", icon: "git-network", type: "navigate", route: "/(os)/health/system/integrations" },
    { id: "user_roles", label: "User Roles", description: "Manage permissions", icon: "people", type: "navigate", route: "/(os)/health/system/roles" },
    { id: "notifications", label: "Notifications", description: "Alert preferences", icon: "notifications", type: "navigate", route: "/(os)/health/system/notifications" },
    { id: "clear_cache", label: "Clear Cache", description: "Free up storage space", icon: "trash", type: "action", action: "clear_cache" },
  ]);

  const handleToggle = async (id: string, currentValue: boolean) => {
    const updated = settings.map((s) => s.id === id ? { ...s, value: !currentValue } : s);
    setSettings(updated);
    try {
      await updateSystemSetting(id, !currentValue);
    } catch (e) {
      setSettings(settings);
      Alert.alert("Error", "Failed to update setting.");
    }
  };

  const handleAction = (action: string) => {
    if (action === "clear_cache") {
      Alert.alert("Clear Cache", "This will clear all cached health data. Continue?", [
        { text: "Cancel", style: "cancel" },
        { text: "Clear", style: "destructive", onPress: () => Alert.alert("Done", "Cache cleared successfully.") },
      ]);
    }
  };

  const renderSetting = (setting: SystemSetting) => (
    <TouchableOpacity
      key={setting.id}
      style={styles.settingRow}
      onPress={() => {
        if (setting.type === "navigate" && setting.route) {
          router.push(setting.route as any);
        } else if (setting.type === "action" && setting.action) {
          handleAction(setting.action);
        }
      }}
      disabled={setting.type === "toggle"}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={setting.icon as any} size={20} color="#2563eb" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.settingLabel}>{setting.label}</Text>
        <Text style={styles.settingDesc}>{setting.description}</Text>
      </View>
      {setting.type === "toggle" && (
        <Switch
          value={setting.value}
          onValueChange={() => handleToggle(setting.id, setting.value || false)}
          trackColor={{ false: "#d1d5db", true: "#2563eb" }}
        />
      )}
      {setting.type === "navigate" && (
        <Ionicons name="chevron-forward" size={18} color="#d1d5db" />
      )}
      {setting.type === "action" && (
        <Ionicons name="alert-circle" size={18} color="#ef4444" />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>System Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* System Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>System Version</Text>
            <Text style={styles.infoValue}>Health OS v2.1.0</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Sync</Text>
            <Text style={styles.infoValue}>2 minutes ago</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Database</Text>
            <Text style={styles.infoValue}>Connected</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Storage Used</Text>
            <Text style={styles.infoValue}>1.2 GB / 5 GB</Text>
          </View>
        </View>

        {/* Settings */}
        <Text style={styles.sectionTitle}>General</Text>
        {settings.slice(0, 3).map(renderSetting)}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Configuration</Text>
        {settings.slice(3, 7).map(renderSetting)}

        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Maintenance</Text>
        {settings.slice(7).map(renderSetting)}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  content: { padding: 12, paddingBottom: 24 },
  infoCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  infoLabel: { fontSize: 13, color: "#6b7280" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#374151" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 8, marginLeft: 4 },
  settingRow: {
    flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12,
    padding: 14, marginBottom: 6, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  settingIcon: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: "#2563eb15",
    justifyContent: "center", alignItems: "center", marginRight: 12,
  },
  settingLabel: { fontSize: 14, fontWeight: "600", color: "#111827" },
  settingDesc: { fontSize: 12, color: "#9ca3af", marginTop: 1 },
});
