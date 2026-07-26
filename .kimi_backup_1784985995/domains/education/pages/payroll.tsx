import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function PayrollPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Payroll</Text>
      <Text style={styles.subtitle}>Education payroll management</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#0F0F0F",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#9CA3AF",
  },
});
