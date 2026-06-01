// app/(boda)/_layout.tsx
import { Stack } from "expo-router";

export default function BodaLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="request" />
      <Stack.Screen name="tracking" />
      <Stack.Screen name="history" />
    </Stack>
  );
}
