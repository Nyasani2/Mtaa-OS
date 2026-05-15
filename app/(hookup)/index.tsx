import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";

export default function HookupHome() {

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050816",
        padding: 24,
      }}
    >

      <Text
        style={{
          color: "white",
          fontSize: 34,
          fontWeight: "bold",
          marginTop: 40,
        }}
      >
        ❤️ HOOKUP
      </Text>

      <Text
        style={{
          color: "#9CA3AF",
          marginTop: 12,
          fontSize: 16,
          lineHeight: 24,
        }}
      >
        Global relationship + community platform.
      </Text>

      <Pressable
        onPress={() => router.push("/(hookup)/discover")}
        style={{
          backgroundColor: "#EC4899",
          padding: 18,
          borderRadius: 16,
          marginTop: 40,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
            fontSize: 16,
          }}
        >
          Discover People
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(hookup)/matches")}
        style={{
          backgroundColor: "#111827",
          padding: 18,
          borderRadius: 16,
          marginTop: 18,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Matches
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(hookup)/chat")}
        style={{
          backgroundColor: "#111827",
          padding: 18,
          borderRadius: 16,
          marginTop: 18,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          Messages
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.push("/(hookup)/profile")}
        style={{
          backgroundColor: "#111827",
          padding: 18,
          borderRadius: 16,
          marginTop: 18,
        }}
      >
        <Text
          style={{
            color: "white",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          My Profile
        </Text>
      </Pressable>

    </View>
  );
}
