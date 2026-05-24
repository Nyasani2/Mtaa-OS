import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Shield,
  Fingerprint,
  Bell,
  Eye,
  EyeOff,
  Landmark,
  CreditCard,
  ChevronRight,
  Plus,
  X,
  Trash2,
  Lock,
  CheckCircle,
} from "lucide-react-native";
import { useWalletStore } from "@/lib/modules/wallet/store";

export default function WalletSettingsScreen() {
  const router = useRouter();
  const {
    settings,
    linkedBanks,
    linkedCards,
    updateSettings,
    goFund,
  } = useWalletStore();

  const [showAddBank, setShowAddBank] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStep, setPinStep] = useState<"enter" | "confirm" | "success">("enter");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // Bank form
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  // Card form
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");

  const toggleRequirePin = (action: "send" | "withdraw" | "qr_pay" | "go_fund") => {
    const current = settings.requirePinFor;
    const updated = current.includes(action)
      ? current.filter((a) => a !== action)
      : [...current, action];
    updateSettings({ requirePinFor: updated });
  };

  const handleSetPin = () => {
    if (pinStep === "enter") {
      if (pin.length !== 4) return;
      setPinStep("confirm");
    } else if (pinStep === "confirm") {
      if (pin === confirmPin) {
        setPinStep("success");
        setTimeout(() => {
          setShowPinModal(false);
          setPinStep("enter");
          setPin("");
          setConfirmPin("");
        }, 1500);
      } else {
        setConfirmPin("");
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Security */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Eye size={18} color="#3B82F6" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Hide Balance</Text>
                <Text style={styles.settingSub}>Mask balance on home screen</Text>
              </View>
              <Switch
                value={settings.hideBalance}
                onValueChange={(v) => updateSettings({ hideBalance: v })}
                trackColor={{ false: "#E5E7EB", true: "#BFDBFE" }}
                thumbColor={settings.hideBalance ? "#3B82F6" : "#FFF"}
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Fingerprint size={18} color="#10B981" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Biometric Auth</Text>
                <Text style={styles.settingSub}>Use fingerprint or face unlock</Text>
              </View>
              <Switch
                value={settings.biometricEnabled}
                onValueChange={(v) => updateSettings({ biometricEnabled: v })}
                trackColor={{ false: "#E5E7EB", true: "#A7F3D0" }}
                thumbColor={settings.biometricEnabled ? "#10B981" : "#FFF"}
              />
            </View>

            <TouchableOpacity style={styles.settingRow} onPress={() => setShowPinModal(true)}>
              <View style={styles.settingIconWrap}>
                <Lock size={18} color="#F59E0B" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Wallet PIN</Text>
                <Text style={styles.settingSub}>Set or change 4-digit PIN</Text>
              </View>
              <ChevronRight size={18} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Transaction Limits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Transaction Limits</Text>
          <View style={styles.settingCard}>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Daily Limit</Text>
              <View style={styles.limitInputWrap}>
                <Text style={styles.limitPrefix}>KSh</Text>
                <TextInput
                  style={styles.limitInput}
                  keyboardType="number-pad"
                  value={settings.dailyLimit.toString()}
                  onChangeText={(t) => updateSettings({ dailyLimit: parseInt(t) || 0 })}
                />
              </View>
            </View>
            <View style={styles.limitRow}>
              <Text style={styles.limitLabel}>Per Transaction</Text>
              <View style={styles.limitInputWrap}>
                <Text style={styles.limitPrefix}>KSh</Text>
                <TextInput
                  style={styles.limitInput}
                  keyboardType="number-pad"
                  value={settings.transactionLimit.toString()}
                  onChangeText={(t) => updateSettings({ transactionLimit: parseInt(t) || 0 })}
                />
              </View>
            </View>
          </View>
        </View>

        {/* PIN Required For */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PIN Required For</Text>
          <View style={styles.settingCard}>
            {(["send", "withdraw", "qr_pay", "go_fund"] as const).map((action) => (
              <View key={action} style={styles.settingRow}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingLabel}>
                    {action === "send" && "Send Money"}
                    {action === "withdraw" && "Withdrawals"}
                    {action === "qr_pay" && "QR Payments"}
                    {action === "go_fund" && "Go Fund Draws"}
                  </Text>
                </View>
                <Switch
                  value={settings.requirePinFor.includes(action)}
                  onValueChange={() => toggleRequirePin(action)}
                  trackColor={{ false: "#E5E7EB", true: "#BFDBFE" }}
                  thumbColor={settings.requirePinFor.includes(action) ? "#3B82F6" : "#FFF"}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingIconWrap}>
                <Bell size={18} color="#8B5CF6" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Payment Alerts</Text>
                <Text style={styles.settingSub}>Get notified for all transactions</Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
                trackColor={{ false: "#E5E7EB", true: "#DDD6FE" }}
                thumbColor={settings.notificationsEnabled ? "#8B5CF6" : "#FFF"}
              />
            </View>
          </View>
        </View>

        {/* Linked Banks */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Linked Banks</Text>
            <TouchableOpacity onPress={() => setShowAddBank(true)}>
              <Plus size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
          <View style={styles.settingCard}>
            {linkedBanks.length === 0 ? (
              <View style={styles.emptyLinked}>
                <Landmark size={24} color="#D1D5DB" />
                <Text style={styles.emptyLinkedText}>No linked banks</Text>
              </View>
            ) : (
              linkedBanks.map((bank) => (
                <View key={bank.id} style={styles.linkedRow}>
                  <View style={styles.linkedInfo}>
                    <Text style={styles.linkedName}>{bank.bankName}</Text>
                    <Text style={styles.linkedSub}>
                      {bank.accountName} · ****{bank.accountNumber.slice(-4)}
                    </Text>
                  </View>
                  {bank.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Linked Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Linked Cards</Text>
            <TouchableOpacity onPress={() => setShowAddCard(true)}>
              <Plus size={20} color="#10B981" />
            </TouchableOpacity>
          </View>
          <View style={styles.settingCard}>
            {linkedCards.length === 0 ? (
              <View style={styles.emptyLinked}>
                <CreditCard size={24} color="#D1D5DB" />
                <Text style={styles.emptyLinkedText}>No linked cards</Text>
              </View>
            ) : (
              linkedCards.map((card) => (
                <View key={card.id} style={styles.linkedRow}>
                  <View style={styles.linkedInfo}>
                    <Text style={styles.linkedName}>
                      {card.cardType.toUpperCase()} · ****{card.last4}
                    </Text>
                    <Text style={styles.linkedSub}>
                      Expires {card.expiryMonth}/{card.expiryYear}
                    </Text>
                  </View>
                  {card.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Default</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </View>

        {/* Go Fund Settings (linked) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Go Fund</Text>
          <TouchableOpacity
            style={styles.settingCard}
            onPress={() => router.push("/(wallet)/credit")}
          >
            <View style={styles.settingRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: "#FFEDD5" }]}>
                <Shield size={18} color="#F97316" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Manage Go Fund</Text>
                <Text style={styles.settingSub}>
                  Limit: KSh {goFund.creditLimit.toLocaleString()} · Used: KSh {goFund.creditUsed.toLocaleString()}
                </Text>
              </View>
              <ChevronRight size={18} color="#D1D5DB" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* PIN Modal */}
      <Modal visible={showPinModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {pinStep === "enter" ? "Enter New PIN" : pinStep === "confirm" ? "Confirm PIN" : "PIN Set!"}
            </Text>
            <TouchableOpacity onPress={() => { setShowPinModal(false); setPinStep("enter"); setPin(""); setConfirmPin(""); }}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <View style={styles.pinBody}>
            {pinStep === "success" ? (
              <View style={styles.pinSuccess}>
                <CheckCircle size={64} color="#10B981" />
                <Text style={styles.pinSuccessText}>PIN Set Successfully</Text>
              </View>
            ) : (
              <>
                <Text style={styles.pinHint}>
                  {pinStep === "enter" ? "Create a 4-digit PIN" : "Re-enter your PIN to confirm"}
                </Text>
                <View style={styles.pinDots}>
                  {[0, 1, 2, 3].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.pinDot,
                        (pinStep === "enter" ? pin.length > i : confirmPin.length > i) && styles.pinDotFilled,
                      ]}
                    />
                  ))}
                </View>
                <TextInput
                  style={styles.pinInput}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                  value={pinStep === "enter" ? pin : confirmPin}
                  onChangeText={pinStep === "enter" ? setPin : setConfirmPin}
                  autoFocus
                />
                <TouchableOpacity
                  style={[styles.pinBtn, (pinStep === "enter" ? pin.length === 4 : confirmPin.length === 4) && styles.pinBtnActive]}
                  onPress={handleSetPin}
                  disabled={pinStep === "enter" ? pin.length !== 4 : confirmPin.length !== 4}
                >
                  <Text style={styles.pinBtnText}>
                    {pinStep === "enter" ? "Continue" : "Confirm"}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Bank Modal */}
      <Modal visible={showAddBank} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Link Bank Account</Text>
            <TouchableOpacity onPress={() => setShowAddBank(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., KCB, Equity, Co-op"
                value={bankName}
                onChangeText={setBankName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter account number"
                keyboardType="number-pad"
                value={accountNumber}
                onChangeText={setAccountNumber}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Full name as per bank"
                value={accountName}
                onChangeText={setAccountName}
              />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalActionBtn} onPress={() => setShowAddBank(false)}>
              <Landmark size={18} color="#FFF" />
              <Text style={styles.modalActionBtnText}>Link Bank Account</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Add Card Modal */}
      <Modal visible={showAddCard} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Link Card</Text>
            <TouchableOpacity onPress={() => setShowAddCard(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Card Number</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0000 0000 0000 0000"
                keyboardType="number-pad"
                value={cardNumber}
                onChangeText={setCardNumber}
              />
            </View>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Expiry</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChangeText={setCardExpiry}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.inputLabel}>CVV</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="123"
                  keyboardType="number-pad"
                  maxLength={3}
                  secureTextEntry
                  value={cardCvv}
                  onChangeText={setCardCvv}
                />
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cardholder Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Name on card"
                value={cardName}
                onChangeText={setCardName}
              />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.modalActionBtn} onPress={() => setShowAddCard(false)}>
              <CreditCard size={18} color="#FFF" />
              <Text style={styles.modalActionBtnText}>Link Card</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937", paddingHorizontal: 20, marginBottom: 12 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },

  settingCard: {
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  settingSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },

  limitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  limitLabel: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  limitInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  limitPrefix: { fontSize: 13, fontWeight: "700", color: "#10B981", marginRight: 6 },
  limitInput: { fontSize: 14, fontWeight: "600", color: "#1F2937", width: 80, textAlign: "right" },

  linkedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  linkedInfo: { flex: 1 },
  linkedName: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  linkedSub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  defaultBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  defaultBadgeText: { fontSize: 10, fontWeight: "700", color: "#059669" },

  emptyLinked: { alignItems: "center", paddingVertical: 24 },
  emptyLinkedText: { fontSize: 13, color: "#9CA3AF", marginTop: 8 },

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
  modalBody: { paddingHorizontal: 20, paddingTop: 20 },
  modalFooter: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  modalInput: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  inputRow: { flexDirection: "row" },
  modalActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#10B981",
    borderRadius: 14,
    paddingVertical: 16,
  },
  modalActionBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  pinBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  pinHint: { fontSize: 16, color: "#6B7280", marginBottom: 24 },
  pinDots: { flexDirection: "row", gap: 16, marginBottom: 32 },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "transparent",
  },
  pinDotFilled: { backgroundColor: "#10B981", borderColor: "#10B981" },
  pinInput: { position: "absolute", opacity: 0, width: 1, height: 1 },
  pinBtn: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  pinBtnActive: { backgroundColor: "#10B981" },
  pinBtnText: { fontSize: 16, fontWeight: "700", color: "#6B7280" },
  pinSuccess: { alignItems: "center" },
  pinSuccessText: { fontSize: 20, fontWeight: "700", color: "#10B981", marginTop: 16 },
});
