// lib/mtaxi/components/BodaHome.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { MapPin, Clock, CreditCard, Bike, Shield, ChevronRight, HardHat } from "lucide-react-native";

const RECENT_PLACES = [
  { id: "1", name: "Home", address: "123 Main Street", lat: -1.2921, lng: 36.8219 },
  { id: "2", name: "Work", address: "456 Business Ave", lat: -1.3, lng: 36.83 },
  { id: "3", name: "Market", address: "City Market", lat: -1.28, lng: 36.82 },
];

export default function BodaHome() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <Bike size={32} color="#f59e0b" />
        <Text style={styles.greeting}>MTAA Boda</Text>
        <Text style={styles.subGreeting}>Fast. Affordable. Everywhere.</Text>
      </View>

      <TouchableOpacity style={styles.searchBox} onPress={() => router.push({ pathname: "/(mtaxi)/request" as any, params: { rideType: "boda" } })}>
        <MapPin size={20} color="#666" />
        <Text style={styles.searchText}>Where to?</Text>
        <ChevronRight size={20} color="#999" />
      </TouchableOpacity>

      <View style={styles.safetyBanner}>
        <Shield size={20} color="#10b981" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.safetyTitle}>Safety First</Text>
          <Text style={styles.safetyText}>Helmet provided · Insured rides · Verified riders</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Places</Text>
        {RECENT_PLACES.map((place) => (
          <TouchableOpacity
            key={place.id}
            style={styles.placeRow}
            onPress={() => router.push({ pathname: "/(mtaxi)/request" as any, params: { rideType: "boda", dropoffLat: place.lat, dropoffLng: place.lng, dropoffAddress: place.address } })}
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
        <Text style={styles.sectionTitle}>Boda Options</Text>
        <View style={styles.rideTypes}>
          {[
            { type: "boda", icon: Bike, label: "Standard Boda", price: "$1.00 base", desc: "One passenger, helmet included" },
            { type: "boda_xl", icon: Bike, label: "Boda XL", price: "$1.50 base", desc: "Two passengers, extra storage" },
            { type: "boda_delivery", icon: Bike, label: "Boda Delivery", price: "$2.00 base", desc: "Small packages & documents" },
          ].map((r) => (
            <TouchableOpacity
              key={r.type}
              style={styles.rideTypeCard}
              onPress={() => router.push({ pathname: "/(mtaxi)/request" as any, params: { rideType: r.type } })}
            >
              <r.icon size={28} color="#f59e0b" />
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
          <Clock size={18} color="#f59e0b" />
          <Text style={styles.actionText}>View Past Rides</Text>
          <ChevronRight size={18} color="#999" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(mtaxi)/payment" as any)}>
          <CreditCard size={18} color="#f59e0b" />
          <Text style={styles.actionText}>Manage Payment Methods</Text>
          <ChevronRight size={18} color="#999" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#1e293b", alignItems: "center" },
  greeting: { fontSize: 24, fontWeight: "700", color: "#fff", marginTop: 8 },
  subGreeting: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  searchBox: { flexDirection: "row", alignItems: "center", margin: 16, padding: 16, backgroundColor: "#fff", borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 3 },
  searchText: { flex: 1, marginLeft: 12, fontSize: 16, color: "#666" },
  safetyBanner: { flexDirection: "row", alignItems: "center", marginHorizontal: 16, padding: 14, backgroundColor: "#ecfdf5", borderRadius: 10, borderLeftWidth: 4, borderLeftColor: "#10b981" },
  safetyTitle: { fontSize: 14, fontWeight: "600", color: "#065f46" },
  safetyText: { fontSize: 12, color: "#047857", marginTop: 2 },
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
  rideTypePrice: { fontSize: 14, fontWeight: "700", color: "#f59e0b" },
  actionBtn: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "#fff", borderRadius: 10 },
  actionText: { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: "500", color: "#1a1a1a" },
});
