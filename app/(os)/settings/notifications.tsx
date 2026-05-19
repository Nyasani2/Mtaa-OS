import React, { useState } from "react";
import { View, Text, FlatList, TextInput } from "react-native";
import { useAuth } from "@/lib/stores/auth-store";
import { useNotification } from "@/lib/kernel/notification-engine";

export default function NotificationInboxScreen() {
  const { user } = useAuthstore();
  const n = useNotification(user?.id);
  const [search, setSearch] = useState("");

  const list = n?.notifications ?? [];

  const filtered = list.filter((i) =>
    (i?.title ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: "700" }}>
        Notifications
      </Text>

      <TextInput
        placeholder="Search..."
        value={search}
        onChangeText={setSearch}
        style={{
          backgroundColor: "#eee",
          padding: 10,
          borderRadius: 8,
          marginTop: 10,
        }}
      />

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              marginVertical: 6,
              backgroundColor: "#fff",
              borderRadius: 10,
            }}
          >
            <Text style={{ fontWeight: "600" }}>
              {item.title}
            </Text>
            <Text>{item.body}</Text>
          </View>
        )}
      />
    </View>
  );
}
