"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/lib/auth/useAuthStore";

export interface WalletTransaction {
  id: string;
  user_id: string;
  profile_id: string | null;
  wallet_id: string | null;
  type: string;
  transaction_type: string | null;
  amount: number;
  balance_after: number | null;
  currency: string;
  status: string;
  description: string | null;
  reference: string | null;
  reference_id: string | null;
  reference_type: string | null;
  provider: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  failed_at: string | null;
}

export interface WalletAccount {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  status: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export function useWalletTransactions() {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (sbError) throw sbError;
      setTransactions((data as WalletTransaction[]) || []);
    } catch (err: any) {
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return { transactions, loading, error, refetch: fetchTransactions };
}

export function useWalletAccount() {
  const { user } = useAuthStore();
  const [account, setAccount] = useState<WalletAccount | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: sbError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single();
      if (sbError) throw sbError;
      setAccount(data as WalletAccount);
    } catch (err: any) {
      setError(err.message || "Failed to load wallet account");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  return { account, loading, error, refetch: fetchAccount };
}
