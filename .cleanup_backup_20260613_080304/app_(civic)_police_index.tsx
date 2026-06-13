// app/(civic)/police/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import PoliceHome from "@/lib/civic/police/components/PoliceHome";

export default function PoliceIndex() {
  return (
    <View style={styles.container}>
      <PoliceHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
