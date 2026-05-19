import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { HookupRuntime } from "@/lib/hookup";

export default function RoomScreen() {
  const [status, setStatus] = useState("IDLE");

  async function startRoom() {
    try {
      setStatus("CONNECTING");

      const runtime = new HookupRuntime(
        "demo-room",
        "user-001"
      );

      await runtime.start();

      setStatus("LIVE");
    } catch (err) {
      console.error("Room start failed:", err);
      setStatus("ERROR");
    }
  }

  return (
    <View style={{
      flex: 1,
      backgroundColor: "#050816",
      justifyContent: "center",
      alignItems: "center"
    }}>
      <Text style={{ color: "white", fontSize: 22 }}>
        Room Status: {status}
      </Text>

      <Pressable
        onPress={startRoom}
        style={{
          marginTop: 20,
          padding: 16,
          backgroundColor: "#EC4899",
          borderRadius: 12
        }}
      >
        <Text style={{ color: "white" }}>
          Start Voice/Video
        </Text>
      </Pressable>
    </View>
  );
}
