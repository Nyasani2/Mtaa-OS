import {
  View,
  Text,
  FlatList,
  Pressable,
} from "react-native";

const MOCK_GROUPS = [
  {
    id: "1",
    name: "Muslim Marriage Circle",
    category: "Faith",
    members: 1200,
  },
  {
    id: "2",
    name: "African Entrepreneurs",
    category: "Business",
    members: 850,
  },
];

export default function GroupsScreen() {

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
        👥 Groups
      </Text>

      <FlatList
        data={MOCK_GROUPS}
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
                color: "#9CA3AF",
                marginTop: 6,
              }}
            >
              {item.category}
            </Text>

            <Text
              style={{
                color: "#EC4899",
                marginTop: 6,
              }}
            >
              {item.members} members
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
                Join Group
              </Text>
            </Pressable>

          </View>

        )}
      />

    </View>
  );
}
