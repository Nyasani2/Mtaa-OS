"use client";

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router, usePathname } from "expo-router";
import { IdCard, Car, AlertTriangle, FileText, MapPin, Search } from "lucide-react-native";

const navItems = [
  { icon: IdCard, label: "Licenses", path: "/(os)/transport/licenses" },
  { icon: Car, label: "Vehicles", path: "/(os)/transport/vehicles" },
  { icon: AlertTriangle, label: "Offences", path: "/(os)/transport/offences" },
  { icon: FileText, label: "Apply", path: "/(os)/transport/apply" },
  { icon: MapPin, label: "Incidents", path: "/(os)/transport/incidents" },
  { icon: Search, label: "Search", path: "/(os)/transport/search" },
];

export function TransportNav() {
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
            <item.icon size={20} color={isActive ? "#2563EB" : "#94A3B8"} />
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
  navLabelActive: { color: "#2563EB", fontWeight: "600" },
});

