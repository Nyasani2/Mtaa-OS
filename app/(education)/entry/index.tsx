import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import EducationService from "@/lib/services/education-service";

export default function EducationEntryScreen() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthStore();
  const [detecting, setDetecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectAndRoute = async () => {
      if (authLoading) return;
      if (!user?.id) {
        setDetecting(false);
        setError("Not authenticated. Please log in.");
        return;
      }

      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Role detection timed out")), 8000)
        );
        const rolePromise = EducationService.detectUserRole(user.id);
        const role = await Promise.race([rolePromise, timeout]);

        if (role === "teacher") {
          router.replace("/dashboard");
        } else if (role === "student") {
          router.replace("/dashboard");
        } else if (role === "admin") {
          router.replace("/admin");
        } else if (role === "parent") {
          router.replace("/dashboard");
        } else {
          // No education role found — send to schools list to enroll
          router.replace("/schools");
        }
      } catch (err: any) {
        setError(err.message || "Failed to detect education role");
        setDetecting(false);
      }
    };

    detectAndRoute();
  }, [user?.id, authLoading]);

  if (authLoading || detecting) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#38bdf8" />
        <Text style={{ color: "#94a3b8", marginTop: 16, fontSize: 14 }}>Detecting your education profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Text style={{ color: "#f87171", fontSize: 16, textAlign: "center" }}>{error}</Text>
        <Text style={{ color: "#64748b", marginTop: 12, fontSize: 14, textAlign: "center" }}>
          Redirecting to schools...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#38bdf8" />
    </View>
  );
}
