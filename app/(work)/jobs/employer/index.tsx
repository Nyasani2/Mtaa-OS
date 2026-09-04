// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from "expo-router";
import {
  Briefcase, Users, Eye, DollarSign, TrendingUp, Plus,
  ChevronRight, BarChart3, PieChart, Calendar, Clock,
  CheckCircle2, XCircle, MessageSquare, Settings, Filter,
  Search, Star, MapPin
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const STATS = [
  { label: "Active Jobs", value: 8, change: "+2", icon: Briefcase, color: "#0A84FF" },
  { label: "Applicants", value: 124, change: "+18", icon: Users, color: "#34C759" },
  { label: "Views", value: "3.2K", change: "+12%", icon: Eye, color: "#FF9500" },
  { label: "Hired", value: 6, change: "+1", icon: CheckCircle2, color: "#5856D6" },
];

const ACTIVE_JOBS = [
  { id: "1", title: "Senior React Native Developer", applicants: 45, views: 1240, status: "published", posted: "2d ago" },
  { id: "2", title: "Product Designer", applicants: 23, views: 680, status: "published", posted: "5d ago" },
  { id: "3", title: "DevOps Engineer", applicants: 12, views: 340, status: "draft", posted: "1d ago" },
];

const RECENT_APPLICANTS = [
  { id: "1", name: "Sarah M.", role: "Senior React Native Developer", status: "interview", experience: "6 years", match: 92 },
  { id: "2", name: "James K.", role: "Product Designer", status: "screening", experience: "4 years", match: 85 },
  { id: "3", name: "Amina O.", role: "DevOps Engineer", status: "applied", experience: "3 years", match: 78 },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: "Live", color: "#34C759", bg: "#34C75915" },
  draft: { label: "Draft", color: "#FF9500", bg: "#FF950015" },
  paused: { label: "Paused", color: "#FF3B30", bg: "#FF3B3015" },
};

const APP_STATUS: Record<string, { label: string; color: string }> = {
  applied: { label: "New", color: "#0A84FF" },
  screening: { label: "Screening", color: "#FF9500" },
  interview: { label: "Interview", color: "#5856D6" },
};

