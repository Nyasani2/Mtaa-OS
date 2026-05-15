import { View, Text } from "react-native";

export default function Museum() {
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: "700" }}>
        Tribal Museum
      </Text>

      <Text style={{ marginTop: 10 }}>
        Cultural artifacts, oral history, and heritage archive.
      </Text>
    </View>
  );
}
