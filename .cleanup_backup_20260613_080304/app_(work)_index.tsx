// app/(work)/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import JobsHome from "@/lib/jobs/components/JobsHome";

export default function WorkIndex() {
  return (
    <View style={styles.container}>
      <JobsHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
