import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";

export default function PreviewScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Preview</Text>

      <View style={styles.card}>
        <Image
          source={{ uri: "https://placehold.co/300x200" }}
          style={styles.image}
        />
        <Text style={styles.caption}>MTAA OS Preview Module</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 12,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  caption: { fontSize: 14 },
});
