import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWalletStore } from "@/lib/modules/wallet/store";
import { WalletTransaction } from "@/lib/modules/wallet/types";
import { ArrowLeft, ScanLine, QrCode, ArrowUpRight, Zap, XCircle, CheckCircle, Copy, Share2, Wallet } from "lucide-react-native";
import { useRouter } from "expo-router";
import QRCode from "react-native-qrcode-svg";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export default function QRPayScreen() {
  const router = useRouter();
  const { accounts, activeAccountId, goFund, addTransaction, drawGoFund, addNotification } = useWalletStore();

  const [mode, setMode] = useState<"scan" | "generate" | "pay">("scan");
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [step, setStep] = useState<"form" | "success" | "failed">("form");
  const [errorMsg, setErrorMsg] = useState("");

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const balance = activeAccount?.balance || 0;
  const numericAmount = parseFloat(payAmount) || 0;
  const shortfall = numericAmount > balance ? numericAmount - balance : 0;
  const canUseGoFund = goFund.isActive && goFund.isEligible && shortfall > 0 && shortfall <= goFund.creditAvailable;
  const [useGoFund, setUseGoFund] = useState(false);

  const myQRValue = JSON.stringify({
    type: "mtaa_wallet",
    userId: "user_123",
    name: "My Wallet",
    timestamp: Date.now(),
  });

  const handleScanResult = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      setMerchantName(parsed.name || "Merchant");
      setScanResult(data);
      setMode("pay");
    } catch {
      setMerchantName("Merchant");
      setScanResult(data);
      setMode("pay");
    }
  };

  const handlePay = () => {
    setErrorMsg("");
    if (numericAmount <= 0) {
      setErrorMsg("Enter a valid amount");
      return;
    }
    const totalAvailable = balance + (useGoFund ? goFund.creditAvailable : 0);
    if (numericAmount > totalAvailable) {
      setErrorMsg(`Insufficient funds. Max: KSh ${totalAvailable.toLocaleString()}`);
      return;
    }

    const goFundAmount = useGoFund && shortfall > 0 ? shortfall : 0;
    const walletAmount = numericAmount - goFundAmount;
    const newBalance = balance - walletAmount;

    if (goFundAmount > 0) {
      drawGoFund(goFundAmount, `QR Pay to ${merchantName}`);
    }

    const tx: WalletTransaction = {
      id: Math.random().toString(36).substring(2, 15),
      type: "qr_pay",
      amount: numericAmount,
      currency: "KES",
      status: "completed",
      recipientName: merchantName,
      description: `QR payment to ${merchantName}`,
      balanceBefore: balance,
      balanceAfter: newBalance,
      goFundUsed: goFundAmount > 0 ? goFundAmount : undefined,
      qrCode: scanResult || undefined,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    addTransaction(tx);

    addNotification({
      id: Math.random().toString(36).substring(2, 15),
      type: "payment_sent",
      title: "QR Payment",
      message: `KSh ${numericAmount.toLocaleString()} paid to ${merchantName}`,
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
          <Text style={styles.resultTitle}>Payment Successful!</Text>
          <Text style={styles.resultAmount}>KSh {numericAmount.toLocaleString()}</Text>
          <Text style={styles.resultTo}>to {merchantName}</Text>
          <TouchableOpacity style={styles.resultBtn} onPress={() => { setStep("form"); setMode("scan"); setPayAmount(""); }}>
            <Text style={styles.resultBtnText}>Pay Again</Text>
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Pay</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.modeToggle}>
        <TouchableOpacity style={[styles.modeBtn, mode === "scan" && styles.modeBtnActive]} onPress={() => setMode("scan")}>
          <ScanLine size={16} color={mode === "scan" ? "#FFF" : "#6B7280"} />
          <Text style={[styles.modeBtnText, mode === "scan" && styles.modeBtnTextActive]}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeBtn, mode === "generate" && styles.modeBtnActive]} onPress={() => setMode("generate")}>
          <QrCode size={16} color={mode === "generate" ? "#FFF" : "#6B7280"} />
          <Text style={[styles.modeBtnText, mode === "generate" && styles.modeBtnTextActive]}>My QR</Text>
        </TouchableOpacity>
      </View>

      {mode === "scan" && (
        <View style={styles.scanContainer}>
          <View style={styles.scanFrame}>
            <View style={styles.scanPlaceholder}>
              <ScanLine size={48} color="#D1D5DB" />
              <Text style={styles.scanText}>Point camera at merchant QR code</Text>
              <TouchableOpacity style={styles.simulateBtn} onPress={() => handleScanResult(JSON.stringify({ name: "Jumia Kenya", type: "merchant" }))}>
                <Text style={styles.simulateBtnText}>Simulate Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.scanHint}>Scan to pay instantly</Text>
        </View>
      )}

      {mode === "generate" && (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.generateContent}>
          <View style={styles.qrCard}>
            <Text style={styles.qrTitle}>My Wallet QR</Text>
            <View style={styles.qrWrap}>
              <QRCode value={myQRValue} size={200} backgroundColor="#FFF" color="#1F2937" />
            </View>
            <Text style={styles.qrSub}>Scan to receive payments</Text>
            <View style={styles.qrActions}>
              <TouchableOpacity style={styles.qrActionBtn}>
                <Copy size={18} color="#3B82F6" />
                <Text style={styles.qrActionText}>Copy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.qrActionBtn}>
                <Share2 size={18} color="#3B82F6" />
                <Text style={styles.qrActionText}>Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}

      {mode === "pay" && (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.payCard}>
            <View style={styles.payMerchant}>
              <View style={styles.payMerchantIcon}>
                <Wallet size={24} color="#10B981" />
              </View>
              <Text style={styles.payMerchantName}>{merchantName}</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (KSh)</Text>
              <View style={styles.amountWrap}>
                <Text style={styles.amountPrefix}>KSh</Text>
                <TextInput style={styles.amountInput} placeholder="0.00" keyboardType="decimal-pad" value={payAmount} onChangeText={setPayAmount} />
              </View>
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

            {errorMsg && (
              <View style={styles.errorBanner}>
                <XCircle size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            <TouchableOpacity onPress={handlePay} activeOpacity={0.8}>
              <LinearGradient colors={["#10B981", "#059669"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.payBtn}>
                <ArrowUpRight size={18} color="#FFF" />
                <Text style={styles.payBtnText}>Pay KSh {numericAmount > 0 ? numericAmount.toLocaleString() : ""}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  modeToggle: { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#F3F4F6", borderRadius: 12, padding: 4, marginBottom: 20 },
  modeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  modeBtnActive: { backgroundColor: "#10B981" },
  modeBtnText: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  modeBtnTextActive: { color: "#FFF" },
  scanContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
  scanFrame: { width: width - 80, height: width - 80, borderRadius: 24, borderWidth: 2, borderColor: "#10B981", borderStyle: "dashed", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF" },
  scanPlaceholder: { alignItems: "center", padding: 20 },
  scanText: { fontSize: 14, color: "#9CA3AF", marginTop: 16, textAlign: "center" },
  simulateBtn: { marginTop: 20, backgroundColor: "#10B981", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  simulateBtnText: { fontSize: 14, fontWeight: "600", color: "#FFF" },
  scanHint: { fontSize: 13, color: "#9CA3AF", marginTop: 20 },
  generateContent: { alignItems: "center", paddingVertical: 20 },
  qrCard: { backgroundColor: "#FFF", borderRadius: 20, padding: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  qrTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937", marginBottom: 20 },
  qrWrap: { padding: 16, backgroundColor: "#FFF", borderRadius: 16, borderWidth: 1, borderColor: "#F3F4F6" },
  qrSub: { fontSize: 13, color: "#9CA3AF", marginTop: 16 },
  qrActions: { flexDirection: "row", gap: 16, marginTop: 20 },
  qrActionBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  qrActionText: { fontSize: 14, fontWeight: "600", color: "#3B82F6" },
  payCard: { paddingHorizontal: 20, paddingTop: 10 },
  payMerchant: { alignItems: "center", marginBottom: 24 },
  payMerchantIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  payMerchantName: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  amountWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 4, borderWidth: 1, borderColor: "#E5E7EB" },
  amountPrefix: { fontSize: 18, fontWeight: "700", color: "#10B981", marginRight: 8 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: "700", color: "#1F2937", paddingVertical: 12 },
  goFundToggle: { backgroundColor: "#FFF", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E5E7EB", marginBottom: 20 },
  goFundToggleActive: { borderColor: "#F97316", backgroundColor: "#FFF7ED" },
  goFundToggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  goFundToggleTitle: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  goFundToggleSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  toggleDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center" },
  toggleDotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#F97316" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", padding: 12, borderRadius: 10, marginBottom: 16 },
  errorText: { flex: 1, fontSize: 13, color: "#EF4444" },
  payBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 14, paddingVertical: 16 },
  payBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  resultContainer: { flex: 1, backgroundColor: "#F8FAFC", justifyContent: "center", alignItems: "center" },
  resultContent: { alignItems: "center", paddingHorizontal: 40 },
  successIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  resultTitle: { fontSize: 22, fontWeight: "800", color: "#1F2937", marginBottom: 8 },
  resultAmount: { fontSize: 32, fontWeight: "800", color: "#10B981", marginBottom: 4 },
  resultTo: { fontSize: 15, color: "#6B7280", marginBottom: 24 },
  resultBtn: { backgroundColor: "#10B981", paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, width: "100%", alignItems: "center", marginBottom: 12 },
  resultBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  resultBtnSecondary: { paddingHorizontal: 32, paddingVertical: 14, borderRadius: 14, width: "100%", alignItems: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  resultBtnSecondaryText: { fontSize: 16, fontWeight: "600", color: "#6B7280" },
});
