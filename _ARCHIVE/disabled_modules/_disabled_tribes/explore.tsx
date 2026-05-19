import { useEffect, useState } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { supabase } from "./lib/supabase";
import { useRouter } from "expo-router";

export default function TribesExplore() {
  const [tribes, setTribes] = useState([]);
  const router = useRouter();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("tribes").select("*");
    setTribes(data || []);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 22, marginBottom: 12 }}>
        🪶 Tribes of Africa
      </Text>

      <FlatList
        data={tribes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/(tribes)/tribe/${item.id}`)}
            style={{
              padding: 14,
              backgroundColor: "#1A1A1A",
              borderRadius: 12,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: "white", fontSize: 16 }}>
              {item.name}
            </Text>

            <Text style={{ color: "#888", fontSize: 12 }}>
              {item.region}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}
