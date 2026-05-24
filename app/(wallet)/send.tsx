import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Send,
  User,
  Phone,
  Hash,
  CheckCircle,
  XCircle,
  Zap,
  AlertCircle,
  ChevronRight,
  Contact,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWalletStore } from "@/lib/modules/wallet/store";
import type { WalletTransaction } from "@/lib/modules/wallet/types";

const CONTACTS = [
  { id: "1", name: "John Kamau", phone: "0712345678" },
  { id: "2", name: "Mary Wanjiku", phone: "0723456789" },
  { id: "3", name: "Peter Ochieng", phone: "0734567890" },
  { id: "4", name: "Grace Achieng", phone: "0745678901" },
  { id: "5", name: "David Mutua", phone: "0756789012" },
];

export default function SendMoneyScreen() {
  const router = useRouter();
  const { accounts, activeAccountId, goFund, addTransaction, drawGoFund, addNotification } = useWalletStore();

  const [step, setStep] = useState<"form" | "confirm" | "processing" | "success" | "failed">("form");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [useGoFund, setUseGoFund] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showContacts, setShowContacts] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const balance = activeAccount?.balance || 0;
  const numericAmount = parseFloat(amount) || 0;
  const shortfall = numericAmount > balance ? numericAmount - balance : 0;
  const canUseGoFund = goFund.isActive && goFund.isEligible && shortfall > 0 && shortfall <= goFund.creditAvailable;

  const filteredContacts = useMemo(() => {
    if (!searchQuery) return CONTACTS;
    const q = searchQuery.toLowerCase();
    return CONTACTS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [searchQuery]);

  const selectContact = (contact: (typeof CONTACTS)[0]) => {
    setRecipientPhone(contact.phone);
    setRecipientName(contact.name);
    setShowContacts(false);
  };

  const validate = () => {
    if (!recipientPhone || recipientPhone.length < 9) {
      setErrorMsg("Enter a valid phone number");
      return false;
    }
    if (numericAmount <= 0) {
      setErrorMsg("Enter a valid amount");
      return false;
    }
    const totalAvailable = balance + (useGoFund ? goFund.creditAvailable : 0);
    if (numericAmount > totalAvailable) {
      setErrorMsg(`Insufficient funds. You have KSh ${totalAvailable.toLocaleString()} available`);
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleSend = () => {
    if (!validate()) return;
    setStep("confirm");
  };

  const confirmSend = async () => {
    setStep("processing");

    // Simulate API call
    await new Promise((r) => setTimeout(r, 2000));

    const goFundAmount = useGoFund && shortfall > 0 ? shortfall : 0;
    const walletAmount = numericAmount - goFundAmount;
    const newBalance = balance - walletAmount;

    // Draw Go Fund if needed
    if (goFundAmount > 0) {
      const success = drawGoFund(goFundAmount, `Send to ${recipientName || recipientPhone}`);
      if (!success) {
        setStep("failed");
        setErrorMsg("Go Fund draw failed");
        return;
      }
    }

    const tx: WalletTransaction = {
      id: Math.random().toString(36).substring(2, 15),
      type: "send",
      amount: numericAmount,
      currency: "KES",
      status: "completed",
      recipientName: recipientName || recipientPhone,
      recipientPhone,
      note,
      balanceBefore: balance,
      balanceAfter: newBalance,
      goFundUsed: goFundAmount > 0 ? goFundAmount : undefined,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    addTransaction(tx);

    addNotification({
      id: Math.random().toString(36).substring(2, 15),
      type: "payment_sent",
      title: "Payment Sent",
      message: `KSh ${numericAmount.toLocaleString()} sent to ${recipientName || recipientPhone}`,
      amount: numericAmount,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

    setStep("success");
  };

  const reset = () => {
    setStep("form");
    setRecipientPhone("");
    setRecipientName("");
    setAmount("");
    setNote("");
    setUseGoFund(false);
    setErrorMsg("");
  };

  if (step === "success") {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <View style={styles.resultContent}>
          <View style={styles.successIcon}>
            <CheckCircle size={64} color="#10B981" />
          </View>
          <Text style={styles.resultTitle}>Payment Sent!</Text>
          <Text style={styles.resultAmount}>KSh {numericAmount.toLocaleString()}</Text>
          <Text style={styles.resultTo}>to {recipientName || recipientPhone}</Text>
          {useGoFund && shortfall > 0 && (
            <View style={styles.goFundBadge}>
              <Zap size={14} color="#F97316" />
              <Text style={styles.goFundBadgeText}>
                KSh {shortfall.toLocaleString()} from Go Fund
              </Text>
            </View>
          )}
          <TouchableOpacity style={styles.resultBtn} onPress={reset}>
            <Text style={styles.resultBtnText}>Send Another</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resultBtnSecondary} onPress={() => router.back()}>
            <Text style={styles.resultBtnSecondaryText}>Back to Wallet</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "failed") {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <View style={styles.resultContent}>
          <View style={[styles.successIcon, { backgroundColor: "#FEF2F2" }]}>
            <XCircle size={64} color="#EF4444" />
          </View>
          <Text style={styles.resultTitle}>Payment Failed</Text>
          <Text style={styles.resultError}>{errorMsg}</Text>
          <TouchableOpacity style={styles.resultBtn} onPress={reset}>
            <Text style={styles.resultBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "processing") {
    return (
      <SafeAreaView style={styles.resultContainer}>
        <View style={styles.resultContent}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.processingText}>Processing payment...</Text>
          <Text style={styles.processingSub}>KSh {numericAmount.toLocaleString()} to {recipientName || recipientPhone}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (step === "confirm") {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep("form")}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirm Payment</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.confirmCard}>
          <Text style={styles.confirmLabel}>Amount</Text>
          <Text style={styles.confirmAmount}>KSh {numericAmount.toLocaleString()}</Text>

          <View style={styles.confirmDivider} />

          <View style={styles.confirmRow}>
            <Text style={styles.confirmRowLabel}>To</Text>
            <Text style={styles.confirmRowValue}>{recipientName || recipientPhone}</Text>
          </View>
          <View style={styles.confirmRow}>
            <Text style={styles.confirmRowLabel}>Phone</Text>
            <Text style={styles.confirmRowValue}>{recipientPhone}</Text>
          </View>
          {note && (
            <View style={styles.confirmRow}>
              <Text style={styles.confirmRowLabel}>Note</Text>
              <Text style={styles.confirmRowValue}>{note}</Text>
            </View>
          )}

          <View style={styles.confirmDivider} />

          <View style={styles.confirmRow}>
            <Text style={styles.confirmRowLabel}>From Wallet</Text>
            <Text style={styles.confirmRowValue}>KSh {Math.min(numericAmount, balance).toLocaleString()}</Text>
          </View>
          {useGoFund && shortfall > 0 && (
            <View style={styles.confirmRow}>
              <Text style={[styles.confirmRowLabel, { color: "#F97316" }]}>From Go Fund</Text>
              <Text style={[styles.confirmRowValue, { color: "#F97316" }]}>
                KSh {shortfall.toLocaleString()}
              </Text>
            </View>
          )}
          <View style={[styles.confirmRow, { marginTop: 8 }]}>
            <Text style={[styles.confirmRowLabel, { fontWeight: "700" }]}>Total</Text>
            <Text style={[styles.confirmRowValue, { fontWeight: "700", fontSize: 16 }]}>
              KSh {numericAmount.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={confirmSend} activeOpacity={0.8}>
          <LinearGradient
            colors={["#10B981", "#059669"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmBtn}
          >
            <Send size={18} color="#FFF" />
            <Text style={styles.confirmBtnText}>Confirm & Send</Text>
          </LinearGradient>
        </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Send Money</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Balance hint */}
          <View style={styles.balanceHint}>
            <WalletIcon />
            <Text style={styles.balanceHintText}>
              Available: KSh {balance.toLocaleString()}
            </Text>
            {goFund.isActive && (
              <Text style={styles.balanceHintSub}>
                + KSh {goFund.creditAvailable.toLocaleString()} Go Fund
              </Text>
            )}
          </View>

          {/* Recipient */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Recipient</Text>
            <View style={styles.inputWrap}>
              <Phone size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Phone number"
                keyboardType="phone-pad"
                value={recipientPhone}
                onChangeText={(text) => {
                  setRecipientPhone(text);
                  const contact = CONTACTS.find((c) => c.phone === text);
                  if (contact) setRecipientName(contact.name);
                }}
              />
              <TouchableOpacity onPress={() => setShowContacts(true)}>
                <Contact size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
            {recipientName && (
              <View style={styles.nameTag}>
                <User size={14} color="#10B981" />
                <Text style={styles.nameTagText}>{recipientName}</Text>
              </View>
            )}
          </View>

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
            {[100, 500, 1000, 2000, 5000].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.quickChip}
                onPress={() => setAmount(amt.toString())}
              >
                <Text style={styles.quickChipText}>KSh {amt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Go Fund suggestion */}
          {numericAmount > balance && canUseGoFund && (
            <TouchableOpacity
              style={[styles.goFundToggle, useGoFund && styles.goFundToggleActive]}
              onPress={() => setUseGoFund(!useGoFund)}
            >
              <View style={styles.goFundToggleRow}>
                <View style={[styles.goFundIcon, { backgroundColor: useGoFund ? "#FFF" : "#FFEDD5" }]}>
                  <Zap size={18} color="#F97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.goFundToggleTitle}>
                    {useGoFund ? "Using Go Fund" : "Use Go Fund?"}
                  </Text>
                  <Text style={styles.goFundToggleSub}>
                    You need KSh {shortfall.toLocaleString()} more. Go Fund available: KSh{" "}
                    {goFund.creditAvailable.toLocaleString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.toggleDot,
                    useGoFund && { backgroundColor: "#FFF", borderColor: "#F97316" },
                  ]}
                >
                  {useGoFund && <View style={styles.toggleDotInner} />}
                </View>
              </View>
              {useGoFund && (
                <Text style={styles.goFundFeeNote}>
                  <AlertCircle size={12} color="#F97316" /> Daily fee KSh {goFund.dailyFee} applies
                </Text>
              )}
            </TouchableOpacity>
          )}

          {numericAmount > balance && !canUseGoFund && (
            <View style={styles.insufficientBanner}>
              <AlertCircle size={18} color="#EF4444" />
              <Text style={styles.insufficientText}>
                Insufficient funds. You need KSh {numericAmount.toLocaleString()} but only have KSh{" "}
                {balance.toLocaleString()} available.
              </Text>
            </View>
          )}

          {/* Note */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Note (optional)</Text>
            <View style={styles.inputWrap}>
              <Hash size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="What's this for?"
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>

          {errorMsg && (
            <View style={styles.errorBanner}>
              <AlertCircle size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Send Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!recipientPhone || numericAmount <= 0 || numericAmount > balance + (useGoFund ? goFund.creditAvailable : 0)) &&
                styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!recipientPhone || numericAmount <= 0 || numericAmount > balance + (useGoFund ? goFund.creditAvailable : 0)}
          >
            <Send size={18} color="#FFF" />
            <Text style={styles.sendBtnText}>
              Send KSh {numericAmount > 0 ? numericAmount.toLocaleString() : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Contacts Modal */}
      <Modal visible={showContacts} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Contact</Text>
            <TouchableOpacity onPress={() => setShowContacts(false)}>
              <Text style={styles.modalClose}>Done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.searchWrap}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <ScrollView>
            {filteredContacts.map((contact) => (
              <TouchableOpacity
                key={contact.id}
                style={styles.contactRow}
                onPress={() => selectContact(contact)}
              >
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>
                    {contact.name.split(" ").map((n) => n[0]).join("")}
                  </Text>
                </View>
                <View style={styles.contactInfo}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function WalletIcon() {
  return (
    <View style={{ marginRight: 8 }}>
      <Send size={16} color="#10B981" />
    </View>
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
    backgroundColor: "#ECFDF5",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  balanceHintText: { fontSize: 14, fontWeight: "600", color: "#059669" },
  balanceHintSub: { fontSize: 12, color: "#10B981", marginLeft: 8 },

  inputGroup: { marginHorizontal: 20, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: { flex: 1, fontSize: 16, color: "#1F2937", paddingVertical: 12, marginLeft: 10 },
  nameTag: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    backgroundColor: "#ECFDF5",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  nameTagText: { fontSize: 13, color: "#059669", fontWeight: "600", marginLeft: 4 },

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

  goFundToggle: {
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 20,
  },
  goFundToggleActive: { borderColor: "#F97316", backgroundColor: "#FFF7ED" },
  goFundToggleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  goFundIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  goFundToggleTitle: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  goFundToggleSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  toggleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleDotInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#F97316" },
  goFundFeeNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    fontSize: 12,
    color: "#F97316",
  },

  insufficientBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
  },
  insufficientText: { flex: 1, fontSize: 13, color: "#EF4444", lineHeight: 18 },

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
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 14,
    paddingVertical: 16,
  },
  sendBtnDisabled: { backgroundColor: "#D1D5DB" },
  sendBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  confirmCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmLabel: { fontSize: 13, color: "#6B7280", textAlign: "center" },
  confirmAmount: { fontSize: 36, fontWeight: "800", color: "#1F2937", textAlign: "center", marginTop: 4 },
  confirmDivider: { height: 1, backgroundColor: "#F3F4F6", marginVertical: 16 },
  confirmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  confirmRowLabel: { fontSize: 14, color: "#6B7280" },
  confirmRowValue: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  confirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 14,
    paddingVertical: 18,
  },
  confirmBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

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
  resultTo: { fontSize: 15, color: "#6B7280", marginBottom: 16 },
  goFundBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFF7ED",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 24,
  },
  goFundBadgeText: { fontSize: 13, fontWeight: "600", color: "#F97316" },
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
  resultError: { fontSize: 14, color: "#EF4444", textAlign: "center", marginBottom: 24 },
  processingText: { fontSize: 18, fontWeight: "700", color: "#1F2937", marginTop: 20 },
  processingSub: { fontSize: 14, color: "#6B7280", marginTop: 8 },

  modalContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  modalClose: { fontSize: 16, fontWeight: "600", color: "#10B981" },
  searchWrap: { paddingHorizontal: 20, paddingVertical: 12 },
  searchInput: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contactAvatarText: { fontSize: 16, fontWeight: "700", color: "#FFF" },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 15, fontWeight: "600", color: "#1F2937" },
  contactPhone: { fontSize: 13, color: "#9CA3AF", marginTop: 2 },
});
