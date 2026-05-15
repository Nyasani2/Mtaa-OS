import {
  View,
  Text,
  FlatList,
  Pressable,
} from "react-native";

const MOCK_LIVES = [
  {
    id: "1",
    host: "Amina",
    title: "Relationship Talk",
    viewers: 1200,
  },
  {
    id: "2",
    host: "Layla",
    title: "Faith & Marriage",
    viewers: 840,
  },
];

export default function LivestreamScreen() {

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
        🔴 Live
      </Text>

      <FlatList
        data={MOCK_LIVES}
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
              {item.title}
            </Text>

            <Text
              style={{
                color: "#9CA3AF",
                marginTop: 6,
              }}
            >
              Host: {item.host}
            </Text>

            <Text
              style={{
                color: "#EF4444",
                marginTop: 6,
              }}
            >
              🔴 {item.viewers} viewers
            </Text>

            <Pressable
              style={{
                backgroundColor: "#EF4444",
                padding: 12,
                borderRadius: 12,
                marginTop: 14,
              }}
            >
              <Text
                style={{
                  color: "white",
                  textAlign: "center",
                  fontWeight: "bold",
                }}
              >
                Join Live
              </Text>
            </Pressable>

          </View>

        )}
      />

    </View>
  );
}
