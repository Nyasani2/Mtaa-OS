import { View, Text, FlatList, Pressable } from "react-native";
import { tribes } from "../data/tribes";

export default function TribesHome() {
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#0A0A0A" }}>
      <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
        Tribes of Africa
      </Text>

      <FlatList
        data={tribes}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable
            style={{
              padding: 16,
              marginTop: 12,
              backgroundColor: "#1A1A1A",
              borderRadius: 12,
            }}
          >
            <Text style={{ color: "white", fontSize: 18 }}>
              {item.name}
            </Text>
            <Text style={{ color: "#999", marginTop: 4 }}>
              {item.region}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
