// app/(local)/hookup/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import HookupHome from "@/lib/hookup/components/HookupHome";

export default function HookupIndex() {
  return (
    <View style={styles.container}>
      <HookupHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
