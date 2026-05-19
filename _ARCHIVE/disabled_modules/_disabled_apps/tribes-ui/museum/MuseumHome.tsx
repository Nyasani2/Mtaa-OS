import { useEffect, useState } from "react";
import { View, Text, FlatList } from "react-native";
import { supabase } from "@/lib/supabase";

export default function MuseumHome() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("tribe_museum")
      .select("id,name,era,tribe_id,image_url")
      .limit(50);

    setItems(data || []);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 22 }}>
        Tribal Museum
      </Text>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={{
            marginTop: 12,
            padding: 16,
            backgroundColor: "#1A1A1A",
            borderRadius: 12
          }}>
            <Text style={{ color: "white" }}>{item.name}</Text>
            <Text style={{ color: "#888" }}>{item.era}</Text>
          </View>
        )}
      />
    </View>
  );
}
