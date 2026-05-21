import { useEffect } from "react";
import { supabase } from "./supabase";
import { useRouter } from "expo-router";

export function useAuthGuard() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getUser();

      const user = data?.user;

      if (!user) {
        router.replace("/login");
      }
    };

    checkAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          router.replace("/login");
        }
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);
}
