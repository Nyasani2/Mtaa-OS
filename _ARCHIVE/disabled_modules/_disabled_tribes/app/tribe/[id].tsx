import { View, Text } from "react-native";
import { useLocalSearchParams } from "expo-router";

export default function TribeScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>
        Tribe: {id}
      </Text>
    </View>
  );
}
