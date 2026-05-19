import {
  View,
  Text,
  FlatList,
  Pressable,
} from "react-native";

const MOCK_ROOMS = [
  {
    id: "1",
    title: "Faith & Relationships",
    type: "VOICE",
    participants: 34,
  },
  {
    id: "2",
    title: "Marriage Advice Room",
    type: "VIDEO",
    participants: 18,
  },
];

export default function RoomsScreen() {

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
        🎙 Rooms
      </Text>

      <FlatList
        data={MOCK_ROOMS}
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
              {item.type} • {item.participants} people
            </Text>

            <Pressable
              style={{
                backgroundColor: "#EC4899",
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
                Join Room
              </Text>
            </Pressable>

          </View>

        )}
      />

    </View>
  );
}
