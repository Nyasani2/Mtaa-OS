import { useRouter } from "expo-router";

export function useRouteGuard() {
  const router = useRouter();

  const requireAuth = () => {
    // Check auth and redirect if needed
    router.push("/login" as any);
  };

  return { requireAuth };
}
