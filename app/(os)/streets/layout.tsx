import { Stack } from "expo-router";

export default function StreetsLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#050816" }, headerTintColor: "white", contentStyle: { backgroundColor: "#050816" } }}>
      <Stack.Screen name="index" options={{ title: "Streets", headerShown: false }} />
      <Stack.Screen name="map/index" options={{ title: "Street Map" }} />
      <Stack.Screen name="report/index" options={{ title: "Report Issue" }} />
      <Stack.Screen name="services/index" options={{ title: "City Services" }} />
    </Stack>
  );
}
