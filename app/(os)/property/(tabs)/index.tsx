import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useProperty } from "@/domains/property/hooks/useProperty";
import { PropertyCard } from "@/domains/property/components";
import { Home, Building2, Hotel, TrendingUp, MapPin } from "lucide-react-native";

const CATEGORIES = [
  { id: "all", label: "All", icon: Home },
  { id: "rental", label: "Rentals", icon: Building2 },
  { id: "hotel", label: "Hotels", icon: Hotel },
  { id: "investment", label: "Invest", icon: TrendingUp },
];

export default function PropertyHomeScreen() {
  const router = useRouter();
  const { featured, nearby, loading, error } = useProperty();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Property OS</Text>
        <Text style={styles.headerSubtitle}>Find your next space</Text>
      </View>

      <TouchableOpacity style={styles.searchBar} onPress={() => router.push("/(os)/property/search")}>
        <MapPin size={18} color="#9ca3af" />
        <Text style={styles.searchText}>Where are you going?</Text>
      </TouchableOpacity>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity key={cat.id} style={styles.categoryChip}>
            <cat.icon size={18} color="#1a5c4b" />
            <Text style={styles.categoryText}>{cat.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured Properties</Text>
        {loading ? <Text style={styles.loadingText}>Loading...</Text> :
         error ? <Text style={styles.errorText}>{error}</Text> :
         featured?.map((p) => <PropertyCard key={p.id} property={p} variant="full" />)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Near You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {nearby?.map((p) => (
            <View key={p.id} style={styles.nearbyCard}>
              <PropertyCard property={p} variant="compact" />
            </View>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#1a5c4b" },
  headerTitle: { fontSize: 28, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 14, color: "#fff", opacity: 0.8, marginTop: 4 },
  searchBar: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", margin: 16, marginTop: -20, padding: 14, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  searchText: { marginLeft: 10, color: "#9ca3af", fontSize: 15 },
  categories: { paddingHorizontal: 16, marginBottom: 8 },
  categoryChip: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, marginRight: 10, borderWidth: 1, borderColor: "#e5e0d5" },
  categoryText: { marginLeft: 6, fontSize: 13, fontWeight: "500", color: "#1a5c4b" },
  section: { padding: 16, paddingBottom: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  loadingText: { color: "#9ca3af", padding: 20 },
  errorText: { color: "#ef4444", padding: 20 },
  nearbyCard: { width: 260, marginRight: 12 },
});
