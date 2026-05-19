import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";

import { router } from "expo-router";

const sections = [
  {
    title: "Profile",
    route: "/(os)/settings/profile",
  },

  {
    title: "Security",
    route: "/(os)/settings/security",
  },

  {
    title: "Notifications",
    route: "/(os)/settings/app-notifications",
  },

  {
    title: "Permissions",
    route: "/(os)/settings/permissions",
  },

  {
    title: "Storage",
    route: "/(os)/settings/storage",
  },

  {
    title: "Network",
    route: "/(os)/settings/network",
  },

  {
    title: "Installed Apps",
    route: "/(os)/settings/installed-apps",
  },

  {
    title: "Appearance",
    route: "/(os)/settings/theme",
  },

  {
    title: "Accent Color",
    route: "/(os)/settings/accent",
  },

  {
    title: "Language",
    route: "/(os)/settings/language",
  },

  {
    title: "Devices",
    route: "/(os)/settings/devices",
  },

  {
    title: "Privacy",
    route: "/(os)/settings/privacy",
  },

  {
    title: "Support",
    route: "/(os)/settings/support",
  },

  {
    title: "Logs",
    route: "/(os)/settings/logs",
  },

  {
    title: "Feature Flags",
    route: "/(os)/settings/features",
  },
];

export default function OSSettingsScreen() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#050816",
      }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 140,
        }}
      >
        <Text
          style={{
            color: "white",
            fontSize: 34,
            fontWeight: "800",
            marginBottom: 6,
          }}
        >
          Settings
        </Text>

        <Text
          style={{
            color: "#94a3b8",
            marginBottom: 26,
            fontSize: 15,
          }}
        >
          MTAA OS System Control
        </Text>

        {sections.map((section) => (
          <TouchableOpacity
            key={section.title}
            onPress={() => router.push(section.route as any)}
            activeOpacity={0.85}
            style={{
              backgroundColor: "rgba(15,23,42,0.92)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              padding: 18,
              borderRadius: 18,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                color: "white",
                fontSize: 18,
                fontWeight: "700",
              }}
            >
              {section.title}
            </Text>
          </TouchableOpacity>
        ))}

        <View
          style={{
            marginTop: 28,
            backgroundColor: "#0f172a",
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.05)",
          }}
        >
          <Text
            style={{
              color: "#94a3b8",
              fontSize: 14,
            }}
          >
            MTAA OS Kernel
          </Text>

          <Text
            style={{
              color: "#22c55e",
              fontSize: 20,
              fontWeight: "800",
              marginTop: 8,
            }}
          >
            SYSTEM STABLE
          </Text>

          <Text
            style={{
              color: "#64748b",
              marginTop: 8,
              lineHeight: 20,
            }}
          >
            Core runtime operational.
            Installed apps verified.
            Local services active.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
