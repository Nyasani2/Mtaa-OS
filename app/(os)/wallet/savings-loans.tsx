"use client";

import { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Alert, useRouter } from "expo-router";
import { Alert,
  ArrowLeft, PiggyBank, TrendingUp, Plus, Minus, Clock,
  CheckCircle, XCircle, ChevronRight, DollarSign,
} from "lucide-react-native";

interface SavingsAccount {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  target_amount: number | null;
  interest_rate: number;
  status: "active" | "locked" | "closed";
  created_at: string;
}

interface Loan {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  interest_rate: number;
  status: "pending" | "approved" | "active" | "repaid" | "defaulted";
  purpose: string;
  approved_at: string | null;
  due_date: string | null;
  repaid_amount: number;
  created_at: string;
}

export default function SavingsLoansScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<"savings" | "loans">("savings");
  const [savings, setSavings] = useState<SavingsAccount[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateSavings, setShowCreateSavings] = useState(false);
  const [showApplyLoan, setShowApplyLoan] = useState(false);
  const [savingsName, setSavingsName] = useState("");
  const [savingsTarget, setSavingsTarget] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [{ data: s }, { data: l }] = await Promise.all([
        supabase.from("savings_accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("loans").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      setSavings(s || []);
      setLoans(l || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const createSavings = async () => {
    if (!user?.id || !savingsName.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("savings_accounts").insert({
        user_id: user.id,
        name: savingsName.trim(),
        balance: 0,
        target_amount: savingsTarget ? parseFloat(savingsTarget) : null,
        interest_rate: 5.0,
        status: "active",
      });
      if (error) throw error;
      Alert.alert("Created", "Savings account created");
      setShowCreateSavings(false);
      setSavingsName(""); setSavingsTarget("");
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const applyLoan = async () => {
    if (!user?.id || !loanAmount.trim() || !loanPurpose.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("loans").insert({
        user_id: user.id,
        amount: parseFloat(loanAmount),
        currency: "KES",
        interest_rate: 12.0,
        status: "pending",
        purpose: loanPurpose.trim(),
        repaid_amount: 0,
      });
      if (error) throw error;
      Alert.alert("Applied", "Loan application submitted for review");
      setShowApplyLoan(false);
      setLoanAmount(""); setLoanPurpose("");
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const depositToSavings = async (account: SavingsAccount, amount: string) => {
    if (!user?.id || !amount.trim()) return;
    try {
      const num = parseFloat(amount);
      await supabase.from("savings_accounts").update({ balance: account.balance + num }).eq("id", account.id);
      await supabase.from("wallet_transactions").insert({
        user_id: user.id,
        type: "debit",
        amount: num,
        currency: "KES",
        status: "completed",
        description: `Savings deposit to ${account.name}`,
        reference_id: account.id,
        reference_type: "savings",
      });
      fetchData();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ padding: 16, paddingTop: 24, backgroundColor: "#1e293b", flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#f8fafc" }}>Savings & Loans</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: "row", padding: 12, backgroundColor: "#1e293b", gap: 8 }}>
        <TouchableOpacity onPress={() => setTab("savings")} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: tab === "savings" ? "#22c55e" : "#334155", alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: tab === "savings" ? "#fff" : "#cbd5e1" }}>Savings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab("loans")} style={{ flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: tab === "loans" ? "#3b82f6" : "#334155", alignItems: "center" }}>
          <Text style={{ fontSize: 13, fontWeight: "600", color: tab === "loans" ? "#fff" : "#cbd5e1" }}>Loans</Text>
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />} contentContainerStyle={{ padding: 16 }}>
        {tab === "savings" && (
          <>
            {showCreateSavings && (
              <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9", marginBottom: 16 }}>Create Savings Account</Text>
                <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Account Name</Text>
                <TextInput value={savingsName} onChangeText={setSavingsName} placeholder="e.g. Emergency Fund" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 12 }} />
                <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Target Amount (optional)</Text>
                <TextInput value={savingsTarget} onChangeText={setSavingsTarget} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 16 }} />
                <TouchableOpacity onPress={createSavings} disabled={submitting} style={{ backgroundColor: "#22c55e", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Create</Text>}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#94a3b8" }}>My Savings</Text>
              <TouchableOpacity onPress={() => setShowCreateSavings(!showCreateSavings)}>
                <Plus size={20} color="#22c55e" />
              </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
              <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 40 }} />
            ) : savings.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <PiggyBank size={48} color="#334155" />
                <Text style={{ color: "#475569", marginTop: 16 }}>No savings accounts</Text>
              </View>
            ) : (
              savings.map((s) => (
                <View key={s.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9" }}>{s.name}</Text>
                    <Text style={{ fontSize: 12, color: "#22c55e" }}>{s.interest_rate}% APR</Text>
                  </View>
                  <Text style={{ fontSize: 22, fontWeight: "700", color: "#f1f5f9", marginBottom: 4 }}>KES {s.balance.toFixed(2)}</Text>
                  {s.target_amount && (
                    <View style={{ height: 6, backgroundColor: "#0f172a", borderRadius: 3, marginVertical: 8 }}>
                      <View style={{ height: 6, backgroundColor: "#22c55e", borderRadius: 3, width: `${Math.min((s.balance / s.target_amount) * 100, 100)}%` }} />
                    </View>
                  )}
                  <Text style={{ fontSize: 12, color: "#64748b" }}>Status: <Text style={{ color: s.status === "active" ? "#22c55e" : "#f59e0b", textTransform: "capitalize" }}>{s.status}</Text></Text>
                </View>
              ))
            )}
          </>
        )}

        {tab === "loans" && (
          <>
            {showApplyLoan && (
              <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9", marginBottom: 16 }}>Apply for Loan</Text>
                <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Amount (KES)</Text>
                <TextInput value={loanAmount} onChangeText={setLoanAmount} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 12 }} />
                <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Purpose</Text>
                <TextInput value={loanPurpose} onChangeText={setLoanPurpose} placeholder="What is the loan for?" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 16 }} />
                <TouchableOpacity onPress={applyLoan} disabled={submitting} style={{ backgroundColor: "#3b82f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
                  {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Apply</Text>}
                </TouchableOpacity>
              </View>
            )}

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <Text style={{ fontSize: 16, fontWeight: "600", color: "#94a3b8" }}>My Loans</Text>
              <TouchableOpacity onPress={() => setShowApplyLoan(!showApplyLoan)}>
                <Plus size={20} color="#3b82f6" />
              </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
            ) : loans.length === 0 ? (
              <View style={{ alignItems: "center", paddingVertical: 40 }}>
                <TrendingUp size={48} color="#334155" />
                <Text style={{ color: "#475569", marginTop: 16 }}>No loans</Text>
              </View>
            ) : (
              loans.map((loan) => (
                <View key={loan.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9" }}>KES {loan.amount.toFixed(2)}</Text>
                    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: (loan.status === "approved" || loan.status === "active") ? "#22c55e20" : loan.status === "pending" ? "#f59e0b20" : "#ef444420" }}>
                      <Text style={{ fontSize: 11, color: loan.status === "approved" || loan.status === "active" ? "#22c55e" : loan.status === "pending" ? "#f59e0b" : "#ef4444", textTransform: "capitalize" }}>{loan.status}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 13, color: "#94a3b8", marginBottom: 4 }}>{loan.purpose}</Text>
                  <Text style={{ fontSize: 12, color: "#64748b" }}>Interest: {loan.interest_rate}%</Text>
                  {loan.repaid_amount > 0 && (
                    <Text style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>Repaid: KES {loan.repaid_amount.toFixed(2)}</Text>
                  )}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

