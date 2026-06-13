// app/(media)/camera/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import CameraHome from "@/lib/camera/components/CameraHome";

export default function CameraIndex() {
  return (
    <View style={styles.container}>
      <CameraHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
