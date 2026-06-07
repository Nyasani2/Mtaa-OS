// app/(communication)/phone/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import PhoneHome from "@/lib/phone/components/PhoneHome";

export default function PhoneIndex() {
  return (
    <View style={styles.container}>
      <PhoneHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
