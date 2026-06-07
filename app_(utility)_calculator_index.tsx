// app/(utility)/calculator/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import CalculatorHome from "@/lib/calculator/components/CalculatorHome";

export default function CalculatorIndex() {
  return (
    <View style={styles.container}>
      <CalculatorHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
