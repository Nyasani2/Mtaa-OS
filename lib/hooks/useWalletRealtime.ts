import { useEffect } from 'react';
import { supabase } from "@/lib/supabase";

export function useWalletRealtime(userId: string, onUpdate: (payload: any) => void) {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("wallet-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
}

