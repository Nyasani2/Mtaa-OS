import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function PropertyLayout() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="[id]" options={{ presentation: "modal" }} />
        <Stack.Screen name="booking" options={{ presentation: "modal" }} />
        <Stack.Screen name="payment" options={{ presentation: "modal" }} />
        <Stack.Screen name="lease" options={{ presentation: "modal" }} />
        <Stack.Screen name="maintenance" options={{ presentation: "modal" }} />
        <Stack.Screen name="list-property" options={{ presentation: "modal" }} />
      </Stack>
    </>
  );
}
