import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";

export default function TranslationScreen() {
  const [text, setText] = useState("");

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0A0A0A",
        padding: 16,
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 24,
          fontWeight: "700",
        }}
      >
        Tribal Translation AI
      </Text>

      <TextInput
        value={text}
        onChange={setText}
        placeholder="Enter text..."
        placeholderTextColor="#666"
        multiline
        style={{
          backgroundColor: "#151515",
          color: "white",
          marginTop: 20,
          padding: 16,
          borderRadius: 12,
          height: 140,
        }}
      />

      <Pressable
        style={{
          backgroundColor: "#00D26A",
          padding: 16,
          borderRadius: 12,
          marginTop: 16,
        }}
      >
        <Text style={{ fontWeight: "700" }}>
          Translate
        </Text>
      </Pressable>
    </View>
  );
}
