// app/(mtruck)/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import MTruckHome from "@/lib/mtruck/components/MTruckHome";

export default function MTruckIndex() {
  return (
    <View style={styles.container}>
      <MTruckHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
