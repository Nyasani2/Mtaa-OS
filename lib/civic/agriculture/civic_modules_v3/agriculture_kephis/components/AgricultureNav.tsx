"use client";

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router, usePathname } from "expo-router";
import { FileCheck, Sprout, Bug, TrendingUp, ClipboardList, Search } from "lucide-react-native";

const navItems = [
  { icon: FileCheck, label: "Certs", path: "/(os)/agriculture/certificates" },
  { icon: Sprout, label: "Seeds", path: "/(os)/agriculture/seed-licenses" },
  { icon: Bug, label: "Pests", path: "/(os)/agriculture/pest-reports" },
  { icon: TrendingUp, label: "Prices", path: "/(os)/agriculture/market-prices" },
  { icon: ClipboardList, label: "Apply", path: "/(os)/agriculture/apply" },
  { icon: Search, label: "Verify", path: "/(os)/agriculture/verify" },
];

export function AgricultureNav() {
  const pathname = usePathname();

  return (
    <View style={styles.navBar}>
      {navItems.map((item, index) => {
        const isActive = pathname === item.path;
        return (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => router.push(item.path)}
          >
            <item.icon size={20} color={isActive ? "#059669" : "#94A3B8"} />
            <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{item.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  navItem: { alignItems: "center", paddingHorizontal: 4 },
  navLabel: { fontSize: 10, color: "#94A3B8", marginTop: 2 },
  navLabelActive: { color: "#059669", fontWeight: "600" },
});

