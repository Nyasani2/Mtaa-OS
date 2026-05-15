import { ScrollView, Text, View } from "react-native";

export default function MigrationRoutes() {
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
        Migration Routes
      </Text>

      <View
        style={{
          backgroundColor: "#151515",
          borderRadius: 12,
          padding: 16,
          marginTop: 20,
        }}
      >
        <Text style={{ color: "#00D26A", fontSize: 18 }}>
          East African Migration Corridor
        </Text>

        <Text
          style={{
            color: "#CCCCCC",
            marginTop: 12,
            lineHeight: 24,
          }}
        >
          Visualizes tribal migration across Africa including
          settlement regions, conflict routes, trade corridors,
          and diaspora expansion.
        </Text>
      </View>
    </ScrollView>
  );
}
