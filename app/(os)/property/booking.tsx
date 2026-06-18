import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useProperty } from "@/domains/property/hooks/useProperty";
import { useWalletAccount } from "@/lib/wallet/hooks";
import { CalendarDays, ChevronLeft, Home, Users, Clock } from "lucide-react-native";
import { useState } from "react";

export default function PropertyBookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getPropertyById, book } = useProperty();
  const { account } = useWalletAccount();
  const property = getPropertyById?.(id as string);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("1");
  const [notes, setNotes] = useState("");
  const [booking, setBooking] = useState(false);

  if (!property) return null;

  const nights = checkIn && checkOut
    ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const total = nights * (property.price || 0);
  const canAfford = account && total > 0 && account.available_balance >= total;

  async function handleBook() {
    if (!checkIn || !checkOut) {
      Alert.alert("Missing Dates", "Please select check-in and check-out dates.");
      return;
    }
    if (!canAfford) {
      Alert.alert("Insufficient Balance", `You need KES ${total.toLocaleString()} but your available balance is KES ${(account?.available_balance || 0).toLocaleString()}.`);
      return;
    }
    setBooking(true);
    try {
      await book({
        property_id: property.id,
        check_in: checkIn,
        check_out: checkOut,
        guests: parseInt(guests) || 1,
        notes,
        total_amount: total,
        currency: account?.currency || "KES",
      });
      Alert.alert("Booking Confirmed", `Your booking at ${property.title} is confirmed.`);
      router.replace("/(os)/property/(tabs)/bookings");
    } catch (err: any) {
      Alert.alert("Booking Failed", err.message || "Could not complete booking.");
    } finally {
      setBooking(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Book Property</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.propertyName}>{property.title}</Text>
          <Text style={styles.propertyPrice}>KES {(property.price || 0).toLocaleString()} / night</Text>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <CalendarDays size={18} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Check-in (YYYY-MM-DD)"
              placeholderTextColor="#9ca3af"
              value={checkIn}
              onChangeText={setCheckIn}
            />
          </View>
          <View style={styles.inputRow}>
            <CalendarDays size={18} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Check-out (YYYY-MM-DD)"
              placeholderTextColor="#9ca3af"
              value={checkOut}
              onChangeText={setCheckOut}
            />
          </View>
          <View style={styles.inputRow}>
            <Users size={18} color="#6b7280" />
            <TextInput
              style={styles.input}
              placeholder="Number of guests"
              placeholderTextColor="#9ca3af"
              keyboardType="number-pad"
              value={guests}
              onChangeText={setGuests}
            />
          </View>
          <View style={styles.inputRow}>
            <Clock size={18} color="#6b7280" />
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Special requests (optional)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>
        </View>

        {nights > 0 && (
          <View style={styles.summary}>
            <Text style={styles.summaryTitle}>Booking Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{nights} night(s) x KES {(property.price || 0).toLocaleString()}</Text>
              <Text style={styles.summaryValue}>KES {total.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Service fee</Text>
              <Text style={styles.summaryValue}>KES 0</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>KES {total.toLocaleString()}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Your balance:</Text>
              <Text style={[styles.balanceValue, !canAfford && styles.balanceLow]}>
                KES {(account?.available_balance || 0).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.bookBtn, (booking || !canAfford) && styles.bookBtnDisabled]}
          onPress={handleBook}
          disabled={booking || !canAfford}
        >
          <Text style={styles.bookBtnText}>
            {booking ? "Booking..." : canAfford ? `Pay KES ${total.toLocaleString()}` : "Insufficient Balance"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e0d5",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a" },
  content: { flex: 1, padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  propertyName: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  propertyPrice: { fontSize: 14, color: "#1a5c4b", marginTop: 4, fontWeight: "600" },
  inputGroup: { gap: 12, marginBottom: 16 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e5e0d5",
    gap: 10,
  },
  input: { flex: 1, fontSize: 15, color: "#1a1a1a", paddingVertical: 4 },
  summary: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 12 },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 14, color: "#6b7280" },
  summaryValue: { fontSize: 14, color: "#1a1a1a", fontWeight: "500" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#e5e0d5", paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#1a1a1a" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#1a5c4b" },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e0d5",
  },
  balanceLabel: { fontSize: 14, color: "#6b7280" },
  balanceValue: { fontSize: 14, color: "#1a5c4b", fontWeight: "600" },
  balanceLow: { color: "#EF4444" },
  bottomBar: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e0d5",
  },
  bookBtn: {
    backgroundColor: "#1a5c4b",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  bookBtnDisabled: { backgroundColor: "#9ca3af" },
  bookBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
