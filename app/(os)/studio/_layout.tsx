import React from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function StudioLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0a0a0a" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="feed" />
        <Stack.Screen name="video-player" />
        <Stack.Screen name="channel" />
        <Stack.Screen name="camera" />
        <Stack.Screen name="editor" />
        <Stack.Screen name="search" />
        <Stack.Screen name="music-studio" />
        <Stack.Screen name="monetization" />
        <Stack.Screen name="revenue-sharing" />
        <Stack.Screen name="education-studio" />
        <Stack.Screen name="children-zone" />
        <Stack.Screen name="community" />
        <Stack.Screen name="accessibility" />
        <Stack.Screen name="copyright" />
        <Stack.Screen name="safety" />
        <Stack.Screen name="integrations" />
        <Stack.Screen name="performance" />
        <Stack.Screen name="mstudio-complete" />
        <Stack.Screen name="broadcast-console" />
        <Stack.Screen name="live-broadcast" />
        <Stack.Screen name="unified-studio" />
        <Stack.Screen name="virtual-production" />
        <Stack.Screen name="asis-assistant" />
        <Stack.Screen name="multi-camera" />
        <Stack.Screen name="creator-revenue" />
        <Stack.Screen name="creator-transparency" />
        <Stack.Screen name="vision-manifesto" />
      </Stack>
    </>
  );
}
