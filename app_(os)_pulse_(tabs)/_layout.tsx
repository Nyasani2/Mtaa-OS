// app/(os)/pulse/(tabs)/_layout.tsx
// MTAA Pulse — Tab Layout

import React from "react";
import { Tabs } from "expo-router";
import { Home, Flame, Hash, Bell, Compass } from "lucide-react-native";

export default function PulseTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0f0f1a",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.06)",
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: "#FF6B35",
        tabBarInactiveTintColor: "rgba(255,255,255,0.4)",
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trending"
        options={{
          title: "Trending",
          tabBarIcon: ({ color, size }) => <Flame size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          title: "Topics",
          tabBarIcon: ({ color, size }) => <Hash size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="alerts"
        options={{
          title: "Alerts",
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Discover",
          tabBarIcon: ({ color, size }) => <Compass size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
