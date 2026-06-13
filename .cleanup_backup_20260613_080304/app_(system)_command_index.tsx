// app/(system)/command/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import CommandHome from "@/lib/command/components/CommandHome";

export default function CommandIndex() {
  return (
    <View style={styles.container}>
      <CommandHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
