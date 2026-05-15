import { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { supabase } from "@/lib/supabase";
import { useLocalSearchParams } from "expo-router";

export default function TribeProfile() {
  const { id } = useLocalSearchParams();
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

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 24, fontWeight: "700" }}>
        {tribe?.name || "Loading..."}
      </Text>

      <Text style={{ color: "#aaa", marginTop: 10 }}>
        {tribe?.description}
      </Text>

      <Text style={{ color: "#666", marginTop: 20 }}>
        Region: {tribe?.region}
      </Text>
    </View>
  );
}
