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
      <Stack.Screen name="index" options={{ title: "MTruck OS", headerShown: false }} />
      <Stack.Screen name="dispatch/index" options={{ title: "Dispatch Center" }} />
      <Stack.Screen name="tracking/index" options={{ title: "Live Tracking" }} />
      <Stack.Screen name="fleet/index" options={{ title: "Fleet Manager" }} />
      <Stack.Screen name="marketplace/index" options={{ title: "Freight Market" }} />
      <Stack.Screen name="loads/index" options={{ title: "Load Board" }} />
      <Stack.Screen name="routes/index" options={{ title: "Route Optimizer" }} />
      <Stack.Screen name="analytics/index" options={{ title: "Fleet Analytics" }} />
      <Stack.Screen name="drivers/index" options={{ title: "Driver Hub" }} />
      <Stack.Screen name="maintenance/index" options={{ title: "Maintenance" }} />
      <Stack.Screen name="fuel/index" options={{ title: "Fuel Intelligence" }} />
      <Stack.Screen name="documents/index" options={{ title: "Documents" }} />
      <Stack.Screen name="settings/index" options={{ title: "MTruck Settings" }} />
    </Stack>
  );
}
