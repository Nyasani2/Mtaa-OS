// app/(finance)/binance/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import BinanceHome from "@/lib/binance/components/BinanceHome";

export default function BinanceIndex() {
  return (
    <View style={styles.container}>
      <BinanceHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
