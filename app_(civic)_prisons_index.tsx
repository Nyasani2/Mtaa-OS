// app/(civic)/prisons/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import PrisonsHome from "@/lib/civic/prisons/components/PrisonsHome";

export default function PrisonsIndex() {
  return (
    <View style={styles.container}>
      <PrisonsHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
