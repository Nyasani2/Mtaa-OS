import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";

import { taskManager } from "@/lib/shell/multitasking/task-manager";
import { appTransitionEngine } from "@/lib/shell/transitions/app-transition";

/**
 * ==========================================
 * MTAA OS HOME LAUNCHER (V4 - TRANSITION ENABLED)
 * FULL OS MORPH INTEGRATION
 * ==========================================
 */

const APPS = [
  { name: "Calendar", route: "/(os)/calendar" },
  { name: "Messages", route: "/(os)/messages" },
  { name: "App Store", route: "/(os)/app-store" },
  { name: "Documents", route: "/(os)/documents" },
  { name: "Gallery", route: "/(os)/gallery" },
  { name: "Settings", route: "/(os)/settings" },
  { name: "Wallet", route: "/(os)/wallet" },
  { name: "Phone", route: "/(os)/phone" },
];

const DOCK = [
  { name: "Home", route: "/(os)/home" },
  { name: "Messages", route: "/(os)/messages" },
  { name: "Wallet", route: "/(os)/wallet" },
];

export default function HomeScreen() {
  const openApp = (route: string) => {
    appTransitionEngine.open(() => {
      taskManager.open(route);
    });
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        paddingTop: 60,
        paddingHorizontal: 20,
      }}
    >
      {/* HEADER */}
      <Text style={{ color: "#fff", fontSize: 28, fontWeight: "600" }}>
        MTAA OS
      </Text>

      <Text style={{ color: "#888", marginBottom: 20 }}>
        Home Launcher
      </Text>

      {/* APP GRID */}
      <FlatList
        data={APPS}
        numColumns={4}
        keyExtractor={(item) => item.name}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openApp(item.route)}
            style={{
              width: 70,
              height: 70,
              borderRadius: 16,
              backgroundColor: "rgba(255,255,255,0.08)",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 10, textAlign: "center" }}>
              {item.name}
            </Text>
          </Pressable>
        )}
      />

      {/* DOCK */}
      <View
        style={{
          position: "absolute",
          bottom: 30,
          left: 20,
          right: 20,
          height: 70,
          borderRadius: 20,
          backgroundColor: "rgba(255,255,255,0.06)",
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {DOCK.map((item) => (
          <Pressable key={item.name} onPress={() => openApp(item.route)}>
            <Text style={{ color: "#fff", fontSize: 12 }}>
              {item.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
