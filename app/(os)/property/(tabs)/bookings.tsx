import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useProperty } from "@/domains/property/hooks/useProperty";
import { Calendar, Clock, MapPin, ChevronRight } from "lucide-react-native";

export default function PropertyBookingsScreen() {
  const { myBookings, loading } = useProperty();
  const upcoming = myBookings?.filter((b) => b.status === "confirmed") || [];
  const past = myBookings?.filter((b) => b.status === "completed") || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Text style={styles.headerTitle}>My Bookings</Text></View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming</Text>
        {upcoming.length === 0 ? (
          <View style={styles.empty}><Calendar size={40} color="#d1d5db" /><Text style={styles.emptyText}>No upcoming bookings</Text></View>
        ) : (
          upcoming.map((booking) => (
            <TouchableOpacity key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <Text style={styles.bookingType}>{booking.property_type}</Text>
                <View style={[styles.statusBadge, { backgroundColor: "#dcfce7" }]}>
                  <Text style={[styles.statusText, { color: "#166534" }]}>Confirmed</Text>
                </View>
              </View>
              <Text style={styles.propertyName}>{booking.property?.title}</Text>
              <View style={styles.bookingMeta}>
                <View style={styles.metaRow}><Clock size={14} color="#6b7280" /><Text style={styles.metaText}>{new Date(booking.check_in).toLocaleDateString()} — {new Date(booking.check_out).toLocaleDateString()}</Text></View>
                <View style={styles.metaRow}><MapPin size={14} color="#6b7280" /><Text style={styles.metaText}>{booking.property?.city}</Text></View>
              </View>
              <View style={styles.bookingFooter}><Text style={styles.price}>£{booking.total_price}</Text><ChevronRight size={18} color="#9ca3af" /></View>
            </TouchableOpacity>
          ))
        )}
      </View>
      {past.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Stays</Text>
          {past.map((booking) => (
            <View key={booking.id} style={[styles.bookingCard, { opacity: 0.7 }]}>
              <Text style={styles.propertyName}>{booking.property?.title}</Text>
              <Text style={styles.metaText}>{new Date(booking.check_in).toLocaleDateString()} — {new Date(booking.check_out).toLocaleDateString()}</Text>
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
  bookingCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  bookingHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  bookingType: { fontSize: 12, color: "#6b7280", textTransform: "uppercase" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "600" },
  propertyName: { fontSize: 16, fontWeight: "600", color: "#1a1a1a", marginBottom: 8 },
  bookingMeta: { gap: 6 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13, color: "#6b7280" },
  bookingFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  price: { fontSize: 16, fontWeight: "700", color: "#1a5c4b" },
});
