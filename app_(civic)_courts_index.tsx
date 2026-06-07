// app/(civic)/courts/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import CourtsHome from "@/lib/civic/courts/components/CourtsHome";

export default function CourtsIndex() {
  return (
    <View style={styles.container}>
      <CourtsHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
