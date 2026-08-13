// @ts-nocheck
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useStay } from "@/domains/stay/hooks/useStay";
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react-native";
import { useEffect } from "react";

export default function StayBookingsScreen() {
  const { myBookings, loading, fetchMyBookings } = useStay();
  const router = useRouter();

  useEffect(() => { fetchMyBookings(); }, [fetchMyBookings]);

  const upcoming = myBookings?.filter((b) => ["pending", "confirmed", "checked_in"].includes(b.booking_status)) || [];
  const past = myBookings?.filter((b) => ["checked_out", "cancelled_by_guest", "cancelled_by_host", "no_show"].includes(b.booking_status)) || [];

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return { bg: "#dcfce7", text: "#166534" };
      case "checked_in": return { bg: "#dbeafe", text: "#1e40af" };
      case "pending": return { bg: "#fef3c7", text: "#92400e" };
      default: return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Text style={styles.headerTitle}>My Trips</Text></View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        {upcoming.length === 0 ? (
          <View style={styles.empty}>
            <Calendar size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No upcoming trips</Text>
            <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(os)/stay/search' as any)}>
              <Text style={styles.exploreBtnText}>Explore Stays</Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcoming.map((booking) => {
            const sc = statusColor(booking.booking_status);
            return (
              <TouchableOpacity key={booking.id} style={styles.bookingCard} onPress={() => router.push({ pathname: '/(os)/stay/booking', params: { id: booking.property_id } })}>
                <View style={styles.bookingHeader}>
                  <Text style={styles.bookingType}>{booking.property?.title || 'Stay'}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{booking.booking_status.replace('_', ' ')}</Text>
                  </View>
                </View>
                <View style={styles.bookingMeta}>
                  <View style={styles.metaRow}><Clock size={14} color="#6b7280" /><Text style={styles.metaText}>{new Date(booking.check_in_date).toLocaleDateString()} — {new Date(booking.check_out_date).toLocaleDateString()}</Text></View>
                  <View style={styles.metaRow}><MapPin size={14} color="#6b7280" /><Text style={styles.metaText}>{booking.property?.town || ''}</Text></View>
                </View>
                <View style={styles.bookingFooter}>
                  <Text style={styles.price}>{booking.currency} {booking.total_amount?.toLocaleString()}</Text>
                  <ChevronRight size={18} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {past.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Stays</Text>
          {past.map((booking) => (
            <View key={booking.id} style={[styles.bookingCard, { opacity: 0.7 }]}>
              <Text style={styles.propertyName}>{booking.property?.title}</Text>
              <Text style={styles.metaText}>{new Date(booking.check_in_date).toLocaleDateString()} — {new Date(booking.check_out_date).toLocaleDateString()}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#1a5c4b" },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff" },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a", marginBottom: 12 },
  empty: { alignItems: "center", padding: 40 },
  emptyText: { color: "#9ca3af", marginTop: 12, fontSize: 15 },
  exploreBtn: { backgroundColor: '#1a5c4b', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  exploreBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  bookingCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  bookingType: { fontSize: 14, fontWeight: '600', color: '#1a1a1a', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600", textTransform: 'capitalize' },
  propertyName: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 8 },
  bookingMeta: { gap: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#6b7280" },
  bookingFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  price: { fontSize: 16, fontWeight: "700", color: "#1a5c4b" },
});
