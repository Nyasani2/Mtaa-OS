// @ts-nocheck
import { Alert, View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Alert, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, useStay } from "@/domains/stay/hooks/useStay";
import { Alert, useWallet, useWalletAccount } from "app/(os)/wallet/hooks";
import { Alert, CreditCard, ChevronLeft, ShieldCheck, Wallet } from "lucide-react-native";
import { useState } from 'react';

export default function StayPaymentScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchListing, currentListing: listing } = useStay();
  const wallet = useWallet();
  const { account } = useWalletAccount();
  const [paying, setPaying] = useState(false);
  const [method, setMethod] = useState<"wallet" | "mpesa" | "card">("wallet");

  const amount = listing?.price_per_night || 0;
  const currency = listing?.currency || "KES";
  const canPay = account && account.available_balance >= amount;

  async function handlePay() {
    if (!canPay) { Alert.alert("Insufficient Balance", `You need ${currency} ${amount.toLocaleString()} but have ${currency} ${(account?.available_balance || 0).toLocaleString()}.`); return; }
    setPaying(true);
    try {
      const result = await wallet.transfer(amount, listing?.owner_id || "", `Stay payment: ${listing?.title}`);
      if (result.success) { Alert.alert("Payment Successful", `${currency} ${amount.toLocaleString()} paid for ${listing?.title}.`); router.replace("/(os)/stay/(tabs)/bookings"); }
      else { Alert.alert("Payment Failed", result.error || "Transaction could not be completed."); }
    } catch (err: any) { Alert.alert("Payment Error", err.message || "Something went wrong."); }
    finally { setPaying(false); }
  }

  if (!listing) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={24} color="#1a1a1a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.propertyName}>{listing.title}</Text>
          <Text style={styles.propertyAddress}>{listing.full_address}</Text>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount due</Text>
            <Text style={styles.amountValue}>{currency} {amount.toLocaleString()}</Text>
          </View>
        </View>
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        <TouchableOpacity style={[styles.methodCard, method === "wallet" && styles.methodCardActive]} onPress={() => setMethod("wallet")}>
          <View style={styles.methodIcon}><Wallet size={22} color={method === "wallet" ? "#1a5c4b" : "#6b7280"} /></View>
          <View style={styles.methodInfo}><Text style={styles.methodName}>MTAA Wallet</Text><Text style={styles.methodDesc}>Balance: {currency} {(account?.available_balance || 0).toLocaleString()}</Text></View>
          <View style={[styles.radio, method === "wallet" && styles.radioActive]}>{method === "wallet" && <View style={styles.radioDot} />}</View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.methodCard, method === "mpesa" && styles.methodCardActive]} onPress={() => setMethod("mpesa")}>
          <View style={styles.methodIcon}><CreditCard size={22} color={method === "mpesa" ? "#1a5c4b" : "#6b7280"} /></View>
          <View style={styles.methodInfo}><Text style={styles.methodName}>M-Pesa</Text><Text style={styles.methodDesc}>Pay via mobile money</Text></View>
          <View style={[styles.radio, method === "mpesa" && styles.radioActive]}>{method === "mpesa" && <View style={styles.radioDot} />}</View>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.methodCard, method === "card" && styles.methodCardActive]} onPress={() => setMethod("card")}>
          <View style={styles.methodIcon}><CreditCard size={22} color={method === "card" ? "#1a5c4b" : "#6b7280"} /></View>
          <View style={styles.methodInfo}><Text style={styles.methodName}>Bank Card</Text><Text style={styles.methodDesc}>Visa / Mastercard</Text></View>
          <View style={[styles.radio, method === "card" && styles.radioActive]}>{method === "card" && <View style={styles.radioDot} />}</View>
        </TouchableOpacity>
        <View style={styles.securityNote}>
          <ShieldCheck size={16} color="#1a5c4b" />
          <Text style={styles.securityText}>All payments are secured and encrypted. Your financial data is never stored on this device.</Text>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.payBtn, (paying || !canPay) && styles.payBtnDisabled]} onPress={handlePay} disabled={paying || !canPay}>
          <Text style={styles.payBtnText}>{paying ? "Processing..." : canPay ? `Pay ${currency} ${amount.toLocaleString()}` : "Insufficient Balance"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 60, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#e5e0d5" },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
  content: { flex: 1, padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 20 },
  propertyName: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  propertyAddress: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  amountRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#e5e0d5" },
  amountLabel: { fontSize: 14, color: "#6b7280" },
  amountValue: { fontSize: 20, fontWeight: "700", color: "#1a5c4b" },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 12 },
  methodCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: "#e5e0d5" },
  methodCardActive: { borderColor: "#1a5c4b" },
  methodIcon: { marginRight: 14 },
  methodInfo: { flex: 1 },
  methodName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  methodDesc: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  radioActive: { borderColor: "#1a5c4b" },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#1a5c4b" },
  securityNote: { flexDirection: "row", alignItems: "flex-start", marginTop: 20, padding: 14, backgroundColor: "#ecfdf5", borderRadius: 12, gap: 10 },
  securityText: { flex: 1, fontSize: 13, color: "#1a5c4b", lineHeight: 18 },
  bottomBar: { padding: 16, paddingBottom: 32, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e0d5" },
  payBtn: { backgroundColor: "#1a5c4b", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  payBtnDisabled: { backgroundColor: "#9ca3af" },
  payBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
