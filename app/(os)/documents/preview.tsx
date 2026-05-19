import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function DocumentPreview() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Document Preview</Text>

      <Image
        source={{ uri: "https://placehold.co/600x400" }}
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 18, fontWeight: "bold", marginBottom: 12 },
  image: {
    width: "100%",
    height: 300,
    borderRadius: 10,
  },
});
