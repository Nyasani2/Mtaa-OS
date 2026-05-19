import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuthGuard } from "@/lib/useAuthGuard";

export default function Ledger() {
  useAuthGuard();

  const [txs, setTxs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // 🔐 get current user safely
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getUser();
      const id = data?.user?.id || null;
      setUserId(id);
    };

    init();
  }, []);

  // 📡 load transactions (scoped to user)
  useEffect(() => {
    const load = async () => {
      if (!userId) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error) setTxs(data || []);

      setLoading(false);
    };

    load();
  }, [userId]);

  // ⚡ REALTIME UPDATE (MPESA CALLBACK → INSTANT UI)
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("ledger-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wallet_transactions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          // refresh on any change
          setTxs((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0b0b0b" }}>
        <ActivityIndicator color="white" />
        <Text style={{ color: "#888", marginTop: 10 }}>
          Loading ledger...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#0b0b0b" }}>
      <Text style={{ color: "white", fontSize: 22, marginBottom: 16, fontWeight: "700" }}>
        Wallet Ledger
      </Text>

      {txs.length === 0 ? (
        <Text style={{ color: "#666" }}>
          No transactions yet
        </Text>
      ) : (
        <FlatList
          data={txs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isCredit = item.direction === "credit";

            return (
              <View style={{
                padding: 14,
                borderBottomColor: "#222",
                borderBottomWidth: 1
              }}>
                <Text style={{ color: "white", fontWeight: "600" }}>
                  {item.transaction_type.toUpperCase()} —{" "}
                  <Text style={{ color: isCredit ? "#4ade80" : "#f87171" }}>
                    {isCredit ? "+" : "-"} {item.amount} KES
                  </Text>
                </Text>

                <Text style={{ color: "#888", fontSize: 12 }}>
                  {item.reference}
                </Text>

                <Text style={{ color: "#555", fontSize: 10 }}>
                  {item.status}
                </Text>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
