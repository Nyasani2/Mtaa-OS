"use client";

import { Alert, useState, useEffect, useCallback } from "react";
import { Alert,
  View, Text, TouchableOpacity, ScrollView, TextInput,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Alert, useRouter } from "expo-router";
import { Alert,
  ArrowLeft, Landmark, Plus, Trash2, CheckCircle, XCircle,
  CreditCard, ChevronRight,
} from "lucide-react-native";

interface BankAccount {
  id: string;
  user_id: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  branch: string;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
}

export default function BankAccountsScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [branch, setBranch] = useState("");

  const fetchAccounts = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      setAccounts(data || []);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAccounts();
    setRefreshing(false);
  }, [fetchAccounts]);

  const addAccount = async () => {
    if (!user?.id || !bankName.trim() || !accountNumber.trim() || !accountName.trim()) {
      Alert.alert("Required", "Bank name, account number, and account name are required");
      return;
    }
    setAdding(true);
    try {
      const { error } = await supabase.from("bank_accounts").insert({
        user_id: user.id,
        bank_name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_name: accountName.trim(),
        branch: branch.trim() || null,
        is_default: accounts.length === 0,
        is_verified: false,
      });
      if (error) throw error;
      Alert.alert("Added", "Bank account added. Verification pending.");
      setShowAdd(false);
      setBankName(""); setAccountNumber(""); setAccountName(""); setBranch("");
      fetchAccounts();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setAdding(false);
    }
  };

  const removeAccount = async (id: string) => {
    try {
      const { error } = await supabase.from("bank_accounts").delete().eq("id", id);
      if (error) throw error;
      fetchAccounts();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f172a" }}>
      <View style={{ padding: 16, paddingTop: 24, backgroundColor: "#1e293b", flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#f8fafc" }}>Bank Accounts</Text>
        <TouchableOpacity onPress={() => setShowAdd(!showAdd)}>
          <Plus size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />} contentContainerStyle={{ padding: 16 }}>
        {showAdd && (
          <View style={{ backgroundColor: "#1e293b", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9", marginBottom: 16 }}>Add Bank Account</Text>
            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Bank Name</Text>
            <TextInput value={bankName} onChangeText={setBankName} placeholder="e.g. KCB, Equity" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 12 }} />
            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Account Number</Text>
            <TextInput value={accountNumber} onChangeText={setAccountNumber} placeholder="Enter account number" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 12 }} />
            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Account Name</Text>
            <TextInput value={accountName} onChangeText={setAccountName} placeholder="Name on account" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 12 }} />
            <Text style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>Branch (optional)</Text>
            <TextInput value={branch} onChangeText={setBranch} placeholder="Branch name" placeholderTextColor="#475569" style={{ backgroundColor: "#0f172a", borderRadius: 10, padding: 14, color: "#f1f5f9", fontSize: 14, marginBottom: 16 }} />
            <TouchableOpacity onPress={addAccount} disabled={adding} style={{ backgroundColor: "#3b82f6", paddingVertical: 14, borderRadius: 12, alignItems: "center" }}>
              {adding ? <ActivityIndicator color="#fff" /> : <Text style={{ fontSize: 15, fontWeight: "600", color: "#fff" }}>Add Account</Text>}
            </TouchableOpacity>
          </View>
        )}

        <Text style={{ fontSize: 16, fontWeight: "600", color: "#94a3b8", marginBottom: 12 }}>Linked Accounts</Text>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
        ) : accounts.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Landmark size={48} color="#334155" />
            <Text style={{ color: "#475569", marginTop: 16 }}>No bank accounts linked</Text>
          </View>
        ) : (
          accounts.map((acct) => (
            <View key={acct.id} style={{ backgroundColor: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <Landmark size={20} color="#3b82f6" />
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "#f1f5f9" }}>{acct.bank_name}</Text>
                </View>
                {acct.is_default && (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: "#3b82f620" }}>
                    <Text style={{ fontSize: 11, color: "#3b82f6" }}>Default</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 14, color: "#94a3b8", marginBottom: 2 }}>{acct.account_name || 'Bank account'}</Text>
              <Text style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>****{(acct.account_number || '0000').slice(-4)}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                {acct.is_verified ? (
                  <><CheckCircle size={14} color="#22c55e" /><Text style={{ fontSize: 12, color: "#22c55e" }}>Verified</Text></>
                ) : (
                  <><XCircle size={14} color="#f59e0b" /><Text style={{ fontSize: 12, color: "#f59e0b" }}>Pending Verification</Text></>
                )}
              </View>
              <TouchableOpacity onPress={() => removeAccount(acct.id)} style={{ position: "absolute", top: 16, right: 16 }}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

