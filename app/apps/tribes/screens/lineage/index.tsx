import { ScrollView, Text, View } from "react-native";

export default function LineageScreen() {
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
        Family Lineage
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
          Clan Tree
        </Text>

        <Text
          style={{
            color: "#CCCCCC",
            marginTop: 12,
            lineHeight: 24,
          }}
        >
          Track ancestry, clan structures, elder generations,
          descendants, migration lineage, and family heritage.
        </Text>
      </View>
    </ScrollView>
  );
}
