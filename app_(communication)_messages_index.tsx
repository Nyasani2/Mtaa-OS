// app/(communication)/messages/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import MessagesHome from "@/lib/messages/components/MessagesHome";

export default function MessagesIndex() {
  return (
    <View style={styles.container}>
      <MessagesHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
