import {
  View,
  Text,
  FlatList,
} from "react-native";

const MOCK_MATCHES = [
  {
    id: "1",
    name: "Amina",
    compatibility: 92,
  },
  {
    id: "2",
    name: "Layla",
    compatibility: 88,
  },
];

export default function MatchesScreen() {

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050816",
        padding: 20,
      }}
    >

      <Text
        style={{
          color: "white",
          fontSize: 30,
          fontWeight: "bold",
          marginBottom: 20,
        }}
      >
        💖 Matches
      </Text>

      <FlatList
        data={MOCK_MATCHES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#111827",
              padding: 18,
              borderRadius: 18,
              marginBottom: 14,
            }}
          >

            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "bold",
              }}
            >
              {item.name}
            </Text>

            <Text
              style={{
                color: "#EC4899",
                marginTop: 6,
              }}
            >
              Compatibility: {item.compatibility}%
            </Text>

          </View>
        )}
      />

    </View>
  );
}
