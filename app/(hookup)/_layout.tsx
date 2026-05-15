import { Stack } from "expo-router";

export default function HookupLayout() {

  return (
    <Stack>

      <Stack.Screen
        name="index"
        options={{ title: "HOOKUP" }}
      />

      <Stack.Screen
        name="discover/index"
        options={{ title: "Discover" }}
      />

      <Stack.Screen
        name="matches/index"
        options={{ title: "Matches" }}
      />

      <Stack.Screen
        name="chat/index"
        options={{ title: "Messages" }}
      />

      <Stack.Screen
        name="groups/index"
        options={{ title: "Groups" }}
      />

      <Stack.Screen
        name="events/index"
        options={{ title: "Events" }}
      />

      <Stack.Screen
        name="rooms/index"
        options={{ title: "Rooms" }}
      />

      <Stack.Screen
        name="profile/index"
        options={{ title: "Profile" }}
      />

    </Stack>
  );
}
