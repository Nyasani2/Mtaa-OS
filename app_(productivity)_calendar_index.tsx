// app/(productivity)/calendar/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import CalendarHome from "@/lib/scheduler/components/CalendarHome";

export default function CalendarIndex() {
  return (
    <View style={styles.container}>
      <CalendarHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
