import { View, Text, Pressable } from "react-native";
import { HookupWebRTC } from "../../../lib/hookup/webrtc/hookup-webrtc-core";
import { useState } from "react";

export default function RoomScreen() {

  const [status, setStatus] =
    useState("IDLE");

  async function startRoom() {

    setStatus("CONNECTING");

    const webrtc =
      new HookupWebRTC(
        "demo-room",
        "user-001"
      );

    await webrtc.startLocalStream();

    await webrtc.createOffer();

    setStatus("LIVE");
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#050816",
        justifyContent: "center",
        alignItems: "center",
      }}
    >

      <Text
        style={{
          color: "white",
          fontSize: 22,
        }}
      >
        Room Status: {status}
      </Text>

      <Pressable
        onPress={startRoom}
        style={{
          backgroundColor: "#EC4899",
          padding: 16,
          marginTop: 20,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: "white" }}>
          Start Voice/Video
        </Text>
      </Pressable>

    </View>
  );
}
