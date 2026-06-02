import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWalletStore } from "@/lib/modules/wallet/store";
import { WalletTransaction } from "@/lib/modules/wallet/types";
import { ArrowUpRight, Banknote, Building2, CreditCard, CheckCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function WithdrawScreen() {
  const router = useRouter();
  const { accounts, activeAccountId, linkedBanks, linkedCards, addTransaction, addNotification } = useWalletStore();

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"bank" | "card" | "agent">("bank");
  const [selectedBankId, setSelectedBankId] = useState("");
  const [selectedCardId, setSelectedCardId] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const balance = activeAccount?.balance || 0;
  const numericAmount = parseFloat(amount) || 0;

  const handleWithdraw = () => {
    if (numericAmount <= 0 || numericAmount > balance) {
      Alert.alert("Error", numericAmount > balance ? "Insufficient balance" : "Enter valid amount");
      return;
    }
    if (method === "bank" && !selectedBankId) {
      Alert.alert("Error", "Select a bank account");
      return;
    }
    if (method === "card" && !selectedCardId) {
      Alert.alert("Error", "Select a card");
      return;
    }

    const newBalance = balance - numericAmount;
    const bankName = method === "bank" ? linkedBanks.find((b) => b.id === selectedBankId)?.name : undefined;
    const cardLast4 = method === "card" ? linkedCards.find((c) => c.id === selectedCardId)?.last4 : undefined;

    const tx: WalletTransaction = {
      id: Math.random().toString(36).substring(2, 15),
      type: "withdraw",
      amount: numericAmount,
      currency: "KES",
      status: "completed",
      description: `Withdraw to ${method === "bank" ? bankName : method === "card" ? `card ****${cardLast4}` : "agent"}`,
      balanceBefore: balance,
      balanceAfter: newBalance,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    addTransaction(tx);

    addNotification({
      id: Math.random().toString(36).substring(2, 15),
      type: "payment_sent",
      title: "Withdrawal",
      message: `KSh ${numericAmount.toLocaleString()} withdrawn to ${method === "bank" ? bankName : method === "card" ? `card ****${cardLast4}` : "agent"}`,
      amount: numericAmount,
      read: false,
      isRead: false,
      timestamp: new Date().toISOString(),
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
          <TouchableOpacity style={styles.resultBtn} onPress={() => { setStep("form"); setAmount(""); }}>
            <Text style={styles.resultBtnText}>Withdraw Again</Text>
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Withdraw</Text>
          <Text style={styles.balanceText}>Balance: KSh {balance.toLocaleString()}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.methodRow}>
            <TouchableOpacity style={[styles.methodBtn, method === "bank" && styles.methodBtnActive]} onPress={() => setMethod("bank")}>
              <Building2 size={20} color={method === "bank" ? "#FFF" : "#6B7280"} />
              <Text style={[styles.methodText, method === "bank" && styles.methodTextActive]}>Bank</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.methodBtn, method === "card" && styles.methodBtnActive]} onPress={() => setMethod("card")}>
              <CreditCard size={20} color={method === "card" ? "#FFF" : "#6B7280"} />
              <Text style={[styles.methodText, method === "card" && styles.methodTextActive]}>Card</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.methodBtn, method === "agent" && styles.methodBtnActive]} onPress={() => setMethod("agent")}>
              <Banknote size={20} color={method === "agent" ? "#FFF" : "#6B7280"} />
              <Text style={[styles.methodText, method === "agent" && styles.methodTextActive]}>Agent</Text>
            </TouchableOpacity>
          </View>

          {method === "bank" && (
            <View style={styles.methodList}>
              {linkedBanks.map((bank) => (
                <TouchableOpacity key={bank.id} style={[styles.methodItem, selectedBankId === bank.id && styles.methodItemActive]} onPress={() => setSelectedBankId(bank.id)}>
                  <Building2 size={20} color="#3B82F6" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodItemName}>{bank.name}</Text>
                    <Text style={styles.methodItemDetail}>{bank.accountNumber}</Text>
                  </View>
                  {selectedBankId === bank.id && <CheckCircle size={20} color="#10B981" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {method === "card" && (
            <View style={styles.methodList}>
              {linkedCards.map((card) => (
                <TouchableOpacity key={card.id} style={[styles.methodItem, selectedCardId === card.id && styles.methodItemActive]} onPress={() => setSelectedCardId(card.id)}>
                  <CreditCard size={20} color="#8B5CF6" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.methodItemName}>{card.brand} ****{card.last4}</Text>
                    <Text style={styles.methodItemDetail}>Expires {card.expiryMonth}/{card.expiryYear}</Text>
                  </View>
                  {selectedCardId === card.id && <CheckCircle size={20} color="#10B981" />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (KSh)</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.amountPrefix}>KSh</Text>
              <TextInput style={styles.amountInput} placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            </View>
          </View>

          <TouchableOpacity onPress={handleWithdraw} activeOpacity={0.8}>
            <LinearGradient colors={["#F59E0B", "#D97706"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.withdrawBtn}>
              <ArrowUpRight size={18} color="#FFF" />
              <Text style={styles.withdrawBtnText}>Withdraw KSh {numericAmount > 0 ? numericAmount.toLocaleString() : ""}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1F2937" },
  balanceText: { fontSize: 14, color: "#6B7280", marginTop: 4 },
  form: { paddingHorizontal: 20, gap: 16 },
  methodRow: { flexDirection: "row", gap: 12 },
  methodBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: "#F3F4F6" },
  methodBtnActive: { backgroundColor: "#3B82F6" },
  methodText: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  methodTextActive: { color: "#FFF" },
  methodList: { gap: 8 },
  methodItem: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFF", padding: 14, borderRadius: 12, borderWidth: 1, borderColor: "#E5E7EB" },
  methodItemActive: { borderColor: "#3B82F6", backgroundColor: "#EFF6FF" },
  methodItemName: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  methodItemDetail: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  amountWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "#E5E7EB" },
  amountPrefix: { fontSize: 18, fontWeight: "700", color: "#F59E0B", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "700", color: "#1F2937", paddingVertical: 12 },
  withdrawBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  withdrawBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  resultContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center" },
  resultContent: { alignItems: "center", paddingHorizontal: 40 },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  resultTitle: { fontSize: 22, fontWeight: "800", color: "#1F2937", marginBottom: 8 },
  resultAmount: { fontSize: 32, fontWeight: "800", color: "#10B981", marginBottom: 4 },
  resultBtn: { backgroundColor: "#F59E0B", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, width: "100%", alignItems: "center", marginBottom: 12 },
  resultBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  resultBtnSecondary: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, width: "100%", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  resultBtnSecondaryText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
});
