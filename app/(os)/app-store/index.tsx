import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

const apps = [
  {
    id: "gallery",
    name: "Gallery",
    icon: "🖼️",
  },
  {
    id: "documents",
    name: "Documents",
    icon: "📁",
  },
  {
    id: "calendar",
    name: "Calendar",
    icon: "📅",
  },
  {
    id: "wifi",
    name: "WiFi",
    icon: "📶",
  },
  {
    id: "clock",
    name: "Clock",
    icon: "⏰",
  },
];

export default function AppStoreScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>MTAA App Store</Text>

      {apps.map((app) => (
        <TouchableOpacity key={app.id} style={styles.card}>
          <Text style={styles.icon}>{app.icon}</Text>

          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{app.name}</Text>
            <Text style={styles.desc}>
              Install and manage MTAA OS apps
            </Text>
          </View>

          <TouchableOpacity style={styles.installBtn}>
            <Text style={styles.installText}>OPEN</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050816",
    padding: 16,
  },

  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "700",
    marginTop: 50,
    marginBottom: 24,
  },

  card: {
    backgroundColor: "#111827",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  icon: {
    fontSize: 32,
    marginRight: 16,
  },

  name: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
  },

  desc: {
    color: "#9CA3AF",
    marginTop: 4,
  },

  installBtn: {
    backgroundColor: "#2563EB",
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },

  installText: {
    color: "white",
    fontWeight: "700",
  },
});
