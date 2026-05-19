import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { supabase } from "@/lib/supabase";
import { useRouter } from "expo-router";

export default function TribesHome() {
  const [tribes, setTribes] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("tribes")
      .select("id,name,region,description")
      .limit(50);

    if (!error) setTribes(data || []);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
        Tribes of Africa
      </Text>

      <FlatList
        data={tribes}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/apps/tribes-ui/tribe/${item.id}`)}
            style={{
              padding: 16,
              marginTop: 12,
              backgroundColor: "#1A1A1A",
              borderRadius: 12
            }}
          >
            <Text style={{ color: "white", fontSize: 16 }}>
              {item.name}
            </Text>
            <Text style={{ color: "#888" }}>{item.region}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
