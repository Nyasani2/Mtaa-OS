import { View, Text, FlatList } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function TribeMarketplace() {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("tribe_marketplace")
      .select("*");

    setItems(data || []);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 22 }}>
        Tribe Marketplace
      </Text>

      <FlatList
        data={items}
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
              {item.name}
            </Text>

            <Text style={{ color: "#00D26A", marginTop: 4 }}>
              {item.price}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
