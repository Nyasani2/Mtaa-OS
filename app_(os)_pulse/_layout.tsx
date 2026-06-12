// app/(os)/pulse/_layout.tsx
// MTAA Pulse — Main Layout

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Stack, useRouter } from "expo-router";
import { Search, Bell, Bookmark } from "lucide-react-native";
import { usePulseStore } from "@/domains/pulse/state/store";

export default function PulseLayout() {
  const router = useRouter();
  const unreadCount = usePulseStore((s) => s.unreadCount);

  return (
    <View style={{ flex: 1, backgroundColor: "#0f0f1a" }}>
      <View style={styles.header}>
        <Text style={styles.logo}>⚡ Pulse</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(os)/pulse/search")}>
            <Search size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(os)/pulse/saved")}>
            <Bookmark size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(os)/pulse/alerts")}>
            <Bell size={20} color="#fff" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="search" />
        <Stack.Screen name="saved" />
        <Stack.Screen name="events" />
        <Stack.Screen name="creators" />
        <Stack.Screen name="businesses" />
        <Stack.Screen name="communities" />
        <Stack.Screen name="analytics" />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    backgroundColor: "#0f0f1a",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  logo: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
