import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from "react-native";
import {
  GraduationCap, DollarSign, Calendar, MapPin, ChevronRight,
  BookOpen, Award, Trophy, CheckCircle2, Heart, Share2,
  ExternalLink, Filter
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const SCHOLARSHIPS = [
  { id: "1", title: "Mastercard Foundation Scholarship", provider: "Mastercard Foundation", amount: 2000000, level: "Undergraduate", field: "STEM", deadline: "2024-12-15", coverage: ["Tuition", "Accommodation", "Stipend"], type: "scholarship" },
  { id: "2", title: "Google Africa Developer Scholarship", provider: "Google", amount: 500000, level: "Certificate", field: "Technology", deadline: "2024-11-30", coverage: ["Tuition", "Laptop"], type: "scholarship" },
  { id: "3", title: "DAAD Scholarship Kenya", provider: "DAAD Germany", amount: 1500000, level: "Masters", field: "Engineering", deadline: "2025-01-15", coverage: ["Tuition", "Travel", "Stipend"], type: "scholarship" },
];

const GRANTS = [
  { id: "1", title: "Hult Prize Seed Funding", type: "Seed Funding", amount: 1000000, focus: "Social Enterprise", deadline: "2024-12-01" },
  { id: "2", title: "Tony Elumelu Foundation Grant", type: "Entrepreneurship", amount: 5000000, focus: "African Business", deadline: "2025-03-01" },
];

export default function ScholarshipsScreen() {
  const [activeTab, setActiveTab] = useState("scholarships");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Scholarships & Funding</Text>
        <Text style={styles.subtitle}>Invest in your future</Text>
      </View>

      <View style={styles.tabsRow}>
        {[{ id: "scholarships", label: "Scholarships" }, { id: "grants", label: "Grants" }].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === "scholarships" && SCHOLARSHIPS.map((s) => (
          <View key={s.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}><GraduationCap size={20} color={Colors.primary} /></View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{s.title}</Text>
                <Text style={styles.cardProvider}>{s.provider}</Text>
              </View>
            </View>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}><DollarSign size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>KES {s.amount.toLocaleString()}</Text></View>
              <View style={styles.metaItem}><BookOpen size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{s.level}</Text></View>
              <View style={styles.metaItem}><Award size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{s.field}</Text></View>
            </View>
            <View style={styles.coverageRow}>
              {s.coverage.map((c) => <View key={c} style={styles.coverageBadge}><Text style={styles.coverageText}>{c}</Text></View>)}
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.metaItem}><Calendar size={14} color="#FF3B30" /><Text style={styles.deadlineText}>Deadline: {s.deadline}</Text></View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Apply</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Save</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Share</Text></TouchableOpacity>
            </View>
          </View>
        ))}

        {activeTab === "grants" && GRANTS.map((g) => (
          <View key={g.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: "#FF950015" }]}><Trophy size={20} color="#FF9500" /></View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{g.title}</Text>
                <Text style={styles.cardProvider}>{g.type}</Text>
              </View>
            </View>
            <View style={styles.cardMeta}>
              <View style={styles.metaItem}><DollarSign size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>KES {g.amount.toLocaleString()}</Text></View>
              <View style={styles.metaItem}><Award size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{g.focus}</Text></View>
            </View>
            <View style={styles.cardFooter}>
              <View style={styles.metaItem}><Calendar size={14} color="#FF3B30" /><Text style={styles.deadlineText}>Deadline: {g.deadline}</Text></View>
            </View>
            <View style={styles.cardActions}>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Apply</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Save</Text></TouchableOpacity>
            </View>
          </View>
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
  tabsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  cardProvider: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  cardMeta: { flexDirection: "row", gap: 16, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  coverageRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  coverageBadge: { backgroundColor: Colors.primary + "10", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  coverageText: { fontSize: 11, color: Colors.primary, fontWeight: "500" },
  cardFooter: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  deadlineText: { fontSize: 12, color: "#FF3B30", fontWeight: "600" },
  cardActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  actionBtnText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
});
