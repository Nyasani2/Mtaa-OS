import { View, Text, FlatList, TextInput, Pressable } from "react-native";
import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";

export default function TribeChat() {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase
      .from("tribe_messages")
      .select("*")
      .order("created_at", { ascending: true });

    setMessages(data || []);
  }

  async function send() {
    if (!text.trim()) return;

    await supabase.from("tribe_messages").insert({
      text,
    });

    setText("");
    load();
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 16 }}>
      <FlatList
        data={messages}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View
            style={{
              backgroundColor: "#151515",
              padding: 12,
              marginTop: 8,
              borderRadius: 10,
            }}
          >
            <Text style={{ color: "white" }}>{item.text}</Text>
          </View>
        )}
      />

      <TextInput
        value={text}
        onChange={setText}
        placeholder="Message..."
        placeholderTextColor="#666"
        style={{
          backgroundColor: "#151515",
          color: "white",
          padding: 14,
          borderRadius: 10,
          marginTop: 12,
        }}
      />

      <Pressable
        onPress={send}
        style={{
          backgroundColor: "#00D26A",
          padding: 14,
          borderRadius: 12,
          marginTop: 10,
        }}
      >
        <Text style={{ fontWeight: "700" }}>
          Send
        </Text>
      </Pressable>
    </View>
  );
}
