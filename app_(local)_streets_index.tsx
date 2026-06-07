// app/(local)/streets/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import StreetsHome from "@/lib/streets/components/StreetsHome";

export default function StreetsIndex() {
  return (
    <View style={styles.container}>
      <StreetsHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
