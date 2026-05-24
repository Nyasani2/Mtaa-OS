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
  Smartphone,
  Bitcoin,
  QrCode,
  Zap,
  ArrowDownLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWalletStore } from "@/lib/modules/wallet/store";
import type { WalletTransaction } from "@/lib/modules/wallet/types";

type DepositMethod = "bank" | "mobile_money" | "crypto" | "qr" | "go_fund_repay";

const METHODS: { id: DepositMethod; label: string; icon: any; color: string; bg: string }[] = [
  { id: "bank", label: "Bank Transfer", icon: Landmark, color: "#3B82F6", bg: "#DBEAFE" },
  { id: "mobile_money", label: "Mobile Money", icon: Smartphone, color: "#10B981", bg: "#D1FAE5" },
  { id: "crypto", label: "Crypto", icon: Bitcoin, color: "#F59E0B", bg: "#FEF3C7" },
  { id: "qr", label: "Scan QR", icon: QrCode, color: "#8B5CF6", bg: "#EDE9FE" },
];

export default function DepositScreen() {
  const router = useRouter();
  const { accounts, activeAccountId, goFund, addTransaction, repayGoFund, addNotification } = useWalletStore();

  const [method, setMethod] = useState<DepositMethod>("bank");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [errorMsg, setErrorMsg] = useState("");

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const balance = activeAccount?.balance || 0;
  const numericAmount = parseFloat(amount) || 0;
  const showGoFundRepay = goFund.isActive && goFund.creditUsed > 0;

  const allMethods = showGoFundRepay
    ? [
        ...METHODS,
        {
          id: "go_fund_repay" as DepositMethod,
          label: "Repay Go Fund",
          icon: Zap,
          color: "#F97316",
          bg: "#FFEDD5",
        },
      ]
    : METHODS;

  const handleDeposit = () => {
    setErrorMsg("");

    if (method === "go_fund_repay") {
      if (numericAmount <= 0) {
        setErrorMsg("Enter a valid amount");
        return;
      }
      if (numericAmount > balance) {
        setErrorMsg("Insufficient wallet balance for repayment");
        return;
      }
      const success = repayGoFund(numericAmount, "wallet");
      if (!success) {
        setErrorMsg("Repayment failed");
        return;
      }
      setStep("success");
      return;
    }

    if (numericAmount <= 0) {
      setErrorMsg("Enter a valid amount");
      return;
    }

    const newBalance = balance + numericAmount;

    const tx: WalletTransaction = {
      id: Math.random().toString(36).substring(2, 15),
      type: "deposit",
      amount: numericAmount,
      currency: "KES",
      status: "completed",
      description: `Deposit via ${allMethods.find((m) => m.id === method)?.label}`,
      balanceBefore: balance,
      balanceAfter: newBalance,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    addTransaction(tx);

    addNotification({
      id: Math.random().toString(36).substring(2, 15),
      type: "payment_received",
      title: "Deposit Successful",
      message: `KSh ${numericAmount.toLocaleString()} deposited via ${allMethods.find((m) => m.id === method)?.label}`,
      amount: numericAmount,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    // Auto-repay Go Fund if enabled and there is credit used
    if (goFund.autoRepay && goFund.creditUsed > 0 && method !== "go_fund_repay") {
      const repayAmount = Math.min(numericAmount, goFund.creditUsed);
      setTimeout(() => {
        repayGoFund(repayAmount, "deposit");
      }, 500);
    }

    setStep("success");
  };

  if (step === "success") {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <View style={styles.resultContent}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color="#10B981" />
          </View>
          <Text style={styles.resultTitle}>
            {method === "go_fund_repay" ? "Go Fund Repaid!" : "Deposit Successful!"}
          </Text>
          <Text style={styles.resultAmount}>KSh {numericAmount.toLocaleString()}</Text>
          {method === "go_fund_repay" && (
            <Text style={styles.resultSub}>
              Remaining Go Fund balance: KSh {goFund.creditUsed.toLocaleString()}
            </Text>
          )}
          <TouchableOpacity style={styles.resultBtn} onPress={() => setStep("form")}>
            <Text style={styles.resultBtnText}>
              {method === "go_fund_repay" ? "Repay More" : "Deposit More"}
            </Text>
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
          <Text style={styles.headerTitle}>
            {method === "go_fund_repay" ? "Repay Go Fund" : "Deposit Funds"}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Method Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.methodScroll}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
          >
            {allMethods.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[
                  styles.methodChip,
                  method === m.id && { borderColor: m.color, backgroundColor: m.bg },
                ]}
                onPress={() => {
                  setMethod(m.id);
                  setErrorMsg("");
                }}
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

          {/* Go Fund repay info */}
          {method === "go_fund_repay" && (
            <View style={styles.goFundInfoCard}>
              <View style={styles.goFundInfoRow}>
                <Zap size={18} color="#F97316" />
                <Text style={styles.goFundInfoTitle}>Go Fund Repayment</Text>
              </View>
              <View style={styles.goFundInfoGrid}>
                <View>
                  <Text style={styles.goFundInfoLabel}>Credit Used</Text>
                  <Text style={styles.goFundInfoValue}>KSh {goFund.creditUsed.toLocaleString()}</Text>
                </View>
                <View>
                  <Text style={styles.goFundInfoLabel}>Due Date</Text>
                  <Text style={styles.goFundInfoValue}>
                    {goFund.dueDate
                      ? new Date(goFund.dueDate).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "short",
                        })
                      : "N/A"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.goFundInfoLabel}>Daily Fee</Text>
                  <Text style={styles.goFundInfoValue}>KSh {goFund.dailyFee}</Text>
                </View>
              </View>
            </View>
          )}

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

          {method === "crypto" && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Crypto Address</Text>
              <View style={styles.inputWrap}>
                <Bitcoin size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Paste wallet address"
                  value={cryptoAddress}
                  onChangeText={setCryptoAddress}
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

          {method === "qr" && (
            <View style={styles.qrPlaceholder}>
              <QrCode size={48} color="#D1D5DB" />
              <Text style={styles.qrPlaceholderText}>Point camera at QR code to scan</Text>
              <TouchableOpacity style={styles.qrBtn}>
                <Text style={styles.qrBtnText}>Open Camera</Text>
              </TouchableOpacity>
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

        {/* Action Button */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleDeposit} activeOpacity={0.8}>
            <LinearGradient
              colors={method === "go_fund_repay" ? ["#F97316", "#EA580C"] : ["#10B981", "#059669"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionBtn}
            >
              <ArrowDownLeft size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>
                {method === "go_fund_repay"
                  ? `Repay KSh ${numericAmount > 0 ? numericAmount.toLocaleString() : ""}`
                  : `Deposit KSh ${numericAmount > 0 ? numericAmount.toLocaleString() : ""}`}
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

  goFundInfoCard: {
    backgroundColor: "#FFF7ED",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FED7AA",
  },
  goFundInfoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  goFundInfoTitle: { fontSize: 15, fontWeight: "700", color: "#C2410C" },
  goFundInfoGrid: { flexDirection: "row", justifyContent: "space-between" },
  goFundInfoLabel: { fontSize: 11, color: "#9CA3AF", marginBottom: 2 },
  goFundInfoValue: { fontSize: 14, fontWeight: "700", color: "#1F2937" },

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
  amountPrefix: { fontSize: 18, fontWeight: "700", color: "#10B981", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "700", color: "#1F2937", paddingVertical: 12 },

  qrPlaceholder: {
    alignItems: "center",
    paddingVertical: 40,
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#E5E7EB",
  },
  qrPlaceholderText: { fontSize: 14, color: "#9CA3AF", marginTop: 12 },
  qrBtn: {
    marginTop: 16,
    backgroundColor: "#10B981",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  qrBtnText: { fontSize: 14, fontWeight: "600", color: "#FFF" },

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
