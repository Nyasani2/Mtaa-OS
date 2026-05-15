import React from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";

const MODULES = [
  { name: "Command Centre", route: "/(command)", icon: "🛰️" },
  { name: "Wallet", route: "/(wallet)/dashboard", icon: "💰" },
  { name: "Hookup", route: "/(hookup)", icon: "❤️" },
  { name: "Tribes", route: "/(tribes)", icon: "🏺" },
  { name: "MTruck", route: "/(mtruck)", icon: "🚛" },
];

export default function Launcher() {
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 20 }}>
      <Text style={{ color: "white", fontSize: 28, fontWeight: "bold" }}>
        🧠 MTAA OS
      </Text>

      <Text style={{ color: "#666", marginBottom: 20 }}>
        System Launcher
      </Text>

      <FlatList
        data={MODULES}
        keyExtractor={(item) => item.name}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(item.route)}
            style={{
              backgroundColor: "#111827",
              padding: 18,
              borderRadius: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 28 }}>{item.icon}</Text>
            <Text style={{ color: "white", fontSize: 16, marginTop: 10 }}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
