import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTribeStore } from "../../store/tribe.store";
import { useEffect } from "react";
import { supabase } from "../../services/supabase";

export default function TribeDetail() {
  const { id } = useLocalSearchParams();
  const activeTribe = useTribeStore((s) => s.activeTribe);
  const setActiveTribe = useTribeStore((s) => s.setActiveTribe);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    const { data } = await supabase
      .from("tribes")
      .select("*")
      .eq("id", id)
      .single();

    setActiveTribe(data);
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <Text style={{ color: "white", fontSize: 22 }}>
        {activeTribe?.name}
      </Text>

      <Text style={{ color: "#888", marginTop: 8 }}>
        Region: {activeTribe?.region}
      </Text>

      <Pressable
        style={{ marginTop: 20, padding: 12, backgroundColor: "#222" }}
      >
        <Text style={{ color: "white" }}>
          AI Admin Assist (Governance)
        </Text>
      </Pressable>
    </View>
  );
}
