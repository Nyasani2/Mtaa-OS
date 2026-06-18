// app/(os)/wallet/hooks/useWalletAccount.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

export interface WalletAccount {
  id: string;
  user_id: string;
  account_id: string;
  wallet_name: string;
  wallet_type: string;
  currency: string;
  balance: number;
  available_balance: number;
  status: string;
  is_default: boolean;
  created_at: string;
}

export function useWalletAccount() {
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data, error: err } = await supabase
        .from("wallets")
        .select("id, user_id, account_id, wallet_name, wallet_type, currency, balance, available_balance, status, is_default, created_at")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single();
      if (err) throw err;
      setAccount(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  return { account, loading, error, refresh: fetchAccount };
}

export default useWalletAccount;
