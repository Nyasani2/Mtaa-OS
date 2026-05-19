import { View, Text, Pressable } from "react-native";
import { useState } from "react";
import { HookupKernel } from "@/lib/hookup";

export default function RoomScreen() {
  const [status, setStatus] = useState("IDLE");

  async function startRoom() {
    try {
      setStatus("CONNECTING");

      const kernel = new HookupKernel("room-" + Date.now(), "user-001");
      await kernel.startRoom();

      setStatus("LIVE");
    } catch (e) {
      console.error(e);
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
          backgroundColor: "#22C55E",
          borderRadius: 12
        }}
      >
        <Text style={{ color: "white" }}>Join Live Room</Text>
      </Pressable>
    </View>
  );
}
