import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import {
  Award, Users, Clock, MapPin, DollarSign, Star,
  ChevronRight, CheckCircle2, BookOpen, GraduationCap,
  Calendar, Briefcase, Heart, Share2, Filter
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const APPRENTICESHIPS = [
  {
    id: "1",
    title: "Mobile App Development Apprenticeship",
    company: "MTAA Technologies",
    trade: "Software Development",
    duration: "12 months",
    stipend: "KES 25,000/mo",
    location: "Nairobi",
    slots: 5,
    filled: 2,
    skills: ["React Native", "TypeScript", "Git"],
    certification: true,
    mentor: "Sarah Mwangi",
    logo: "MT",
  },
  {
    id: "2",
    title: "Electrical Installation Apprenticeship",
    company: "Kenya Power",
    trade: "Electrical Engineering",
    duration: "18 months",
    stipend: "KES 20,000/mo",
    location: "Nairobi",
    slots: 10,
    filled: 7,
    skills: ["Electrical Systems", "Safety", "Blueprint Reading"],
    certification: true,
    mentor: "Engineer Otieno",
    logo: "KP",
  },
  {
    id: "3",
    title: "Culinary Arts Apprenticeship",
    company: "Sankara Hotel",
    trade: "Hospitality",
    duration: "6 months",
    stipend: "KES 15,000/mo",
    location: "Nairobi",
    slots: 3,
    filled: 1,
    skills: ["Food Preparation", "Kitchen Management", "Menu Design"],
    certification: true,
    mentor: "Chef Wanjiku",
    logo: "SH",
  },
];

const MY_APPRENTICESHIPS = [
  {
    id: "1",
    title: "Mobile App Development Apprenticeship",
    company: "MTAA Technologies",
    progress: 65,
    completed_months: 8,
    total_months: 12,
    skills_learned: 8,
    total_skills: 12,
    next_milestone: "Build Production App",
    next_date: "2024-12-01",
    status: "active",
  },
];

export default function ApprenticeshipScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("browse");

  const TABS = [
    { id: "browse", label: "Browse" },
    { id: "my_apprenticeships", label: "My Apprenticeships" },
    { id: "mentors", label: "Mentors" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Apprenticeship Hub</Text>
        <Text style={styles.subtitle}>Learn by doing, earn while learning</Text>
      </View>

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

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === "browse" && (
          <View>
            {APPRENTICESHIPS.map((app) => (
              <View key={app.id} style={styles.appCard}>
                <View style={styles.appHeader}>
                  <View style={styles.appLogo}>
                    <Text style={styles.logoText}>{app.logo}</Text>
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appTitle}>{app.title}</Text>
                    <Text style={styles.appCompany}>{app.company}</Text>
                  </View>
                  {app.certification && (
                    <View style={styles.certBadge}>
                      <Award size={10} color="#34C759" />
                      <Text style={styles.certText}>Certified</Text>
                    </View>
                  )}
                </View>

                <View style={styles.appMeta}>
                  <View style={styles.metaItem}><Briefcase size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{app.trade}</Text></View>
                  <View style={styles.metaItem}><Clock size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{app.duration}</Text></View>
                  <View style={styles.metaItem}><DollarSign size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{app.stipend}</Text></View>
                </View>

                <View style={styles.skillsRow}>
                  {app.skills.map((s) => (
                    <View key={s} style={styles.skillChip}><Text style={styles.skillChipText}>{s}</Text></View>
                  ))}
                </View>

                <View style={styles.appFooter}>
                  <View style={styles.metaItem}><Users size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{app.filled}/{app.slots} slots filled</Text></View>
                  <View style={styles.metaItem}><MapPin size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{app.location}</Text></View>
                </View>

                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${(app.filled / app.slots) * 100}%` }]} />
                </View>

                <View style={styles.appActions}>
                  <TouchableOpacity style={styles.appAction}><Heart size={14} color={Colors.primary} /><Text style={styles.appActionText}>Save</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.appAction}><Share2 size={14} color={Colors.primary} /><Text style={styles.appActionText}>Share</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.appActionPrimary}><Text style={styles.appActionPrimaryText}>Apply</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "my_apprenticeships" && (
          <View>
            {MY_APPRENTICESHIPS.map((app) => (
              <View key={app.id} style={styles.myAppCard}>
                <Text style={styles.myAppTitle}>{app.title}</Text>
                <Text style={styles.myAppCompany}>{app.company}</Text>

                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Overall Progress</Text>
                    <Text style={styles.progressValue}>{app.progress}%</Text>
                  </View>
                  <View style={styles.progressBarLarge}>
                    <View style={[styles.progressFillLarge, { width: `${app.progress}%` }]} />
                  </View>
                  <Text style={styles.progressSub}>{app.completed_months} of {app.total_months} months completed</Text>
                </View>

                <View style={styles.milestoneCard}>
                  <View style={styles.milestoneHeader}>
                    <BookOpen size={16} color={Colors.primary} />
                    <Text style={styles.milestoneTitle}>Next Milestone</Text>
                  </View>
                  <Text style={styles.milestoneName}>{app.next_milestone}</Text>
                  <Text style={styles.milestoneDate}>Due: {app.next_date}</Text>
                </View>

                <View style={styles.skillsProgress}>
                  <Text style={styles.skillsProgressLabel}>Skills Learned: {app.skills_learned}/{app.total_skills}</Text>
                  <View style={styles.skillDots}>
                    {Array.from({ length: app.total_skills }).map((_, i) => (
                      <View key={i} style={[styles.skillDot, i < app.skills_learned && styles.skillDotActive]} />
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "mentors" && (
          <View>
            {APPRENTICESHIPS.map((app) => (
              <View key={app.id} style={styles.mentorCard}>
                <View style={styles.mentorAvatar}>
                  <Text style={styles.mentorAvatarText}>{app.mentor.charAt(0)}</Text>
                </View>
                <View style={styles.mentorInfo}>
                  <Text style={styles.mentorName}>{app.mentor}</Text>
                  <Text style={styles.mentorRole}>Mentor · {app.trade}</Text>
                  <Text style={styles.mentorCompany}>{app.company}</Text>
                </View>
                <TouchableOpacity style={styles.messageBtn}>
                  <Text style={styles.messageBtnText}>Message</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

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
  appCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  appHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  appLogo: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  logoText: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  appInfo: { flex: 1 },
  appTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  appCompany: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  certBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#34C75915", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  certText: { fontSize: 10, color: "#34C759", fontWeight: "700" },
  appMeta: { flexDirection: "row", gap: 14, marginBottom: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 10 },
  skillChip: { backgroundColor: Colors.primary + "10", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  skillChipText: { fontSize: 11, color: Colors.primary, fontWeight: "500" },
  appFooter: { flexDirection: "row", gap: 14, marginBottom: 10 },
  progressBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden", marginBottom: 12 },
  progressFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 3 },
  appActions: { flexDirection: "row", gap: 8 },
  appAction: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: Colors.background, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: Colors.border },
  appActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  appActionPrimary: { flex: 1.5, backgroundColor: Colors.primary, paddingVertical: 8, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  appActionPrimaryText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  myAppCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  myAppTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  myAppCompany: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  progressSection: { marginTop: 16 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  progressLabel: { fontSize: 14, fontWeight: "600", color: Colors.text },
  progressValue: { fontSize: 18, fontWeight: "800", color: Colors.primary },
  progressBarLarge: { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: "hidden" },
  progressFillLarge: { height: "100%", backgroundColor: Colors.primary, borderRadius: 5 },
  progressSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 6 },
  milestoneCard: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, marginTop: 16, borderWidth: 1, borderColor: Colors.border },
  milestoneHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  milestoneTitle: { fontSize: 14, fontWeight: "700", color: Colors.text },
  milestoneName: { fontSize: 15, fontWeight: "600", color: Colors.primary },
  milestoneDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  skillsProgress: { marginTop: 16 },
  skillsProgressLabel: { fontSize: 14, fontWeight: "600", color: Colors.text, marginBottom: 8 },
  skillDots: { flexDirection: "row", gap: 6 },
  skillDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border },
  skillDotActive: { backgroundColor: Colors.primary },
  mentorCard: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  mentorAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  mentorAvatarText: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  mentorInfo: { flex: 1, marginLeft: 12 },
  mentorName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  mentorRole: { fontSize: 12, color: Colors.primary, marginTop: 2, fontWeight: "600" },
  mentorCompany: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  messageBtn: { backgroundColor: Colors.primary + "15", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  messageBtnText: { fontSize: 12, color: Colors.primary, fontWeight: "700" },
});
