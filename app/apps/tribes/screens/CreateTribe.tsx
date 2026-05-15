import { View, Text, TextInput, Pressable } from "react-native";
import { useState } from "react";
import { supabase } from "../services/supabase";
import { useRouter } from "expo-router";

export default function CreateTribe() {
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const router = useRouter();

  async function create() {
    await supabase.from("tribes").insert({
      name,
      region,
    });

    router.back();
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#0A0A0A" }}>
      <Text style={{ color: "white", fontSize: 20 }}>Create Tribe</Text>

      <TextInput
        placeholder="Name"
        placeholderTextColor="#666"
        value={name}
        onChange={setName}
        style={{ backgroundColor: "#111", color: "#fff", marginTop: 12 }}
      />

      <TextInput
        placeholder="Region"
        placeholderTextColor="#666"
        value={region}
        onChange={setRegion}
        style={{ backgroundColor: "#111", color: "#fff", marginTop: 12 }}
      />

      <Pressable
        onPress={create}
        style={{ marginTop: 16, backgroundColor: "#00D26A", padding: 14 }}
      >
        <Text>Create</Text>
      </Pressable>
    </View>
  );
}
