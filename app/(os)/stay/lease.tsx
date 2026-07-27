import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStay } from "@/domains/stay/hooks/useStay";
import { FileText, ChevronLeft, Check } from "lucide-react-native";
import { useState } from "react";

const TERMS_TEXT = "1. The Landlord agrees to lease the property to the Tenant for the agreed term.\n\n2. Rent is due on the 1st of each month. Late payments incur a 5% fee.\n\n3. The Tenant agrees to maintain the property in good condition.\n\n4. No subletting without written consent.\n\n5. Security deposit of one month's rent is required.\n\n6. Either party may terminate with 30 days written notice.\n\n7. This agreement is governed by local property law.";

export default function StayLeaseScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchListing, currentListing: listing } = useStay();
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);

  if (!listing) return null;

  async function handleSign() {
    if (!agreed) return;
    setSigning(true);
    try {
      router.replace("/(os)/stay/(tabs)/bookings");
    } catch (err) {
      console.error(err);
    } finally {
      setSigning(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={24} color="#1a1a1a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Lease Agreement</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.leaseCard}>
          <FileText size={32} color="#1a5c4b" />
          <Text style={styles.leaseTitle}>Residential Lease Agreement</Text>
          <Text style={styles.leaseSubtitle}>{listing.title}</Text>
          <View style={styles.terms}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{TERMS_TEXT}</Text>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed(!agreed)}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>{agreed && <Check size={14} color="#fff" />}</View>
          <Text style={styles.agreeText}>I agree to the terms and conditions</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.signBtn, (!agreed || signing) && styles.signBtnDisabled]} onPress={handleSign} disabled={!agreed || signing}>
          <Text style={styles.signBtnText}>{signing ? "Signing..." : "Sign Agreement"}</Text>
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
  leaseCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center" },
  leaseTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginTop: 12 },
  leaseSubtitle: { fontSize: 14, color: "#6b7280", marginTop: 4 },
  terms: { marginTop: 20, width: "100%" },
  termsTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 12 },
  termsText: { fontSize: 14, color: "#4b5563", lineHeight: 22 },
  bottomBar: { padding: 16, paddingBottom: 32, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e0d5" },
  agreeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#d1d5db", alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: "#1a5c4b", borderColor: "#1a5c4b" },
  agreeText: { fontSize: 14, color: "#1a1a1a" },
  signBtn: { backgroundColor: "#1a5c4b", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  signBtnDisabled: { backgroundColor: "#9ca3af" },
  signBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
