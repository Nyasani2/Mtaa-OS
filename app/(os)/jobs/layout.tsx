import { Stack } from "expo-router";

export default function JobsLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: "#050816" }, headerTintColor: "white", contentStyle: { backgroundColor: "#050816" } }}>
      <Stack.Screen name="index" options={{ title: "Jobs", headerShown: false }} />
      <Stack.Screen name="search/index" options={{ title: "Find Jobs" }} />
      <Stack.Screen name="applications/index" options={{ title: "My Applications" }} />
      <Stack.Screen name="profile/index" options={{ title: "Work Profile" }} />
      <Stack.Screen name="post/index" options={{ title: "Post a Job" }} />
    </Stack>
  );
}
