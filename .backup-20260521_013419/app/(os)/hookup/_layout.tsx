import { Stack } from "expo-router";

export default function HookupLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#050816" },
        headerTintColor: "white",
        contentStyle: { backgroundColor: "#050816" }
      }}
    >
      <Stack.Screen name="index" options={{ title: "Hookup" }} />
      <Stack.Screen name="rooms/[id]" options={{ title: "Room" }} />
      <Stack.Screen name="chat/index" options={{ title: "Chat" }} />
      <Stack.Screen name="discover/index" options={{ title: "Discover" }} />
      <Stack.Screen name="profile/index" options={{ title: "Profile" }} />
    </Stack>
  );
}
