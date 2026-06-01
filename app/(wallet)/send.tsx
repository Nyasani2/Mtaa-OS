import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWalletStore } from "@/lib/modules/wallet/store";
import { sendMoney } from "@/lib/modules/wallet/engine";
import type { WalletTransaction } from "@/lib/modules/wallet/types";
import { ArrowUpRight, User, Phone, Zap, CheckCircle } from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export default function SendScreen() {
  const router = useRouter();
  const { accounts, activeAccountId, goFund, addTransaction, drawGoFund, addNotification } = useWalletStore();

  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [sending, setSending] = useState(false);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const balance = activeAccount?.balance || 0;
  const numericAmount = parseFloat(amount) || 0;
  const shortfall = numericAmount > balance ? numericAmount - balance : 0;
  const canUseGoFund = goFund.isActive && goFund.isEligible && shortfall > 0 && shortfall <= goFund.creditAvailable;
  const [useGoFund, setUseGoFund] = useState(false);

  const handleSend = async () => {
    if (!recipientName || !recipientPhone || numericAmount <= 0) {
      Alert.alert("Error", "Fill all fields with valid data");
      return;
    }

    // Input validation
    if (!/^\+?[0-9\s-]{10,}$/.test(recipientPhone)) {
      Alert.alert("Error", "Please enter a valid phone number");
      return;
    }

    const totalAvailable = balance + (useGoFund ? goFund.creditAvailable : 0);
    if (numericAmount > totalAvailable) {
      Alert.alert("Error", `Insufficient funds. Max: KSh ${totalAvailable.toLocaleString()}`);
      return;
    }

    setSending(true);

    // Use Go Fund if needed
    const goFundAmount = useGoFund && shortfall > 0 ? shortfall : 0;
    if (goFundAmount > 0) {
      drawGoFund(goFundAmount, `Send to ${recipientName}`);
    }

    // Server-validated send
    const result = await sendMoney({
      recipientName,
      recipientPhone,
      amount: numericAmount,
      note,
      senderAccountId: activeAccountId,
    });

    setSending(false);

    if (!result.success) {
      Alert.alert("Send Failed", result.error || "Transaction could not be completed");
      return;
    }

    // Sync the confirmed transaction into local store
    if (result.transaction) {
      addTransaction(result.transaction);
    }
    if (result.notification) {
      addNotification(result.notification);
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
          <Text style={styles.resultTitle}>Sent Successfully!</Text>
          <Text style={styles.resultAmount}>KSh {numericAmount.toLocaleString()}</Text>
          <Text style={styles.resultTo}>to {recipientName}</Text>
          <TouchableOpacity style={styles.resultBtn} onPress={() => { setStep("form"); setRecipientName(""); setRecipientPhone(""); setAmount(""); setNote(""); }}>
            <Text style={styles.resultBtnText}>Send Again</Text>
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
          <Text style={styles.headerTitle}>Send Money</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient Name</Text>
            <View style={styles.inputWrap}>
              <User size={18} color="#9CA3AF" />
              <TextInput style={styles.input} placeholder="Enter name" value={recipientName} onChangeText={setRecipientName} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <View style={styles.inputWrap}>
              <Phone size={18} color="#9CA3AF" />
              <TextInput style={styles.input} placeholder="2547XXXXXXXX" keyboardType="phone-pad" value={recipientPhone} onChangeText={setRecipientPhone} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (KSh)</Text>
            <View style={styles.amountWrap}>
              <Text style={styles.amountPrefix}>KSh</Text>
              <TextInput style={styles.amountInput} placeholder="0.00" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Note (Optional)</Text>
            <TextInput style={[styles.input, styles.noteInput]} placeholder="What's this for?" value={note} onChangeText={setNote} multiline />
          </View>

          {numericAmount > balance && canUseGoFund && (
            <TouchableOpacity style={[styles.goFundToggle, useGoFund && styles.goFundToggleActive]} onPress={() => setUseGoFund(!useGoFund)}>
              <View style={styles.goFundToggleRow}>
                <Zap size={18} color="#F97316" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.goFundToggleTitle}>{useGoFund ? "Using Go Fund" : "Use Go Fund?"}</Text>
                  <Text style={styles.goFundToggleSub}>Need KSh {shortfall.toLocaleString()} more</Text>
                </View>
                <View style={[styles.toggleDot, useGoFund && { borderColor: "#F97316" }]}>
                  {useGoFund && <View style={styles.toggleDotInner} />}
                </View>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleSend} activeOpacity={0.8} disabled={sending}>
            <LinearGradient colors={["#3B82F6", "#2563EB"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.sendBtn, sending && { opacity: 0.6 }]}>
              <ArrowUpRight size={18} color="#FFF" />
              <Text style={styles.sendBtnText}>{sending ? "Sending..." : `Send KSh ${numericAmount > 0 ? numericAmount.toLocaleString() : ""}`}</Text>
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
  form: { paddingHorizontal: 20, gap: 16 },
  inputGroup: { gap: 8 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "#E5E7EB", gap: 10 },
  input: { flex: 1, fontSize: 16, color: "#1F2937", paddingVertical: 14 },
  noteInput: { height: 80, textAlignVertical: "top", paddingTop: 14 },
  amountWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 12, paddingHorizontal: 14, borderWidth: 1, borderColor: "#E5E7EB" },
  amountPrefix: { fontSize: 18, fontWeight: "700", color: "#3B82F6", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "700", color: "#1F2937", paddingVertical: 12 },
  goFundToggle: { backgroundColor: "#FFF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E5E7EB" },
  goFundToggleActive: { borderColor: "#F97316", backgroundColor: "#FFF7ED" },
  goFundToggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  goFundToggleTitle: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  goFundToggleSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  toggleDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
  toggleDotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#F97316" },
  sendBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16, marginTop: 8 },
  sendBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  resultContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center" },
  resultContent: { alignItems: "center", paddingHorizontal: 40 },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  resultTitle: { fontSize: 22, fontWeight: "800", color: "#1F2937", marginBottom: 8 },
  resultAmount: { fontSize: 32, fontWeight: "800", color: "#10B981", marginBottom: 4 },
  resultTo: { fontSize: 15, color: "#6B7280", marginBottom: 24 },
  resultBtn: { backgroundColor: "#3B82F6", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, width: "100%", alignItems: "center", marginBottom: 12 },
  resultBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  resultBtnSecondary: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, width: "100%", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  resultBtnSecondaryText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
});
