import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Landmark,
  UserCheck,
  Smartphone,
  ArrowUpRight,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWalletStore } from "@/lib/modules/wallet/store";
import type { WalletTransaction } from "@/lib/modules/wallet/types";

type WithdrawMethod = "bank" | "agent" | "mobile_money";

const METHODS: { id: WithdrawMethod; label: string; icon: any; color: string; bg: string }[] = [
  { id: "bank", label: "Bank Account", icon: Landmark, color: "#3B82F6", bg: "#DBEAFE" },
  { id: "agent", label: "Agent", icon: UserCheck, color: "#F59E0B", bg: "#FEF3C7" },
  { id: "mobile_money", label: "Mobile Money", icon: Smartphone, color: "#10B981", bg: "#D1FAE5" },
];

export default function WithdrawScreen() {
  const router = useRouter();
  const { accounts, activeAccountId, goFund, addTransaction, addNotification } = useWalletStore();

  const [method, setMethod] = useState<WithdrawMethod>("bank");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentCode, setAgentCode] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [errorMsg, setErrorMsg] = useState("");

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const balance = activeAccount?.balance || 0;
  const numericAmount = parseFloat(amount) || 0;
  const totalAvailable = balance + (goFund.isActive ? goFund.creditAvailable : 0);

  const handleWithdraw = () => {
    setErrorMsg("");

    if (numericAmount <= 0) {
      setErrorMsg("Enter a valid amount");
      return;
    }
    if (numericAmount > totalAvailable) {
      setErrorMsg(`Insufficient funds. Max available: KSh ${totalAvailable.toLocaleString()}`);
      return;
    }

    const newBalance = balance - numericAmount;

    const tx: WalletTransaction = {
      id: Math.random().toString(36).substring(2, 15),
      type: "withdraw",
      amount: numericAmount,
      currency: "KES",
      status: "completed",
      description: `Withdrawal via ${METHODS.find((m) => m.id === method)?.label}`,
      balanceBefore: balance,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    addTransaction(tx);

    addNotification({
      id: Math.random().toString(36).substring(2, 15),
      type: "payment_sent",
      title: "Withdrawal Successful",
      message: `KSh ${numericAmount.toLocaleString()} withdrawn`,
      amount: numericAmount,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    setStep("success");
  };

  if (step === "success") {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <View style={styles.resultContent}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color="#10B981" />
          </View>
          <Text style={styles.resultTitle}>Withdrawal Successful!</Text>
          <Text style={styles.resultAmount}>KSh {numericAmount.toLocaleString()}</Text>
          <Text style={styles.resultSub}>via {METHODS.find((m) => m.id === method)?.label}</Text>
          <TouchableOpacity style={styles.resultBtn} onPress={() => setStep("form")}>
            <Text style={styles.resultBtnText}>Withdraw More</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultBtnSecondary} onPress={() => router.back()}>
            <Text style={styles.resultBtnSecondaryText}>Back to Wallet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Withdraw Funds</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Balance hint */}
          <View style={styles.balanceHint}>
            <Text style={styles.balanceHintText}>
              Available: KSh {balance.toLocaleString()}
            </Text>
            {goFund.isActive && goFund.creditAvailable > 0 && (
              <Text style={styles.balanceHintSub}>
                + KSh {goFund.creditAvailable.toLocaleString()} Go Fund
              </Text>
            )}
          </View>

          {/* Method Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.methodScroll}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.methodChip,
                  method === m.id && { borderColor: m.color, backgroundColor: m.bg },
                ]}
                onPress={() => setMethod(m.id)}
              >
                <m.icon size={18} color={m.color} />
                <Text
                  style={[
                    styles.methodChipText,
                    method === m.id && { color: m.color, fontWeight: "700" },
                  ]}
                >
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (KSh)</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.amountPrefix}>KSh</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Quick amounts */}
          <View style={styles.quickAmounts}>
            {[500, 1000, 2000, 5000, 10000].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickChip}
                onPress={() => setAmount(amt.toString())}
              >
                <Text style={styles.quickChipText}>KSh {amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Method-specific fields */}
          {method === "mobile_money" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>M-Pesa Phone Number</Text>
              <View style={styles.inputWrap}>
                <Smartphone size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="07XX XXX XXX"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            </View>
          )}

          {method === "agent" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Agent Code</Text>
              <View style={styles.inputWrap}>
                <UserCheck size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter agent code"
                  value={agentCode}
                  onChangeText={setAgentCode}
                />
              </View>
            </View>
          )}

          {method === "bank" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Account Number</Text>
              <View style={styles.inputWrap}>
                <Landmark size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter account number"
                  value={bankAccount}
                  onChangeText={setBankAccount}
                />
              </View>
            </View>
          )}

          {errorMsg && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity onPress={handleWithdraw} activeOpacity={0.8}>
            <LinearGradient
              colors={["#BE185D", "#9D174D"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtn}
            >
              <ArrowUpRight size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>
                Withdraw KSh {numericAmount > 0 ? numericAmount.toLocaleString() : ""}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },

  balanceHint: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCE7F3",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  balanceHintText: { fontSize: 14, fontWeight: "600", color: "#BE185D" },
  balanceHintSub: { fontSize: 12, color: "#F472B6", marginLeft: 8 },

  methodScroll: { marginBottom: 20, marginTop: 8 },
  methodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  methodChipText: { fontSize: 13, fontWeight: "500", color: "#6B7280" },

  inputGroup: { marginHorizontal: 20, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: { flex: 1, fontSize: 16, color: "#1F2937", paddingVertical: 12, marginLeft: 10 },
  amountWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  amountPrefix: { fontSize: 18, fontWeight: "700", color: "#BE185D", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "700", color: "#1F2937", paddingVertical: 12 },

  quickAmounts: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  quickChip: {
    backgroundColor: "#FFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickChipText: { fontSize: 13, fontWeight: "600", color: "#374151" },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: "#EF4444" },

  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  actionBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  resultContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center" },
  resultContent: { alignItems: "center", paddingHorizontal: 40 },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  resultTitle: { fontSize: 22, fontWeight: "800", color: "#1F2937", marginBottom: 8 },
  resultAmount: { fontSize: 32, fontWeight: "800", color: "#10B981", marginBottom: 4 },
  resultSub: { fontSize: 14, color: "#6B7280", marginBottom: 24 },
  resultBtn: {
    backgroundColor: "#10B981",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    marginBottom: 12,
  },
  resultBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  resultBtnSecondary: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  resultBtnSecondaryText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
});
