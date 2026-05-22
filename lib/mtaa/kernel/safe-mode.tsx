"use client";

import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";

export function SafeModeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safe Mode</Text>
      <Text style={styles.message}>The system encountered an error and has entered safe mode.</Text>
      <TouchableOpacity onPress={() => router.push("/(os)/home" as any)} style={styles.button}>
        <Text style={styles.buttonText}>Return Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24, backgroundColor: "#0F0F0F" },
  title: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginBottom: 12 },
  message: { fontSize: 14, color: "#9CA3AF", textAlign: "center", marginBottom: 24 },
  button: { backgroundColor: "#2563eb", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: "#FFFFFF", fontWeight: "600" },
});
