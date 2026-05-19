import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function Index() {
  const router = useRouter();
  const { user, hydrated } = useAuthStore();

  useEffect(() => {
    if (!hydrated) return;

    if (user?.id) {
      router.replace("/(os)/launcher");
    } else {
      router.replace("/login");
    }
  }, [user, hydrated]);

  return null;
}
