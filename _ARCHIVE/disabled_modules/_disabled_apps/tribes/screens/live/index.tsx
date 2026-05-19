import { View, Text, FlatList, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function TribeLiveSpaces() {
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("tribe_live_rooms")
      .select("*");

    setRooms(data || []);
  }

  async function createRoom() {
    await supabase.from("tribe_live_rooms").insert({
      title: "New Tribe Space",
      status: "live",
    });

    load();
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 22 }}>
        Tribe Live Spaces
      </Text>

      <Pressable
        onPress={createRoom}
        style={{
          backgroundColor: "#00D26A",
          padding: 14,
          borderRadius: 12,
          marginTop: 14,
        }}
      >
        <Text>Create Live Space</Text>
      </Pressable>

      <FlatList
        data={rooms}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#151515",
              padding: 14,
              borderRadius: 12,
              marginTop: 12,
            }}
          >
            <Text style={{ color: "white" }}>
              {item.title}
            </Text>

            <Text style={{ color: "#00D26A", marginTop: 4 }}>
              {item.status}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
