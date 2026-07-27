import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useStay } from "@/domains/stay/hooks/useStay";
import { StayList } from "@/domains/stay/components";
import { Home, Building2, Hotel, TrendingUp, MapPin, Search } from "lucide-react-native";
import { useEffect } from "react";

const CATEGORIES = [
  { id: "all", label: "All", icon: Home },
  { id: "apartment", label: "Apartments", icon: Building2 },
  { id: "hotel_room", label: "Hotels", icon: Hotel },
  { id: "villa", label: "Villas", icon: TrendingUp },
];

export default function StayHomeScreen() {
  const router = useRouter();
  const { listings, fetchListings, savedIds, toggleSaved, loading, error } = useStay();

  useEffect(() => { fetchListings(); }, [fetchListings]);

  const featured = listings?.slice(0, 5) || [];
  const nearby = listings?.slice(5, 10) || [];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stay</Text>
        <Text style={styles.headerSubtitle}>Find your perfect space</Text>
      </View>

      {/* Sticky Search Bar */}
      <TouchableOpacity style={styles.searchBar} onPress={() => router.push("/(os)/stay/search")} activeOpacity={0.9}>
        <Search size={18} color="#9ca3af" />
        <Text style={styles.searchText}>Where are you going?</Text>
      </TouchableOpacity>

      {/* Category Pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryChip} onPress={() => router.push({ pathname: '/(os)/stay/search', params: { type: cat.id } })}>
            <cat.icon size={18} color="#1a5c4b" />
            <Text style={styles.categoryText}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured — Horizontal */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Stays</Text>
          <TouchableOpacity onPress={() => router.push('/(os)/stay/search')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <StayList listings={featured} horizontal savedIds={savedIds} onToggleSave={toggleSaved} onSelect={(id) => router.push(`/(os)/stay/${id}`)} loading={loading} />
      </View>

      {/* Nearby — Horizontal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Near You</Text>
        <StayList listings={nearby} horizontal savedIds={savedIds} onToggleSave={toggleSaved} onSelect={(id) => router.push(`/(os)/stay/${id}`)} />
      </View>

      {/* Become a Host CTA */}
      <TouchableOpacity style={styles.hostCta} onPress={() => router.push('/(os)/stay/(tabs)/host')}>
        <MapPin size={24} color="#1a5c4b" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.hostCtaTitle}>List your space</Text>
          <Text style={styles.hostCtaSub}>Earn extra income by hosting guests</Text>
        </View>
        <Text style={styles.hostCtaArrow}>›</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#1a5c4b" },
  headerTitle: { fontSize: 32, fontWeight: "800", color: "#fff" },
  headerSubtitle: { fontSize: 15, color: "#fff", opacity: 0.85, marginTop: 4 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 16, marginTop: -20, padding: 14, borderRadius: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, gap: 10 },
  searchText: { color: "#9ca3af", fontSize: 15, flex: 1 },
  categories: { paddingHorizontal: 16, marginBottom: 8 },
  categoryChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginRight: 10, borderWidth: 1, borderColor: "#e5e0d5", gap: 6 },
  categoryText: { marginLeft: 6, fontSize: 13, fontWeight: "500", color: "#1a5c4b" },
  section: { paddingVertical: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  seeAll: { fontSize: 14, color: '#1a5c4b', fontWeight: '600' },
  hostCta: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  hostCtaTitle: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  hostCtaSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  hostCtaArrow: { fontSize: 24, color: '#1a5c4b', fontWeight: '300' },
  errorText: { color: "#ef4444", padding: 20, textAlign: 'center' },
});
