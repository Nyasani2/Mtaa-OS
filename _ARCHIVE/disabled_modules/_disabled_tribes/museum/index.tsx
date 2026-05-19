import { View, Text } from "react-native";

export default function MuseumHome() {
  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 22 }}>
        🏺 Tribal Museum
      </Text>

      <Text style={{ color: "#aaa", marginTop: 10 }}>
        History • Artifacts • Oral traditions • Cultural archives
      </Text>
    </View>
  );
}
