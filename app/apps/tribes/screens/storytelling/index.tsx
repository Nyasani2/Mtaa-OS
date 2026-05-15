import { ScrollView, Text, View, Pressable } from "react-native";

export default function StorytellingScreen() {
  return (
    <ScrollView
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
        AI Oral Storytelling
      </Text>

      <View
        style={{
          marginTop: 20,
          backgroundColor: "#151515",
          padding: 16,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "#00D26A", fontSize: 18 }}>
          The Migration of the Maasai
        </Text>

        <Text
          style={{
            color: "#CCCCCC",
            marginTop: 12,
            lineHeight: 24,
          }}
        >
          The AI storyteller preserves oral traditions passed through
          generations, narrating migration, wars, cattle culture,
          ceremonies, and leadership systems.
        </Text>

        <Pressable
          style={{
            backgroundColor: "#00D26A",
            padding: 14,
            borderRadius: 10,
            marginTop: 18,
          }}
        >
          <Text style={{ fontWeight: "700" }}>
            Play Story
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
