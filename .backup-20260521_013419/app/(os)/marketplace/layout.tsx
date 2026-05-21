import { Stack } from "expo-router";

export default function MarketplaceLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#050816" }, headerTintColor: "white", contentStyle: { backgroundColor: "#050816" } }}>
      <Stack.Screen name="index" options={{ title: "Marketplace", headerShown: false }} />
      <Stack.Screen name="browse/index" options={{ title: "Browse" }} />
      <Stack.Screen name="orders/index" options={{ title: "My Orders" }} />
      <Stack.Screen name="sell/index" options={{ title: "Sell Item" }} />
      <Stack.Screen name="trust/index" options={{ title: "Trust Score" }} />
    </Stack>
  );
}
