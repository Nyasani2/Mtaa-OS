// @ts-nocheck
import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions, FlatList
} from "react-native";
import { useRouter } from "expo-router";
import {
  Search, Briefcase, Users, Star, TrendingUp, MapPin,
  Clock, Bookmark, ChevronRight, Zap, Award, GraduationCap,
  FileText, DollarSign, MessageSquare, Settings, Bell,
  Filter, Heart, Share2, Building2, CheckCircle2
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const TABS = [
  { id: "for_you", label: "For You", icon: Star },
  { id: "jobs", label: "Jobs", icon: Briefcase },
  { id: "contracts", label: "Contracts", icon: FileText },
  { id: "freelance", label: "Freelance", icon: Zap },
  { id: "apprenticeships", label: "Apprenticeships", icon: Award },
  { id: "scholarships", label: "Scholarships", icon: GraduationCap },
  { id: "funding", label: "Funding", icon: DollarSign },
  { id: "tenders", label: "Tenders", icon: FileText },
  { id: "internships", label: "Internships", icon: Briefcase },
  { id: "volunteer", label: "Volunteer", icon: Heart },
  { id: "saved", label: "Saved", icon: Bookmark },
  { id: "applied", label: "Applied", icon: CheckCircle2 },
  { id: "recommended", label: "Recommended", icon: TrendingUp },
];

const QUICK_ACTIONS = [
  { id: "profile", label: "My Profile", icon: Users, route: "/(work)/jobs/profile" },
  { id: "skills", label: "Skills", icon: Award, route: "/(work)/jobs/skills" },
  { id: "portfolio", label: "Portfolio", icon: Star, route: "/(os)/profile/professional/portfolio" },
  { id: "applications", label: "Applications", icon: FileText, route: "/(work)/jobs/applications" },
  { id: "employer", label: "Employer", icon: Building2, route: "/(work)/jobs/employer" },
  { id: "talent", label: "Find Talent", icon: Search, route: "/(work)/jobs/talent-search" },
];

const FEATURED_JOBS = [
  { id: "1", title: "Senior React Native Developer", company: "MTAA Technologies", location: "Nairobi", type: "full_time", salary: "KES 180K - 250K", posted: "2d ago", logo: "MT" },
  { id: "2", title: "Product Designer", company: "Safaricom Digital", location: "Nairobi", type: "full_time", salary: "KES 150K - 200K", posted: "3d ago", logo: "SF" },
  { id: "3", title: "DevOps Engineer", company: "Andela Kenya", location: "Remote", type: "contract", salary: "KES 200K - 300K", posted: "1d ago", logo: "AN" },
];

const NEARBY_JOBS = [
  { id: "4", title: "Store Manager", company: "QuickMart", location: "Westlands, Nairobi", distance: "2.3 km", type: "full_time", salary: "KES 60K - 80K" },
  { id: "5", title: "Delivery Driver", company: "Glovo", location: "Kilimani, Nairobi", distance: "1.8 km", type: "part_time", salary: "KES 30K - 45K" },
];

const TRENDING_SKILLS = ["React Native", "Flutter", "UI/UX", "Cloud", "Data Science", "Cybersecurity", "AI/ML", "Blockchain"];

const FEATURED_EMPLOYERS = [
  { id: "1", name: "MTAA Technologies", jobs: 12, logo: "MT", verified: true },
  { id: "2", name: "Safaricom", jobs: 8, logo: "SF", verified: true },
  { id: "3", name: "Andela", jobs: 5, logo: "AN", verified: true },
  { id: "4", name: "Twiga Foods", jobs: 3, logo: "TF", verified: false },
];

export default function JobsHomeScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("for_you");
  const [searchQuery, setSearchQuery] = useState("");

  const renderJobCard = (job: any) => (
    <TouchableOpacity
      key={job.id}
      style={styles.jobCard}
      onPress={() => router.push("/(work)/jobs/details" as any)}
    >
      <View style={styles.jobHeader}>
        <View style={styles.companyLogo}>
          <Text style={styles.logoText}>{job.logo}</Text>
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobTitle} numberOfLines={1}>{job.title}</Text>
          <Text style={styles.jobCompany}>{job.company}</Text>
        </View>
        <TouchableOpacity style={styles.saveBtn}>
          <Bookmark size={18} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <View style={styles.jobMeta}>
        <View style={styles.metaItem}><MapPin size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{job.location}</Text></View>
        <View style={styles.metaItem}><Briefcase size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{job.type.replace("_", " ")}</Text></View>
        <View style={styles.metaItem}><DollarSign size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{job.salary}</Text></View>
      </View>
      <View style={styles.jobFooter}>
        <Text style={styles.postedText}>{job.posted}</Text>
        <TouchableOpacity style={styles.applyBtn}>
          <Text style={styles.applyBtnText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Find Your Next</Text>
            <Text style={styles.greetingBold}>Opportunity</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(work)/jobs/interviews" as any)}>
              <Bell size={20} color={Colors.text} />
              <View style={styles.badge}><Text style={styles.badgeText}>3</Text></View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(work)/jobs/settings" as any)}>
              <Settings size={20} color={Colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={18} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Job title, company, or skill..."
              placeholderTextColor={Colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => router.push("/(work)/jobs/talent-search" as any)}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Filter size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.tab, isActive && styles.tabActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Icon size={14} color={isActive ? "#fff" : Colors.textSecondary} />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <TouchableOpacity
                  key={action.id}
                  style={styles.quickCard}
                  onPress={() => router.push(action.route as any)}
                >
                  <View style={styles.quickIcon}>
                    <Icon size={20} color={Colors.primary} />
                  </View>
                  <Text style={styles.quickLabel}>{action.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Featured Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Jobs</Text>
            <TouchableOpacity onPress={() => router.push("/(work)/jobs/talent-search" as any)}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {FEATURED_JOBS.map(renderJobCard)}
        </View>

        {/* Nearby */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {NEARBY_JOBS.map((job) => (
            <TouchableOpacity key={job.id} style={styles.nearbyCard}>
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyTitle}>{job.title}</Text>
                <Text style={styles.nearbyCompany}>{job.company} · {job.distance}</Text>
              </View>
              <ChevronRight size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Trending Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Skills</Text>
          <View style={styles.skillsRow}>
            {TRENDING_SKILLS.map((skill) => (
              <TouchableOpacity key={skill} style={styles.skillChip}>
                <Text style={styles.skillText}>{skill}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Employers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Employers</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.employersRow}>
            {FEATURED_EMPLOYERS.map((emp) => (
              <TouchableOpacity key={emp.id} style={styles.employerCard}>
                <View style={styles.employerLogo}>
                  <Text style={styles.employerLogoText}>{emp.logo}</Text>
                </View>
                <Text style={styles.employerName} numberOfLines={1}>{emp.name}</Text>
                <Text style={styles.employerJobs}>{emp.jobs} open jobs</Text>
                {emp.verified && <View style={styles.verifiedBadge}><CheckCircle2 size={10} color="#34C759" /></View>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  greeting: { fontSize: 16, color: Colors.textSecondary },
  greetingBold: { fontSize: 24, fontWeight: "800", color: Colors.text },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  badge: { position: "absolute", top: -2, right: -2, backgroundColor: "#FF3B30", borderRadius: 8, minWidth: 16, height: 16, justifyContent: "center", alignItems: "center" },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  searchRow: { flexDirection: "row", gap: 10 },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: Colors.text },
  filterBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  tabsContainer: { paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickCard: { width: (width - 52) / 3, backgroundColor: Colors.card, borderRadius: 14, padding: 12, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  quickIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  quickLabel: { fontSize: 11, color: Colors.text, fontWeight: "600", textAlign: "center" },
  jobCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  jobHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  companyLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  logoText: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  jobCompany: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  saveBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.background, justifyContent: "center", alignItems: "center" },
  jobMeta: { flexDirection: "row", gap: 14, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  jobFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.border },
  postedText: { fontSize: 12, color: Colors.textSecondary },
  applyBtn: { backgroundColor: Colors.primary, paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  applyBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  nearbyCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  nearbyInfo: { flex: 1 },
  nearbyTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  nearbyCompany: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: { backgroundColor: Colors.card, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  skillText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "500" },
  employersRow: { gap: 10, paddingVertical: 4 },
  employerCard: { width: 120, backgroundColor: Colors.card, borderRadius: 14, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  employerLogo: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  employerLogoText: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  employerName: { fontSize: 12, fontWeight: "600", color: Colors.text, textAlign: "center" },
  employerJobs: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  verifiedBadge: { position: "absolute", top: 8, right: 8 },
});
