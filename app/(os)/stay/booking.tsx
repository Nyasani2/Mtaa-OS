// @ts-nocheck
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useStay } from "@/domains/stay/hooks/useStay";
import { useWalletAccount } from "@/domains/wallet/hooks";
import { CalendarDays, ChevronLeft, Home, Users, Clock, Minus, Plus } from "lucide-react-native";
import { useState } from "react";

export default function StayBookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { fetchListing, currentListing: listing, createBooking } = useStay();
  const { account } = useWalletAccount();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  const price = listing?.price_per_night || 0;
  const currency = listing?.currency || "KES";
  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const subtotal = nights * price;
  const cleaningFee = listing?.cleaning_fee || 0;
  const serviceFee = Math.round(subtotal * 0.12);
  const total = subtotal + cleaningFee + serviceFee;
  const canAfford = account && total > 0 && account.available_balance >= total;

  async function handleBook() {
    if (!checkIn || !checkOut) {
      Alert.alert("Missing Dates", "Please select check-in and check-out dates.");
      return;
    }
    if (!canAfford) {
      Alert.alert("Insufficient Balance", `You need ${currency} ${total.toLocaleString()} but your available balance is ${currency} ${(account?.available_balance || 0).toLocaleString()}.`);
      return;
    }
    setBooking(true);
    try {
      await createBooking({
        property_id: listing!.id,
        host_id: listing!.owner_id,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guest_count: guests,
        special_requests: notes,
        total_amount: total,
        nightly_rate: price,
        nights_count: nights,
        subtotal,
        cleaning_fee: cleaningFee,
        service_fee: serviceFee,
        currency,
      });
      Alert.alert("Booking Confirmed", `Your stay at ${listing?.title} is confirmed.`);
      router.replace("/(os)/stay/(tabs)/bookings");
    } catch (err: any) {
      Alert.alert("Booking Failed", err.message || "Could not complete booking.");
    } finally {
      setBooking(false);
    }
  }

  if (!listing) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={24} color="#1a1a1a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Book Stay</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.propertyName}>{listing.title}</Text>
          <Text style={styles.propertyPrice}>{currency} {price.toLocaleString()} / night</Text>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <CalendarDays size={18} color="#6b7280" />
            <TextInput style={styles.input} placeholder="Check-in (YYYY-MM-DD)" placeholderTextColor="#9ca3af" value={checkIn} onChangeText={setCheckIn} />
          </View>
          <View style={styles.inputRow}>
            <CalendarDays size={18} color="#6b7280" />
            <TextInput style={styles.input} placeholder="Check-out (YYYY-MM-DD)" placeholderTextColor="#9ca3af" value={checkOut} onChangeText={setCheckOut} />
          </View>

          <Text style={styles.guestLabel}>Guests</Text>
          <View style={styles.guestRow}>
            <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(Math.max(1, guests - 1))}><Minus size={16} color="#1a1a1a" /></TouchableOpacity>
            <View style={styles.guestCount}><Users size={16} color="#1a5c4b" /><Text style={styles.guestText}>{guests}</Text></View>
            <TouchableOpacity style={styles.guestBtn} onPress={() => setGuests(guests + 1)}><Plus size={16} color="#1a1a1a" /></TouchableOpacity>
          </View>

          <View style={styles.inputRow}>
            <Clock size={18} color="#6b7280" />
            <TextInput style={[styles.input, { height: 80 }]} placeholder="Special requests (optional)" placeholderTextColor="#9ca3af" multiline numberOfLines={3} value={notes} onChangeText={setNotes} />
          </View>
        </View>

        {nights > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Price Details</Text>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>{currency} {price.toLocaleString()} x {nights} nights</Text><Text style={styles.summaryValue}>{currency} {subtotal.toLocaleString()}</Text></View>
            {cleaningFee > 0 && <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Cleaning fee</Text><Text style={styles.summaryValue}>{currency} {cleaningFee.toLocaleString()}</Text></View>}
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service fee</Text><Text style={styles.summaryValue}>{currency} {serviceFee.toLocaleString()}</Text></View>
            <View style={[styles.summaryRow, styles.totalRow]}><Text style={styles.totalLabel}>Total</Text><Text style={styles.totalValue}>{currency} {total.toLocaleString()}</Text></View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Your balance:</Text>
              <Text style={[styles.balanceValue, !canAfford && styles.balanceLow]}>{currency} {(account?.available_balance || 0).toLocaleString()}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bookBtn, (booking || !canAfford) && styles.bookBtnDisabled]} onPress={handleBook} disabled={booking || !canAfford}>
          <Text style={styles.bookBtnText}>{booking ? "Booking..." : canAfford ? `Pay ${currency} ${total.toLocaleString()}` : "Insufficient Balance"}</Text>
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
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16 },
  propertyName: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  propertyPrice: { fontSize: 14, color: "#1a5c4b", marginTop: 4, fontWeight: "600" },
  inputGroup: { gap: 12, marginBottom: 16 },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#e5e0d5", gap: 10 },
  input: { flex: 1, fontSize: 15, color: "#1a1a1a", paddingVertical: 4 },
  guestLabel: { fontSize: 15, fontWeight: '600', color: '#1a1a1a', marginTop: 4 },
  guestRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  guestBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e0d5' },
  guestCount: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#e5e0d5', minWidth: 100, justifyContent: 'center' },
  guestText: { fontSize: 16, fontWeight: '600', color: '#1a1a1a' },
  summary: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16 },
  summaryTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 12 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: "#6b7280" },
  summaryValue: { fontSize: 14, color: "#1a1a1a", fontWeight: "500" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#e5e0d5", paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#1a5c4b" },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e5e0d5" },
  balanceLabel: { fontSize: 14, color: "#6b7280" },
  balanceValue: { fontSize: 14, color: "#1a5c4b", fontWeight: "600" },
  balanceLow: { color: "#EF4444" },
  bottomBar: { padding: 16, paddingBottom: 32, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e0d5" },
  bookBtn: { backgroundColor: "#1a5c4b", paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  bookBtnDisabled: { backgroundColor: "#9ca3af" },
  bookBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
