import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useMessagingBus } from "@/hooks/useMessagingBus";

export default function BusMonitor() {
  const bus = useMessagingBus("bus-monitor");

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bus Monitor</Text>
      <Text style={styles.text}>
        Status: {bus ? "Active" : "Inactive"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "bold" },
  text: { marginTop: 10, color: "#aaa" },
});
