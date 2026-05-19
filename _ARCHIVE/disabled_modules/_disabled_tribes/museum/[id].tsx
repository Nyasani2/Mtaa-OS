import { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { supabase } from "../lib/supabase";

export default function Museum() {
  const { id } = useLocalSearchParams();
  const [items, setItems] = useState([]);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    const { data } = await supabase
      .from("tribe_museum_map")
      .select("*")
      .eq("tribe_id", id);

    setItems(data || []);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 22 }}>
        🏺 Tribal Museum
      </Text>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 12,
              backgroundColor: "#1A1A1A",
              marginBottom: 10,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "white" }}>{item.title}</Text>
            <Text style={{ color: "#888", fontSize: 12 }}>
              {item.artifact_type}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
