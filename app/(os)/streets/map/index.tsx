import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={64} color="#334155" />
      <Text style={styles.text}>Street Map</Text>
      <Text style={styles.subtext}>Integration with mapping engine coming</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816", justifyContent: "center", alignItems: "center" },
  text: { color: "#94A3B8", fontSize: 18, fontWeight: "bold", marginTop: 12 },
  subtext: { color: "#64748B", fontSize: 14, marginTop: 8 },
});
