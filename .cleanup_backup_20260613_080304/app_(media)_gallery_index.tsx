// app/(media)/gallery/index.tsx
import React from "react";
import { View, StyleSheet } from "react-native";
import GalleryHome from "@/lib/gallery/components/GalleryHome";

export default function GalleryIndex() {
  return (
    <View style={styles.container}>
      <GalleryHome />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0a0a" },
});
