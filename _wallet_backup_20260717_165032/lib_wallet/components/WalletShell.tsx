// lib/wallet/components/WalletShell.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import WalletDashboard from "./WalletDashboard";

export default function WalletShell() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Wallet</Text>
      <WalletDashboard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
  header: { fontSize: 24, fontWeight: "bold", color: "#fff", padding: 16 },
});
