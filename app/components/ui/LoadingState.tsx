"use client";

import { View, ActivityIndicator, Text, StyleSheet } from "react-native";

interface Props {
  message?: string;
}

export function LoadingState({ message = "Loading..." }: Props) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2563eb" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  text: { marginTop: 12, fontSize: 14, color: "#64748b" },
});
