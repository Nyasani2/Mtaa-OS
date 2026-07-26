import { Stack } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "@/lib/auth/store/auth.store";

export default function JobsLayout() {
  const { user } = useAuthStore();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0A0F" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" options={{ title: "Jobs" }} />
      <Stack.Screen name="profile/index" options={{ title: "My Profile" }} />
      <Stack.Screen name="skills/index" options={{ title: "Skills" }} />
      <Stack.Screen name="portfolio/index" options={{ title: "Portfolio" }} />
      <Stack.Screen name="details/index" options={{ title: "Job Details" }} />
      <Stack.Screen name="applications/index" options={{ title: "Applications" }} />
      <Stack.Screen name="employer/index" options={{ title: "Employer" }} />
      <Stack.Screen name="talent-search/index" options={{ title: "Find Talent" }} />
      <Stack.Screen name="apprenticeships/index" options={{ title: "Apprenticeships" }} />
      <Stack.Screen name="freelance/index" options={{ title: "Freelance" }} />
      <Stack.Screen name="scholarships/index" options={{ title: "Scholarships" }} />
      <Stack.Screen name="tenders/index" options={{ title: "Tenders" }} />
      <Stack.Screen name="interviews/index" options={{ title: "Interviews" }} />
    </Stack>
  );
}
