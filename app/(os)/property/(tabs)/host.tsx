import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useProperty } from "@/domains/property/hooks/useProperty";
import { Plus, Building2, Users, Star, PoundSterling } from "lucide-react-native";

export default function PropertyHostScreen() {
  const router = useRouter();
  const { myProperties, hostStats, loading } = useProperty();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Host Dashboard</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/(os)/property/list-property")}>
          <Plus size={20} color="#fff" /><Text style={styles.addBtnText}>List Property</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Building2 size={24} color="#1a5c4b" /><Text style={styles.statValue}>{hostStats?.propertyCount || 0}</Text><Text style={styles.statLabel}>Properties</Text></View>
        <View style={styles.statCard}><Users size={24} color="#1a5c4b" /><Text style={styles.statValue}>{hostStats?.totalGuests || 0}</Text><Text style={styles.statLabel}>Guests</Text></View>
        <View style={styles.statCard}><Star size={24} color="#1a5c4b" /><Text style={styles.statValue}>{hostStats?.avgRating || "—"}</Text><Text style={styles.statLabel}>Rating</Text></View>
        <View style={styles.statCard}><PoundSterling size={24} color="#1a5c4b" /><Text style={styles.statValue}>£{hostStats?.totalRevenue || 0}</Text><Text style={styles.statLabel}>Revenue</Text></View>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Properties</Text>
        {myProperties?.length === 0 ? (
          <View style={styles.empty}><Building2 size={40} color="#d1d5db" /><Text style={styles.emptyText}>No properties listed yet</Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/(os)/property/list-property")}><Text style={styles.ctaBtnText}>List Your First Property</Text></TouchableOpacity>
          </View>
        ) : (
          myProperties?.map((p) => (
            <TouchableOpacity key={p.id} style={styles.propertyRow}>
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitle}>{p.title}</Text>
                <Text style={styles.propertyMeta}>{p.city} · {p.property_type}</Text>
                <View style={styles.propertyStatus}>
                  <View style={[styles.statusDot, { backgroundColor: p.is_available ? "#22c55e" : "#ef4444" }]} />
                  <Text style={styles.statusText}>{p.is_available ? "Available" : "Unavailable"}</Text>
                </View>
              </View>
              <Text style={styles.propertyPrice}>£{p.price_per_night}/night</Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#1a5c4b", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#fff", flex: 1 },
  addBtn: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, gap: 6 },
  addBtnText: { color: "#1a5c4b", fontWeight: "600", fontSize: 13 },
  statsRow: { flexDirection: "row", padding: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 14, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginTop: 8 },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a", marginBottom: 12 },
  empty: { alignItems: "center", padding: 40 },
  emptyText: { color: "#9ca3af", marginTop: 12, fontSize: 15 },
  ctaBtn: { backgroundColor: "#1a5c4b", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  ctaBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  propertyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 10 },
  propertyInfo: { flex: 1 },
  propertyTitle: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  propertyMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  propertyStatus: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: "#6b7280" },
  propertyPrice: { fontSize: 15, fontWeight: "700", color: "#1a5c4b" },
});
