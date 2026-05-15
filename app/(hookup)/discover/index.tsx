import { View, Text, Image, Pressable } from "react-native";
import { useState } from "react";

const MOCK_USERS = [
  {
    id: "1",
    name: "Amina",
    age: 25,
    country: "Kenya",
    bio: "Entrepreneur • Faith • Travel",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
  },
  {
    id: "2",
    name: "Layla",
    age: 29,
    country: "UAE",
    bio: "Family-oriented • Designer",
    image:
      "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df",
  },
];

export default function DiscoverScreen() {

  const [index, setIndex] = useState(0);

  const current = MOCK_USERS[index];

  if (!current) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#050816",
        }}
      >
        <Text style={{ color: "white" }}>
          No more profiles.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050816",
        padding: 20,
      }}
    >

      <Image
        source={{ uri: current.image }}
        style={{
          width: "100%",
          height: 500,
          borderRadius: 24,
        }}
      />

      <Text
        style={{
          color: "white",
          fontSize: 28,
          fontWeight: "bold",
          marginTop: 20,
        }}
      >
        {current.name}, {current.age}
      </Text>

      <Text
        style={{
          color: "#9CA3AF",
          marginTop: 8,
        }}
      >
        {current.country}
      </Text>

      <Text
        style={{
          color: "white",
          marginTop: 16,
          fontSize: 16,
        }}
      >
        {current.bio}
      </Text>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 40,
        }}
      >

        <Pressable
          onPress={() => setIndex(index + 1)}
          style={{
            backgroundColor: "#111827",
            padding: 22,
            borderRadius: 100,
            width: 100,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            PASS
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setIndex(index + 1)}
          style={{
            backgroundColor: "#EC4899",
            padding: 22,
            borderRadius: 100,
            width: 100,
          }}
        >
          <Text
            style={{
              color: "white",
              textAlign: "center",
              fontWeight: "bold",
            }}
          >
            LIKE
          </Text>
        </Pressable>

      </View>

    </View>
  );
}
