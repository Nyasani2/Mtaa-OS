// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from "expo-router";
import {
  FileText, Clock, CheckCircle2, XCircle, MessageSquare,
  ChevronRight, Briefcase, Building2, Calendar, Bell,
  Filter, Search
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const APPLICATIONS = [
  {
    id: "1",
    job_title: "Senior React Native Developer",
    company: "MTAA Technologies",
    status: "interview",
    applied_at: "2024-11-10",
    updated_at: "2024-11-18",
    next_step: "Technical Interview",
    next_date: "2024-11-25",
    next_time: "10:00 AM",
    logo: "MT",
  },
  {
    id: "2",
    job_title: "Product Designer",
    company: "Safaricom Digital",
    status: "screening",
    applied_at: "2024-11-12",
    updated_at: "2024-11-15",
    next_step: "Portfolio Review",
    next_date: "2024-11-22",
    next_time: "2:00 PM",
    logo: "SF",
  },
  {
    id: "3",
    job_title: "DevOps Engineer",
    company: "Andela Kenya",
    status: "applied",
    applied_at: "2024-11-18",
    updated_at: "2024-11-18",
    next_step: null,
    next_date: null,
    next_time: null,
    logo: "AN",
  },
  {
    id: "4",
    job_title: "Frontend Engineer",
    company: "Twiga Foods",
    status: "rejected",
    applied_at: "2024-10-28",
    updated_at: "2024-11-05",
    next_step: null,
    next_date: null,
    next_time: null,
    logo: "TF",
  },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  applied: { label: "Applied", color: "#0A84FF", bg: "#0A84FF15", icon: FileText },
  screening: { label: "Screening", color: "#FF9500", bg: "#FF950015", icon: Clock },
  interview: { label: "Interview", color: "#5856D6", bg: "#5856D615", icon: Calendar },
  offer: { label: "Offer", color: "#34C759", bg: "#34C75915", icon: CheckCircle2 },
  hired: { label: "Hired", color: "#34C759", bg: "#34C75915", icon: CheckCircle2 },
  rejected: { label: "Not Selected", color: "#FF3B30", bg: "#FF3B3015", icon: XCircle },
  withdrawn: { label: "Withdrawn", color: Colors.textSecondary, bg: Colors.border, icon: XCircle },
};

export default function ApplicationsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  const filtered = filter === "all" ? APPLICATIONS : APPLICATIONS.filter((a) => a.status === filter);

  const FILTERS = [
    { id: "all", label: "All" },
    { id: "applied", label: "Applied" },
    { id: "screening", label: "Screening" },
    { id: "interview", label: "Interview" },
    { id: "offer", label: "Offer" },
    { id: "rejected", label: "Closed" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Application Center</Text>
        <Text style={styles.subtitle}>Track all your job applications</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#FF9500" }]}>2</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#34C759" }]}>1</Text>
          <Text style={styles.statLabel}>Offers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: "#FF3B30" }]}>3</Text>
          <Text style={styles.statLabel}>Closed</Text>
        </View>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.id}
            style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
            onPress={() => setFilter(f.id)}
          >
            <Text style={[styles.filterText, filter === f.id && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {filtered.map((app) => {
          const status = STATUS_CONFIG[app.status];
          const StatusIcon = status.icon;
          return (
            <TouchableOpacity key={app.id} style={styles.appCard}>
              <View style={styles.appHeader}>
                <View style={styles.appLogo}>
                  <Text style={styles.logoText}>{app.logo}</Text>
                </View>
                <View style={styles.appInfo}>
                  <Text style={styles.appTitle}>{app.job_title}</Text>
                  <Text style={styles.appCompany}>{app.company}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                  <StatusIcon size={12} color={status.color} />
                  <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                </View>
              </View>

              <View style={styles.appMeta}>
                <View style={styles.metaItem}><Calendar size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>Applied {app.applied_at}</Text></View>
                <View style={styles.metaItem}><Clock size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>Updated {app.updated_at}</Text></View>
              </View>

              {app.next_step && (
                <View style={styles.nextStepCard}>
                  <Bell size={14} color={Colors.primary} />
                  <View style={styles.nextStepInfo}>
                    <Text style={styles.nextStepTitle}>{app.next_step}</Text>
                    <Text style={styles.nextStepDate}>{app.next_date} at {app.next_time}</Text>
                  </View>
                  <TouchableOpacity style={styles.joinBtn}>
                    <Text style={styles.joinBtnText}>Join</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.appActions}>
                <TouchableOpacity style={styles.appAction}>
                  <MessageSquare size={14} color={Colors.primary} />
                  <Text style={styles.appActionText}>Message</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.appAction}>
                  <FileText size={14} color={Colors.primary} />
                  <Text style={styles.appActionText}>View Job</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.appAction}>
                  <ChevronRight size={14} color={Colors.primary} />
                  <Text style={styles.appActionText}>Details</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

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
  statsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statValue: { fontSize: 20, fontWeight: "800", color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  filterRow: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  appCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  appHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  appLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  logoText: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  appInfo: { flex: 1 },
  appTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  appCompany: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700" },
  appMeta: { flexDirection: "row", gap: 16, marginTop: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  nextStepCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: Colors.primary + "08", padding: 12, borderRadius: 12, marginTop: 12 },
  nextStepInfo: { flex: 1 },
  nextStepTitle: { fontSize: 13, fontWeight: "700", color: Colors.text },
  nextStepDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  joinBtn: { backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  joinBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  appActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  appAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: Colors.background, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  appActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
});