export default function EmployerScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "jobs", label: "My Jobs" },
    { id: "applicants", label: "Applicants" },
    { id: "analytics", label: "Analytics" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Employer Dashboard</Text>
          <Text style={styles.subtitle}>MTAA Technologies</Text>
        </View>
        <TouchableOpacity style={styles.settingsBtn}>
          <Settings size={20} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + "15" }]}>
                  <Icon size={18} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={[styles.statChange, { color: stat.color }]}>{stat.change}</Text>
              </View>
            );
          })}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickBtn}>
            <Plus size={18} color="#fff" />
            <Text style={styles.quickBtnText}>Post Job</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.quickBtn, { backgroundColor: Colors.card }]} onPress={() => router.push("/(work)/jobs/talent-search" as any)}>
            <Search size={18} color={Colors.primary} />
            <Text style={[styles.quickBtnText, { color: Colors.primary }]}>Find Talent</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "overview" && (
          <View>
            {/* Active Jobs Preview */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active Jobs</Text>
                <TouchableOpacity onPress={() => setActiveTab("jobs")}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {ACTIVE_JOBS.slice(0, 2).map((job) => {
                const st = STATUS_CONFIG[job.status];
                return (
                  <View key={job.id} style={styles.jobCard}>
                    <View style={styles.jobHeader}>
                      <Text style={styles.jobTitle}>{job.title}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                        <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>
                    <View style={styles.jobStats}>
                      <View style={styles.jobStat}><Users size={12} color={Colors.textSecondary} /><Text style={styles.jobStatText}>{job.applicants} applicants</Text></View>
                      <View style={styles.jobStat}><Eye size={12} color={Colors.textSecondary} /><Text style={styles.jobStatText}>{job.views} views</Text></View>
                      <View style={styles.jobStat}><Clock size={12} color={Colors.textSecondary} /><Text style={styles.jobStatText}>{job.posted}</Text></View>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Recent Applicants */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Applicants</Text>
                <TouchableOpacity onPress={() => setActiveTab("applicants")}>
                  <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
              </View>
              {RECENT_APPLICANTS.map((app) => {
                const st = APP_STATUS[app.status];
                return (
                  <TouchableOpacity key={app.id} style={styles.applicantCard}>
                    <View style={styles.applicantAvatar}>
                      <Text style={styles.applicantAvatarText}>{app.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.applicantInfo}>
                      <Text style={styles.applicantName}>{app.name}</Text>
                      <Text style={styles.applicantRole}>{app.role}</Text>
                      <Text style={styles.applicantExp}>{app.experience} experience</Text>
                    </View>
                    <View style={styles.applicantRight}>
                      <View style={[styles.matchBadge, { backgroundColor: app.match >= 90 ? "#34C75915" : "#FF950015" }]}>
                        <Text style={[styles.matchText, { color: app.match >= 90 ? "#34C759" : "#FF9500" }]}>{app.match}% match</Text>
                      </View>
                      <View style={[styles.appStatusBadge, { backgroundColor: st.color + "15" }]}>
                        <Text style={[styles.appStatusText, { color: st.color }]}>{st.label}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {activeTab === "jobs" && (
          <View style={styles.section}>
            {ACTIVE_JOBS.map((job) => {
              const st = STATUS_CONFIG[job.status];
              return (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                  <View style={styles.jobStats}>
                    <View style={styles.jobStat}><Users size={12} color={Colors.textSecondary} /><Text style={styles.jobStatText}>{job.applicants} applicants</Text></View>
                    <View style={styles.jobStat}><Eye size={12} color={Colors.textSecondary} /><Text style={styles.jobStatText}>{job.views} views</Text></View>
                    <View style={styles.jobStat}><Clock size={12} color={Colors.textSecondary} /><Text style={styles.jobStatText}>{job.posted}</Text></View>
                  </View>
                  <View style={styles.jobActions}>
                    <TouchableOpacity style={styles.jobAction}><Text style={styles.jobActionText}>Edit</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.jobAction}><Text style={styles.jobActionText}>View</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.jobAction}><Text style={styles.jobActionText}>Analytics</Text></TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {activeTab === "applicants" && (
          <View style={styles.section}>
            {RECENT_APPLICANTS.map((app) => {
              const st = APP_STATUS[app.status];
              return (
                <TouchableOpacity key={app.id} style={styles.applicantCard}>
                  <View style={styles.applicantAvatar}>
                    <Text style={styles.applicantAvatarText}>{app.name.charAt(0)}</Text>
                  </View>
                  <View style={styles.applicantInfo}>
                    <Text style={styles.applicantName}>{app.name}</Text>
                    <Text style={styles.applicantRole}>{app.role}</Text>
                    <Text style={styles.applicantExp}>{app.experience} experience</Text>
                  </View>
                  <View style={styles.applicantRight}>
                    <View style={[styles.matchBadge, { backgroundColor: app.match >= 90 ? "#34C75915" : "#FF950015" }]}>
                      <Text style={[styles.matchText, { color: app.match >= 90 ? "#34C759" : "#FF9500" }]}>{app.match}% match</Text>
                    </View>
                    <View style={[styles.appStatusBadge, { backgroundColor: st.color + "15" }]}>
                      <Text style={[styles.appStatusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeTab === "analytics" && (
          <View style={styles.section}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Job Performance</Text>
              <View style={styles.analyticsRow}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>3.2K</Text>
                  <Text style={styles.analyticsLabel}>Total Views</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>124</Text>
                  <Text style={styles.analyticsLabel}>Applications</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>3.8%</Text>
                  <Text style={styles.analyticsLabel}>Conversion</Text>
                </View>
              </View>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Hiring Funnel</Text>
              <View style={styles.funnelRow}>
                <View style={styles.funnelItem}>
                  <Text style={styles.funnelValue}>124</Text>
                  <Text style={styles.funnelLabel}>Applied</Text>
                </View>
                <ChevronRight size={16} color={Colors.textSecondary} />
                <View style={styles.funnelItem}>
                  <Text style={styles.funnelValue}>45</Text>
                  <Text style={styles.funnelLabel}>Screened</Text>
                </View>
                <ChevronRight size={16} color={Colors.textSecondary} />
                <View style={styles.funnelItem}>
                  <Text style={styles.funnelValue}>18</Text>
                  <Text style={styles.funnelLabel}>Interview</Text>
                </View>
                <ChevronRight size={16} color={Colors.textSecondary} />
                <View style={styles.funnelItem}>
                  <Text style={styles.funnelValue}>6</Text>
                  <Text style={styles.funnelLabel}>Hired</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  settingsBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, gap: 10 },
  statCard: { width: (width - 52) / 2, backgroundColor: Colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.border },
  statIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: "800", color: Colors.text },
  statLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  statChange: { fontSize: 12, fontWeight: "700", marginTop: 4 },
  quickActions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: 16 },
  quickBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12 },
  quickBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  tabsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginTop: 16, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  seeAll: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  jobCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  jobHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  jobTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700" },
  jobStats: { flexDirection: "row", gap: 16, marginTop: 12 },
  jobStat: { flexDirection: "row", alignItems: "center", gap: 4 },
  jobStatText: { fontSize: 12, color: Colors.textSecondary },
  jobActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  jobAction: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  jobActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  applicantCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  applicantAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  applicantAvatarText: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  applicantInfo: { flex: 1, marginLeft: 12 },
  applicantName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  applicantRole: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  applicantExp: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  applicantRight: { alignItems: "flex-end", gap: 6 },
  matchBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  matchText: { fontSize: 10, fontWeight: "700" },
  appStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  appStatusText: { fontSize: 10, fontWeight: "700" },
  analyticsCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  analyticsTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  analyticsRow: { flexDirection: "row", gap: 12 },
  analyticsItem: { flex: 1, alignItems: "center", backgroundColor: Colors.background, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  analyticsValue: { fontSize: 20, fontWeight: "800", color: Colors.text },
  analyticsLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
  funnelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  funnelItem: { alignItems: "center" },
  funnelValue: { fontSize: 18, fontWeight: "800", color: Colors.text },
  funnelLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
});
