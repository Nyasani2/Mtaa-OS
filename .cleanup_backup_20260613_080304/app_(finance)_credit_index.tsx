// app/(finance)/credit/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import CreditHome from "@/lib/credit/components/CreditHome";

export default function CreditIndex() {
  return (
    <View style={styles.container}>
      <CreditHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
