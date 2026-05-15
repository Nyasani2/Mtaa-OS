import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

export default function TribeProfile() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [tribe, setTribe] = useState<any>(null);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    const { data } = await supabase
      .from("tribes")
      .select("*")
      .eq("id", id)
      .single();

    setTribe(data);
  }

  if (!tribe) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
        <Text style={{ color: "white" }}>Loading tribe...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 24 }}>
        🏛️ {tribe.name}
      </Text>

      <Text style={{ color: "#aaa", marginTop: 8 }}>
        {tribe.description}
      </Text>

      <Text style={{ color: "#666", marginTop: 10 }}>
        Region: {tribe.region}
      </Text>

      {/* Navigation */}
      <View style={{ marginTop: 20 }}>
        <Pressable
          onPress={() => router.push(`/(tribes)/museum/${id}`)}
          style={{ padding: 12, backgroundColor: "#1A1A1A", marginBottom: 10 }}
        >
          <Text style={{ color: "white" }}>🏺 Museum</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push(`/(tribes)/timeline/${id}`)}
          style={{ padding: 12, backgroundColor: "#1A1A1A" }}
        >
          <Text style={{ color: "white" }}>📜 Timeline</Text>
        </Pressable>
      </View>
    </View>
  );
}
