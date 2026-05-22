import { useEffect } from "react";
import { useRouter, type Href } from "expo-router";
import { useAuth } from "@/hooks/useAuth";

export function useAuthGuard(redirectTo: Href = "/login" as Href) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  return { isLoading, isAuthenticated: !!user };
}

export default useAuthGuard;
