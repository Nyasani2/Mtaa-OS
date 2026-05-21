import { Stack } from "expo-router";

export default function MTruckLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#050816" },
        headerTintColor: "white",
        contentStyle: { backgroundColor: "#050816" }
      }}
    >
      <Stack.Screen name="index" options={{ title: "MTruck OS" }} />
    </Stack>
  );
}
