import { View, Text, Pressable } from "react-native";
import { TribeAI } from "../services/tribe-ai.service";

export default function Governance() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 22 }}>
        Tribe Governance AI
      </Text>

      <Pressable
        style={{
          marginTop: 20,
          padding: 16,
          backgroundColor: "#1A1A1A",
          borderRadius: 12
        }}
        onPress={async () => {
          const result = await TribeAI.summarizeTribeActivity("Demo Tribe", []);
          console.log(result);
        }}
      >
        <Text style={{ color: "white" }}>
          Run AI Summary
        </Text>
      </Pressable>
    </View>
  );
}
