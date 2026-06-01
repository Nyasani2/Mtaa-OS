// app/(mtaxi)/_layout.tsx
import { Stack } from "expo-router";

export default function MTaxiLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="request" />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="history" />
      <Stack.Screen name="driver" />
      <Stack.Screen name="driver-requests" />
      <Stack.Screen name="driver-ride" />
      <Stack.Screen name="driver-earnings" />
      <Stack.Screen name="carpool" />
      <Stack.Screen name="payment" />
    </Stack>
  );
}
