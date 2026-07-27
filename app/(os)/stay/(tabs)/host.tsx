import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useStay } from "@/domains/stay/hooks/useStay";
import { Plus, Building2, Users, Star, Wallet, ShieldCheck } from "lucide-react-native";
import { useEffect } from "react";

export default function StayHostScreen() {
  const router = useRouter();
  const { myListings, fetchMyListings, loading } = useStay();

  useEffect(() => { fetchMyListings(); }, [fetchMyListings]);

  const stats = {
    propertyCount: myListings?.length || 0,
    totalGuests: 0,
    avgRating: myListings?.length ? (myListings.reduce((s, p) => s + (p.average_rating || 0), 0) / myListings.length).toFixed(1) : "—",
    totalRevenue: 0,
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Host Dashboard</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/(os)/stay/list-property")}>
          <Plus size={20} color="#1a5c4b" /><Text style={styles.addBtnText}>List Stay</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Building2 size={24} color="#1a5c4b" /><Text style={styles.statValue}>{stats.propertyCount}</Text><Text style={styles.statLabel}>Listings</Text></View>
        <View style={styles.statCard}><Users size={24} color="#1a5c4b" /><Text style={styles.statValue}>{stats.totalGuests}</Text><Text style={styles.statLabel}>Guests</Text></View>
        <View style={styles.statCard}><Star size={24} color="#1a5c4b" /><Text style={styles.statValue}>{stats.avgRating}</Text><Text style={styles.statLabel}>Rating</Text></View>
        <View style={styles.statCard}><Wallet size={24} color="#1a5c4b" /><Text style={styles.statValue}>KES {stats.totalRevenue}</Text><Text style={styles.statLabel}>Revenue</Text></View>
      </View>

      {/* Verification Banner */}
      <View style={styles.verifyBanner}>
        <ShieldCheck size={24} color="#1a5c4b" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.verifyTitle}>Complete your host profile</Text>
          <Text style={styles.verifySub}>Verify your identity to build trust with guests</Text>
        </View>
        <TouchableOpacity style={styles.verifyBtn} onPress={() => router.push('/(os)/profile')}>
          <Text style={styles.verifyBtnText}>Verify</Text>
        </TouchableOpacity>
      </View>

      {/* My Listings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Listings</Text>
        {myListings?.length === 0 ? (
          <View style={styles.empty}>
            <Building2 size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No listings yet</Text>
            <TouchableOpacity style={styles.ctaBtn} onPress={() => router.push("/(os)/stay/list-property")}>
              <Text style={styles.ctaBtnText}>List Your First Stay</Text>
            </TouchableOpacity>
          </View>
        ) : (
          myListings?.map((p) => (
            <TouchableOpacity key={p.id} style={styles.listingRow} onPress={() => router.push(`/(os)/stay/${p.id}`)}>
              <View style={styles.listingInfo}>
                <Text style={styles.listingTitle}>{p.title}</Text>
                <Text style={styles.listingMeta}>{p.town} · {p.property_type}</Text>
                <View style={styles.listingStatus}>
                  <View style={[styles.statusDot, { backgroundColor: p.status === 'active' ? "#22c55e" : "#ef4444" }]} />
                  <Text style={styles.statusText}>{p.status === 'active' ? "Active" : "Inactive"}</Text>
                </View>
              </View>
              <Text style={styles.listingPrice}>KES {p.price_per_night?.toLocaleString()}/night</Text>
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
  verifyBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: '#1a5c4b' },
  verifyTitle: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  verifySub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  verifyBtn: { backgroundColor: '#1a5c4b', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  verifyBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a", marginBottom: 12 },
  empty: { alignItems: "center", padding: 40 },
  emptyText: { color: "#9ca3af", marginTop: 12, fontSize: 15 },
  ctaBtn: { backgroundColor: "#1a5c4b", paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  ctaBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  listingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 10 },
  listingInfo: { flex: 1 },
  listingTitle: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  listingMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  listingStatus: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: "#6b7280" },
  listingPrice: { fontSize: 15, fontWeight: "700", color: "#1a5c4b" },
});
