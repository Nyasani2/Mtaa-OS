// app/(education)/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import EducationHome from "@/lib/education/components/EducationHome";

export default function EducationIndex() {
  return (
    <View style={styles.container}>
      <EducationHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
