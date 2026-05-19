import { View, Text, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function Museum() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("tribe_museum").select("*");
    setItems(data || []);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 20 }}>
        Tribe Museum
      </Text>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={{ padding: 12, borderBottomColor: "#222" }}>
            <Text style={{ color: "white" }}>{item.name}</Text>
            <Text style={{ color: "#888" }}>{item.era}</Text>
          </View>
        )}
      />
    </View>
  );
}
