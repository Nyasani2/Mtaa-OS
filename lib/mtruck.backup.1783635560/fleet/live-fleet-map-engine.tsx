import React from "react";
import { View, Text } from "react-native";

// WEB SAFE FALLBACK
export default function LiveFleetMapEngine() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#0a0a0a" }}>
      <Text style={{ color: "#888", fontSize: 16 }}>
        🗺️ Fleet Map disabled on Web
      </Text>
    </View>
  );
}
