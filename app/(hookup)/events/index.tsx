import {
  View,
  Text,
  FlatList,
  Pressable,
} from "react-native";

const MOCK_EVENTS = [
  {
    id: "1",
    title: "Nairobi Singles Meetup",
    city: "Nairobi",
    attendees: 220,
  },
  {
    id: "2",
    title: "Dubai Marriage Networking",
    city: "Dubai",
    attendees: 340,
  },
];

export default function EventsScreen() {

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
        📍 Events
      </Text>

      <FlatList
        data={MOCK_EVENTS}
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
              {item.city}
            </Text>

            <Text
              style={{
                color: "#EC4899",
                marginTop: 6,
              }}
            >
              {item.attendees} attending
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
                Join Event
              </Text>
            </Pressable>

          </View>

        )}
      />

    </View>
  );
}
