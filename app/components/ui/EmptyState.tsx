"use client";

import { View, Text, StyleSheet } from "react-native";

interface Props {
  title?: string;
  message?: string;
}

export function EmptyState({ title = "Nothing here", message = "No items to display" }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  title: { fontSize: 18, fontWeight: "600", color: "#1e293b", marginBottom: 8 },
  message: { fontSize: 14, color: "#64748b", textAlign: "center" },
});
