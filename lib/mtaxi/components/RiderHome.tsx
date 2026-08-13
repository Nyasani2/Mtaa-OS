// lib/mtaxi/components/RiderHome.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Clock, CreditCard, Car, Star, ChevronRight } from "lucide-react-native";

const RECENT_PLACES = [
  { id: "1", name: "Home", address: "123 Main Street", lat: -1.2921, lng: 36.8219 },
  { id: "2", name: "Work", address: "456 Business Ave", lat: -1.3, lng: 36.83 },
  { id: "3", name: "Airport", address: "Jomo Kenyatta International", lat: -1.32, lng: 36.925 },
];

export default function RiderHome() {
  const router = useRouter();
  const [pickup, setPickup] = useState("");

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning,</Text>
        <Text style={styles.subGreeting}>Where are you going today?</Text>
      </View>

      <TouchableOpacity style={styles.searchBox} onPress={() => router.push("/(mtaxi)/request" as any)}>
        <MapPin size={20} color="#666" />
        <Text style={styles.searchText}>Enter destination</Text>
        <ChevronRight size={20} color="#999" />
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Places</Text>
        {RECENT_PLACES.map((place) => (
          <TouchableOpacity
            key={place.id}
            style={styles.placeRow}
            onPress={() => router.push({ pathname: "/(mtaxi)/request", params: { dropoffLat: place.lat, dropoffLng: place.lng, dropoffAddress: place.address } })}
          >
            <Clock size={18} color="#666" />
            <View style={styles.placeInfo}>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.placeAddress}>{place.address}</Text>
            </View>
            <ChevronRight size={18} color="#999" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Your Ride</Text>
        <View style={styles.rideTypes}>
          {[
            { type: "economy", icon: Car, label: "Economy", price: "$2.50 base", desc: "Affordable everyday rides" },
            { type: "premium", icon: Star, label: "Premium", price: "$5.00 base", desc: "Comfortable sedans" },
            { type: "xl", icon: Car, label: "XL", price: "$8.00 base", desc: "Spacious SUVs" },
            { type: "truck", icon: Car, label: "Truck", price: "$12.00 base", desc: "Moving & delivery" },
          ].map((r) => (
            <TouchableOpacity
              key={r.type}
              style={styles.rideTypeCard}
              onPress={() => router.push({ pathname: "/(mtaxi)/request", params: { rideType: r.type } })}
            >
              <r.icon size={28} color="#2563eb" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.rideTypeLabel}>{r.label}</Text>
                <Text style={styles.rideTypeDesc}>{r.desc}</Text>
              </View>
              <Text style={styles.rideTypePrice}>{r.price}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ride History</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(mtaxi)/history" as any)}>
          <Clock size={18} color="#2563eb" />
          <Text style={styles.actionText}>View Past Rides</Text>
          <ChevronRight size={18} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(mtaxi)/payment" as any)}>
          <CreditCard size={18} color="#2563eb" />
          <Text style={styles.actionText}>Manage Payment Methods</Text>
          <ChevronRight size={18} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#2563eb" },
  greeting: { fontSize: 24, fontWeight: "700", color: "#fff" },
  subGreeting: { fontSize: 16, color: "rgba(255,255,255,0.8)", marginTop: 4 },
  searchBox: { flexDirection: "row", alignItems: "center", margin: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  searchText: { flex: 1, marginLeft: 12, fontSize: 16, color: "#666" },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a", marginBottom: 12 },
  placeRow: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#fff", borderRadius: 10, marginBottom: 8 },
  placeInfo: { flex: 1, marginLeft: 12 },
  placeName: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  placeAddress: { fontSize: 13, color: "#666", marginTop: 2 },
  rideTypes: { gap: 10 },
  rideTypeCard: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#fff", borderRadius: 10 },
  rideTypeLabel: { fontSize: 15, fontWeight: "600", color: "#1a1a1a" },
  rideTypeDesc: { fontSize: 12, color: "#666", marginTop: 2 },
  rideTypePrice: { fontSize: 14, fontWeight: "700", color: "#2563eb" },
  actionBtn: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#fff", borderRadius: 10 },
  actionText: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: "500", color: "#1a1a1a" },
});

