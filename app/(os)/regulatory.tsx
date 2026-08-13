// @ts-nocheck
// app/(os)/regulatory/index.tsx — Regulatory Command Centre
import React from "react";
import { View, StyleSheet } from "react-native";
import { RegulatoryShell } from "@/domains/regulatory/components";

export default function RegulatoryScreen() {
  return (
    <View style={styles.container}>
      <RegulatoryShell />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
});
