// app/(productivity)/clock/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import ClockHome from "@/lib/clock/components/ClockHome";

export default function ClockIndex() {
  return (
    <View style={styles.container}>
      <ClockHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
