import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import {
  Search, Filter, Star, MapPin, Briefcase, Award,
  ChevronRight, Heart, MessageSquare, SlidersHorizontal,
  CheckCircle2, Clock, DollarSign, Users
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const TALENT = [
  {
    id: "1",
    name: "Sarah Mwangi",
    headline: "Senior React Native Developer",
    location: "Nairobi, Kenya",
    experience: "6 years",
    skills: ["React Native", "TypeScript", "Expo"],
    rate: "KES 200K/mo",
    availability: "2 weeks",
    verified: true,
    rating: 4.9,
    reviews: 24,
    match: 96,
  },
  {
    id: "2",
    name: "James Kimani",
    headline: "UI/UX Designer",
    location: "Nairobi, Kenya",
    experience: "4 years",
    skills: ["Figma", "Adobe XD", "Prototyping"],
    rate: "KES 150K/mo",
    availability: "Immediate",
    verified: true,
    rating: 4.7,
    reviews: 18,
    match: 88,
  },
  {
    id: "3",
    name: "Amina Ochieng",
    headline: "DevOps Engineer",
    location: "Mombasa, Kenya",
    experience: "3 years",
    skills: ["AWS", "Docker", "Kubernetes"],
    rate: "KES 180K/mo",
    availability: "1 month",
    verified: false,
    rating: 4.5,
    reviews: 12,
    match: 82,
  },
];

const FILTERS = [
  { id: "all", label: "All Talent" },
  { id: "verified", label: "Verified" },
  { id: "available", label: "Available Now" },
  { id: "remote", label: "Remote" },
];

export default function TalentSearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Talent</Text>
        <Text style={styles.subtitle}>Search verified professionals</Text>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by skill, name, or role..."
            placeholderTextColor={Colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn}>
          <SlidersHorizontal size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, activeFilter === f.id && styles.filterChipActive]}
            onPress={() => setActiveFilter(f.id)}
          >
            <Text style={[styles.filterText, activeFilter === f.id && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {TALENT.map((person) => (
          <TouchableOpacity key={person.id} style={styles.talentCard}>
            <View style={styles.talentHeader}>
              <View style={styles.talentAvatar}>
                <Text style={styles.talentAvatarText}>{person.name.charAt(0)}</Text>
              </View>
              <View style={styles.talentInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.talentName}>{person.name}</Text>
                  {person.verified && <CheckCircle2 size={14} color="#34C759" />}
                </View>
                <Text style={styles.talentHeadline}>{person.headline}</Text>
                <View style={styles.talentMeta}>
                  <View style={styles.metaItem}><MapPin size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{person.location}</Text></View>
                  <View style={styles.metaItem}><Briefcase size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{person.experience}</Text></View>
                </View>
              </View>
              <View style={styles.matchBadge}>
                <Text style={styles.matchValue}>{person.match}%</Text>
                <Text style={styles.matchLabel}>match</Text>
              </View>
            </View>

            <View style={styles.skillsRow}>
              {person.skills.map((s) => (
                <View key={s} style={styles.skillChip}><Text style={styles.skillChipText}>{s}</Text></View>
              ))}
            </View>

            <View style={styles.talentFooter}>
              <View style={styles.footerItem}><DollarSign size={12} color={Colors.textSecondary} /><Text style={styles.footerText}>{person.rate}</Text></View>
              <View style={styles.footerItem}><Clock size={12} color={Colors.textSecondary} /><Text style={styles.footerText}>{person.availability}</Text></View>
              <View style={styles.footerItem}><Star size={12} color="#FF9500" fill="#FF9500" /><Text style={styles.footerText}>{person.rating} ({person.reviews})</Text></View>
            </View>

            <View style={styles.talentActions}>
              <TouchableOpacity style={styles.talentAction}>
                <Heart size={14} color={Colors.primary} />
                <Text style={styles.talentActionText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.talentAction}>
                <MessageSquare size={14} color={Colors.primary} />
                <Text style={styles.talentActionText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.talentActionPrimary}>
                <Text style={styles.talentActionPrimaryText}>Invite to Apply</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  searchRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginBottom: 8 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: Colors.text },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  talentCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  talentHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  talentAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  talentAvatarText: { fontSize: 20, fontWeight: "700", color: Colors.primary },
  talentInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  talentName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  talentHeadline: { fontSize: 13, color: Colors.primary, marginTop: 2, fontWeight: "600" },
  talentMeta: { flexDirection: "row", gap: 12, marginTop: 6 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 11, color: Colors.textSecondary },
  matchBadge: { alignItems: "center", backgroundColor: Colors.primary + "10", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  matchValue: { fontSize: 16, fontWeight: "800", color: Colors.primary },
  matchLabel: { fontSize: 10, color: Colors.textSecondary },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  skillChip: { backgroundColor: Colors.primary + "10", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  skillChipText: { fontSize: 11, color: Colors.primary, fontWeight: "500" },
  talentFooter: { flexDirection: "row", gap: 16, marginTop: 12 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerText: { fontSize: 12, color: Colors.textSecondary },
  talentActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  talentAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: Colors.background, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  talentActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  talentActionPrimary: { flex: 1.5, backgroundColor: Colors.primary, paddingVertical: 8, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  talentActionPrimaryText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
