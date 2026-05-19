import React from "react";
import { View, Text, Pressable, FlatList } from "react-native";

import { recentsEngine } from "@/lib/shell/multitasking/recents/recents-engine";
import { taskManager } from "@/lib/shell/multitasking/task-manager";

export default function RecentsScreen() {
  const apps = recentsEngine.getRecents();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#000",
        paddingTop: 60,
        paddingHorizontal: 20,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 26, fontWeight: "600" }}>
        Recents
      </Text>

      <FlatList
        data={apps}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => taskManager.open(item)}
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              padding: 20,
              borderRadius: 16,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff" }}>{item}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
