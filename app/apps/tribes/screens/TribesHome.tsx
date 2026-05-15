import { View, Text, FlatList, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { useRouter } from "expo-router";
import { useTribeStore } from "../store/tribe.store";

export default function TribesHome() {
  const [tribes, setTribes] = useState<any[]>([]);
  const router = useRouter();
  const setActiveTribe = useTribeStore((s) => s.setActiveTribe);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("tribes").select("*");
    setTribes(data || []);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 22, fontWeight: "700" }}>
        Tribes Layer 3
      </Text>

      <Pressable
        onPress={() => router.push("/apps/tribes/screens/CreateTribe")}
        style={{ marginTop: 12, padding: 12, backgroundColor: "#00D26A" }}
      >
        <Text>Create Tribe</Text>
      </Pressable>

      <FlatList
        data={tribes}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              setActiveTribe(item);
              router.push(`/apps/tribes/screens/tribe/${item.id}`);
            }}
            style={{
              padding: 14,
              borderBottomWidth: 1,
              borderColor: "#222",
            }}
          >
            <Text style={{ color: "white", fontSize: 16 }}>{item.name}</Text>
            <Text style={{ color: "#888" }}>{item.region}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
