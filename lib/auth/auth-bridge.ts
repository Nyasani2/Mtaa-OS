import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/stores/auth-store";

export const bootstrapAuth = async () => {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setHydrated(true);
    return;
  }

  useAuthStore.getState().setUser({
    id: data.user.id,
    email: data.user.email,
  });

  useAuthStore.getState().setHydrated(true);
};

export const subscribeAuth = () => {
  supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user;

    if (!user) {
      useAuthStore.getState().setUser(null);
    } else {
      useAuthStore.getState().setUser({
        id: user.id,
        email: user.email,
      });
    }

    useAuthStore.getState().setHydrated(true);
  });
};
