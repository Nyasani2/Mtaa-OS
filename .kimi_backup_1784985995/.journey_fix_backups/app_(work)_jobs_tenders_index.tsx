import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from "react-native";
import {
  Gavel, Building2, Calendar, DollarSign, FileText,
  ChevronRight, MapPin, Clock, CheckCircle2, Download,
  Share2, Bookmark
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const TENDERS = [
  { id: "1", title: "IT Infrastructure Upgrade", organization: "Government of Kenya", type: "Government", category: "Technology", budget: 5000000, deadline: "2024-12-20", location: "Nairobi", status: "open" },
  { id: "2", title: "Road Construction Phase 2", organization: "County Government", type: "County", category: "Construction", budget: 25000000, deadline: "2025-01-10", location: "Mombasa", status: "open" },
  { id: "3", title: "Medical Supplies Procurement", organization: "UNICEF Kenya", type: "NGO", category: "Healthcare", budget: 8000000, deadline: "2024-11-30", location: "Nairobi", status: "closing_soon" },
];

export default function TendersScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Tenders & Procurement</Text>
        <Text style={styles.subtitle}>Government, private, NGO opportunities</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {TENDERS.map((tender) => (
          <TouchableOpacity key={tender.id} style={styles.tenderCard}>
            <View style={styles.tenderHeader}>
              <View style={styles.tenderIcon}><Gavel size={18} color={Colors.primary} /></View>
              <View style={styles.tenderInfo}>
                <Text style={styles.tenderTitle}>{tender.title}</Text>
                <Text style={styles.tenderOrg}>{tender.organization}</Text>
              </View>
              <View style={[styles.statusBadge, tender.status === "closing_soon" && { backgroundColor: "#FF3B3015" }]}>
                <Text style={[styles.statusText, tender.status === "closing_soon" && { color: "#FF3B30" }]}>{tender.status.replace("_", " ")}</Text>
              </View>
            </View>
            <View style={styles.tenderMeta}>
              <View style={styles.metaItem}><Building2 size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{tender.type}</Text></View>
              <View style={styles.metaItem}><DollarSign size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>KES {tender.budget.toLocaleString()}</Text></View>
              <View style={styles.metaItem}><MapPin size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{tender.location}</Text></View>
            </View>
            <View style={styles.tenderFooter}>
              <View style={styles.metaItem}><Clock size={14} color="#FF3B30" /><Text style={styles.deadlineText}>Deadline: {tender.deadline}</Text></View>
            </View>
            <View style={styles.tenderActions}>
              <TouchableOpacity style={styles.tenderAction}><Text style={styles.tenderActionText}>View Tender</Text></TouchableOpacity>
              <TouchableOpacity style={styles.tenderAction}><Text style={styles.tenderActionText}>Apply</Text></TouchableOpacity>
              <TouchableOpacity style={styles.tenderAction}><Text style={styles.tenderActionText}>Upload Docs</Text></TouchableOpacity>
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
  tenderCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  tenderHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  tenderIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  tenderInfo: { flex: 1 },
  tenderTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  tenderOrg: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { backgroundColor: Colors.primary + "10", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, color: Colors.primary, fontWeight: "700", textTransform: "capitalize" },
  tenderMeta: { flexDirection: "row", gap: 16, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  tenderFooter: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  deadlineText: { fontSize: 12, color: "#FF3B30", fontWeight: "600" },
  tenderActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  tenderAction: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  tenderActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
});
