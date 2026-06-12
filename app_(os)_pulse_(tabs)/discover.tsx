// app/(os)/pulse/(tabs)/discover.tsx
// MTAA Pulse — Discover Tab

import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput
} from "react-native";
import { useRouter } from "expo-router";
import {
  Search, Users, Briefcase, GraduationCap, ShoppingBag,
  MapPin, Calendar, TrendingUp, Star, Globe
} from "lucide-react-native";

const DISCOVER_SECTIONS = [
  {
    title: "People",
    items: [
      { icon: Users, label: "Top Creators", route: "creators", color: "#F472B6" },
      { icon: Star, label: "Rising Stars", route: "creators", color: "#FBBF24" },
      { icon: Users, label: "Communities", route: "communities", color: "#34D399" },
    ],
  },
  {
    title: "Business",
    items: [
      { icon: Briefcase, label: "Businesses", route: "businesses", color: "#60A5FA" },
      { icon: ShoppingBag, label: "Products", route: "marketplace", color: "#F472B6" },
      { icon: TrendingUp, label: "Analytics", route: "analytics", color: "#A78BFA" },
    ],
  },
  {
    title: "Opportunities",
    items: [
      { icon: GraduationCap, label: "Courses", route: "education", color: "#FBBF24" },
      { icon: Briefcase, label: "Jobs", route: "jobs", color: "#34D399" },
      { icon: Calendar, label: "Events", route: "events", color: "#FF6B35" },
    ],
  },
  {
    title: "Places",
    items: [
      { icon: MapPin, label: "Nearby", route: "nearby", color: "#34D399" },
      { icon: Globe, label: "Africa", route: "", color: "#60A5FA" },
      { icon: Globe, label: "Global", route: "", color: "#818CF8" },
    ],
  },
];

export default function PulseDiscoverScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Search Bar */}
      <View style={styles.searchWrap}>
        <Search size={18} color="rgba(255,255,255,0.4)" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Pulse..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => {
            if (searchQuery.trim()) router.push(`/(os)/pulse/search?query=${encodeURIComponent(searchQuery)}` as any);
          }}
        />
      </View>

      {/* Sections */}
      {DISCOVER_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.grid}>
            {section.items.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.card}
                onPress={() => item.route && router.push(`/(os)/pulse/${item.route}` as any)}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${item.color}20` }]}>
                  <item.icon size={22} color={item.color} />
                </View>
                <Text style={styles.cardLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f0f1a" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, color: "#fff", fontSize: 15 },

  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "30%", backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 16, padding: 14, alignItems: "center",
  },
  iconWrap: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: "center", alignItems: "center", marginBottom: 8,
  },
  cardLabel: { color: "#fff", fontSize: 12, fontWeight: "600", textAlign: "center" },
});
