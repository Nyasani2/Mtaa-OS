import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useProperty } from "@/domains/property/hooks/useProperty";
import { Heart, Share2, MapPin, Star, Users, Bed, Bath, Wifi, ChevronLeft, Calendar } from "lucide-react-native";

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { getPropertyById, toggleSaved, isSaved } = useProperty();
  const property = getPropertyById?.(id as string);

  if (!property) return <View style={styles.center}><Text>Property not found</Text></View>;
  const saved = isSaved?.(property.id);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <View style={styles.imagePlaceholder}><Text style={styles.imagePlaceholderText}>Property Image</Text></View>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><ChevronLeft size={24} color="#1a1a1a" /></TouchableOpacity>
          <View style={styles.topActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => toggleSaved(property.id)}>
              <Heart size={20} color={saved ? "#ef4444" : "#1a1a1a"} fill={saved ? "#ef4444" : "none"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn}><Share2 size={20} color="#1a1a1a" /></TouchableOpacity>
          </View>
        </View>
        <View style={styles.info}>
          <View style={styles.headerRow}>
            <View style={styles.badge}><Text style={styles.badgeText}>{property.property_type}</Text></View>
            <View style={styles.rating}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{property.rating || "New"}</Text>
              <Text style={styles.reviewCount}>({property.review_count || 0} reviews)</Text>
            </View>
          </View>
          <Text style={styles.title}>{property.title}</Text>
          <View style={styles.locationRow}><MapPin size={16} color="#6b7280" /><Text style={styles.location}>{property.city}, {property.country}</Text></View>
          <View style={styles.amenities}>
            {property.max_guests && <View style={styles.amenity}><Users size={18} color="#1a5c4b" /><Text style={styles.amenityText}>{property.max_guests} guests</Text></View>}
            {property.bedrooms && <View style={styles.amenity}><Bed size={18} color="#1a5c4b" /><Text style={styles.amenityText}>{property.bedrooms} beds</Text></View>}
            {property.bathrooms && <View style={styles.amenity}><Bath size={18} color="#1a5c4b" /><Text style={styles.amenityText}>{property.bathrooms} baths</Text></View>}
            <View style={styles.amenity}><Wifi size={18} color="#1a5c4b" /><Text style={styles.amenityText}>WiFi</Text></View>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this place</Text>
            <Text style={styles.description}>{property.description}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosted by</Text>
            <View style={styles.hostRow}>
              <View style={styles.hostAvatar}><Text style={styles.hostInitial}>{property.host_name?.[0] || "H"}</Text></View>
              <View>
                <Text style={styles.hostName}>{property.host_name || "Host"}</Text>
                <Text style={styles.hostMeta}>Superhost · Joined 2024</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <View><Text style={styles.price}>£{property.price_per_night}</Text><Text style={styles.priceUnit}>per night</Text></View>
        <TouchableOpacity style={styles.bookBtn} onPress={() => router.push({ pathname: "/(os)/property/booking", params: { id: property.id } })}>
          <Calendar size={18} color="#fff" /><Text style={styles.bookBtnText}>Book Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f6f1" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageContainer: { position: "relative", height: 300 },
  imagePlaceholder: { flex: 1, backgroundColor: "#e5e0d5", justifyContent: "center", alignItems: "center" },
  imagePlaceholderText: { color: "#9ca3af", fontSize: 16 },
  backBtn: { position: "absolute", top: 60, left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  topActions: { position: "absolute", top: 60, right: 16, flexDirection: "row", gap: 8 },
  actionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  info: { padding: 20 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  badge: { backgroundColor: "#1a5c4b", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  rating: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 14, fontWeight: "600", color: "#1a1a1a" },
  reviewCount: { fontSize: 13, color: "#6b7280" },
  title: { fontSize: 24, fontWeight: "700", color: "#1a1a1a", marginBottom: 8 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  location: { fontSize: 15, color: "#6b7280" },
  amenities: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  amenity: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  amenityText: { fontSize: 13, color: "#1a1a1a" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#1a1a1a", marginBottom: 10 },
  description: { fontSize: 15, color: "#4b5563", lineHeight: 22 },
  hostRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  hostAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#1a5c4b", alignItems: "center", justifyContent: "center" },
  hostInitial: { color: "#fff", fontSize: 18, fontWeight: "600" },
  hostName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  hostMeta: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  bottomBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 32, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e5e0d5" },
  price: { fontSize: 20, fontWeight: "700", color: "#1a1a1a" },
  priceUnit: { fontSize: 13, color: "#6b7280" },
  bookBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1a5c4b", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  bookBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
