// app/(civic)/revenue/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import RevenueHome from "@/lib/civic/revenue/components/RevenueHome";

export default function RevenueIndex() {
  return (
    <View style={styles.container}>
      <RevenueHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
