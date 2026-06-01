import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

interface NotificationPref {
  app: string;
  icon: string;
  enabled: boolean;
  channels: { label: string; enabled: boolean }[];
}

export default function NotificationsPrefsScreen() {
  const router = useRouter();
  const [prefs, setPrefs] = useState<NotificationPref[]>([
    {
      app: "Wallet",
      icon: "wallet-outline",
      enabled: true,
      channels: [
        { label: "Payments", enabled: true },
        { label: "Escrow", enabled: true },
        { label: "Go Fund", enabled: false },
      ],
    },
    {
      app: "Messages",
      icon: "chatbubble-outline",
      enabled: true,
      channels: [
        { label: "Direct Messages", enabled: true },
        { label: "Group Messages", enabled: true },
      ],
    },
    {
      app: "Jobs",
      icon: "briefcase-outline",
      enabled: false,
      channels: [
        { label: "New Listings", enabled: false },
        { label: "Applications", enabled: false },
      ],
    },
    {
      app: "MTaxi",
      icon: "car-outline",
      enabled: true,
      channels: [
        { label: "Ride Updates", enabled: true },
        { label: "Promotions", enabled: false },
      ],
    },
  ]);

  const toggleApp = (index: number) => {
    setPrefs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, enabled: !p.enabled } : p))
    );
  };

  const toggleChannel = (appIndex: number, channelIndex: number) => {
    setPrefs((prev) =>
      prev.map((p, i) =>
        i === appIndex
          ? {
              ...p,
              channels: p.channels.map((c, j) =>
                j === channelIndex ? { ...c, enabled: !c.enabled } : c
              ),
            }
          : p
      )
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      {prefs.map((pref, i) => (
        <View key={i} style={styles.section}>
          <View style={styles.appHeader}>
            <View style={styles.appLeft}>
              <Ionicons name={pref.icon as any} size={20} color="#6366F1" />
              <Text style={styles.appName}>{pref.app}</Text>
            </View>
            <Switch
              value={pref.enabled}
              onValueChange={() => toggleApp(i)}
              trackColor={{ false: "#334155", true: "#6366F1" }}
            />
          </View>
          {pref.enabled &&
            pref.channels.map((channel, j) => (
              <View key={j} style={styles.channelRow}>
                <Text style={styles.channelLabel}>{channel.label}</Text>
                <Switch
                  value={channel.enabled}
                  onValueChange={() => toggleChannel(i, j)}
                  trackColor={{ false: "#334155", true: "#6366F1" }}
                />
              </View>
            ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  section: { backgroundColor: "#1a1a1a", marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16 },
  appHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  appLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  appName: { color: "#fff", fontSize: 16, fontWeight: "600" },
  channelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#0a0a0a" },
  channelLabel: { color: "#94A3B8", fontSize: 14 },
});
