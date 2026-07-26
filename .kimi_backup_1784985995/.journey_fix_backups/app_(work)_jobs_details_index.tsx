import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import {
  Briefcase, MapPin, DollarSign, Clock, Users, Star,
  Bookmark, Share2, ChevronRight, CheckCircle2, Building2,
  Globe, Calendar, Heart, MessageSquare, FileText, ArrowLeft
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const JOB = {
  id: "1",
  title: "Senior React Native Developer",
  company: "MTAA Technologies",
  logo: "MT",
  verified: true,
  rating: 4.8,
  reviews: 124,
  location: "Nairobi, Kenya",
  type: "full_time",
  salary: "KES 180,000 - 250,000",
  salary_period: "per month",
  posted: "2 days ago",
  applicants: 45,
  views: 1240,
  expires: "2024-12-31",
  description: `We are looking for an experienced React Native developer to lead our mobile team building the MTAA OS platform — Africa's first mobile operating system for civic and commercial services.

You will architect, build, and maintain cross-platform mobile applications serving millions of users across Kenya and East Africa.`,
  responsibilities: [
    "Lead mobile development for the MTAA OS platform",
    "Architect scalable React Native solutions with TypeScript",
    "Mentor junior developers and conduct code reviews",
    "Collaborate with product, design, and backend teams",
    "Implement CI/CD pipelines for mobile deployments",
    "Optimize app performance and reduce bundle size",
  ],
  requirements: [
    "5+ years of React Native development experience",
    "Strong TypeScript and modern JavaScript skills",
    "Experience with Expo, EAS, and native module bridging",
    "Deep understanding of mobile performance optimization",
    "Experience with state management (Zustand, Redux)",
    "BSc in Computer Science or equivalent experience",
  ],
  benefits: [
    "Competitive salary + performance bonuses",
    "Health insurance for you and family",
    "Remote-friendly with Nairobi office",
    "Stock options in MTAA Technologies",
    "Annual learning budget of KES 100,000",
    "Flexible working hours",
  ],
  skills: ["React Native", "TypeScript", "Expo", "Redux", "GraphQL", "CI/CD"],
};

const SIMILAR_JOBS = [
  { id: "2", title: "Lead Mobile Engineer", company: "Andela Kenya", salary: "KES 200K - 300K", type: "full_time" },
  { id: "3", title: "React Native Contractor", company: "Twiga Foods", salary: "KES 150K - 200K", type: "contract" },
];

export default function JobDetailsScreen() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "company", label: "Company" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <ArrowLeft size={20} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setSaved(!saved)}>
              <Bookmark size={18} color={saved ? Colors.primary : Colors.textSecondary} fill={saved ? Colors.primary : "transparent"} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Share2 size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Job Header Card */}
        <View style={styles.jobHeaderCard}>
          <View style={styles.companyRow}>
            <View style={styles.companyLogo}>
              <Text style={styles.logoText}>{JOB.logo}</Text>
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{JOB.company}</Text>
              <View style={styles.ratingRow}>
                <Star size={12} color="#FF9500" fill="#FF9500" />
                <Text style={styles.ratingText}>{JOB.rating}</Text>
                <Text style={styles.reviewText}>({JOB.reviews} reviews)</Text>
                {JOB.verified && <View style={styles.verifiedBadge}><CheckCircle2 size={10} color="#34C759" /><Text style={styles.verifiedText}>Verified</Text></View>}
              </View>
            </View>
          </View>
          <Text style={styles.jobTitle}>{JOB.title}</Text>
          <View style={styles.jobMetaRow}>
            <View style={styles.metaPill}><MapPin size={12} color={Colors.textSecondary} /><Text style={styles.metaPillText}>{JOB.location}</Text></View>
            <View style={styles.metaPill}><Briefcase size={12} color={Colors.textSecondary} /><Text style={styles.metaPillText}>{JOB.type.replace("_", " ")}</Text></View>
            <View style={styles.metaPill}><DollarSign size={12} color={Colors.textSecondary} /><Text style={styles.metaPillText}>{JOB.salary}</Text></View>
          </View>
          <View style={styles.jobStats}>
            <View style={styles.statPill}><Users size={12} color={Colors.textSecondary} /><Text style={styles.statPillText}>{JOB.applicants} applicants</Text></View>
            <View style={styles.statPill}><Clock size={12} color={Colors.textSecondary} /><Text style={styles.statPillText}>{JOB.posted}</Text></View>
          </View>
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

        {/* Content */}
        {activeTab === "overview" && (
          <View style={styles.content}>
            {/* Description */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About the Role</Text>
              <Text style={styles.cardText}>{JOB.description}</Text>
            </View>

            {/* Responsibilities */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Responsibilities</Text>
              {JOB.responsibilities.map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Requirements */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Requirements</Text>
              {JOB.requirements.map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Benefits */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Benefits</Text>
              {JOB.benefits.map((item, i) => (
                <View key={i} style={styles.listItem}>
                  <CheckCircle2 size={14} color="#34C759" />
                  <Text style={styles.listText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Skills */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Required Skills</Text>
              <View style={styles.skillsRow}>
                {JOB.skills.map((s) => (
                  <View key={s} style={styles.skillChip}><Text style={styles.skillChipText}>{s}</Text></View>
                ))}
              </View>
            </View>
          </View>
        )}

        {activeTab === "company" && (
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About {JOB.company}</Text>
              <Text style={styles.cardText}>MTAA Technologies is building Africa's first mobile operating system for civic and commercial services. Founded in 2022, we serve 2M+ users across Kenya.</Text>
              <View style={styles.companyMeta}>
                <View style={styles.companyMetaItem}><Globe size={14} color={Colors.textSecondary} /><Text style={styles.companyMetaText}>mtaa.app</Text></View>
                <View style={styles.companyMetaItem}><Users size={14} color={Colors.textSecondary} /><Text style={styles.companyMetaText}>120 employees</Text></View>
                <View style={styles.companyMetaItem}><Building2 size={14} color={Colors.textSecondary} /><Text style={styles.companyMetaText}>Technology</Text></View>
              </View>
            </View>
          </View>
        )}

        {activeTab === "reviews" && (
          <View style={styles.content}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Employee Reviews</Text>
              <View style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}><Text style={styles.reviewAvatarText}>J</Text></View>
                  <View>
                    <Text style={styles.reviewName}>James K.</Text>
                    <Text style={styles.reviewRole}>Senior Engineer · 2 years</Text>
                  </View>
                  <View style={styles.reviewRating}>
                    <Star size={12} color="#FF9500" fill="#FF9500" />
                    <Text style={styles.reviewRatingText}>5.0</Text>
                  </View>
                </View>
                <Text style={styles.reviewTextBody}>"Best place I've worked in Nairobi. Great team, meaningful mission, and competitive pay."</Text>
              </View>
            </View>
          </View>
        )}

        {/* Similar Jobs */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Similar Jobs</Text>
          {SIMILAR_JOBS.map((job) => (
            <TouchableOpacity key={job.id} style={styles.similarCard}>
              <View style={styles.similarInfo}>
                <Text style={styles.similarTitle}>{job.title}</Text>
                <Text style={styles.similarCompany}>{job.company}</Text>
              </View>
              <View style={styles.similarMeta}>
                <Text style={styles.similarSalary}>{job.salary}</Text>
                <Text style={styles.similarType}>{job.type.replace("_", " ")}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.messageBtn}>
          <MessageSquare size={18} color={Colors.primary} />
          <Text style={styles.messageText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.applyBtn}>
          <Text style={styles.applyBtnText}>Apply Now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  jobHeaderCard: { backgroundColor: Colors.card, marginHorizontal: 16, marginTop: 16, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border },
  companyRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  companyLogo: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  logoText: { fontSize: 18, fontWeight: "800", color: Colors.primary },
  companyInfo: { flex: 1 },
  companyName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  ratingText: { fontSize: 13, fontWeight: "700", color: Colors.text },
  reviewText: { fontSize: 12, color: Colors.textSecondary },
  verifiedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#34C75915", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  verifiedText: { fontSize: 10, color: "#34C759", fontWeight: "700" },
  jobTitle: { fontSize: 20, fontWeight: "800", color: Colors.text, marginBottom: 12 },
  jobMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  metaPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  metaPillText: { fontSize: 12, color: Colors.textSecondary },
  jobStats: { flexDirection: "row", gap: 8 },
  statPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: Colors.background, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  statPillText: { fontSize: 12, color: Colors.textSecondary },
  tabsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginTop: 16, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  content: { paddingHorizontal: 16 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  cardText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  listItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary, marginTop: 6 },
  listText: { flex: 1, fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  skillChip: { backgroundColor: Colors.primary + "10", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  skillChipText: { fontSize: 12, color: Colors.primary, fontWeight: "500" },
  companyMeta: { marginTop: 12, gap: 8 },
  companyMetaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  companyMetaText: { fontSize: 13, color: Colors.textSecondary },
  reviewCard: { backgroundColor: Colors.background, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  reviewAvatarText: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  reviewName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  reviewRole: { fontSize: 12, color: Colors.textSecondary },
  reviewRating: { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" },
  reviewRatingText: { fontSize: 13, fontWeight: "700", color: "#FF9500" },
  reviewTextBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20, fontStyle: "italic" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 12, marginTop: 8 },
  similarCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: Colors.card, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  similarInfo: { flex: 1 },
  similarTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  similarCompany: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  similarMeta: { alignItems: "flex-end" },
  similarSalary: { fontSize: 13, fontWeight: "700", color: Colors.primary },
  similarType: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  bottomBar: { position: "absolute", bottom: 0, left: 0, right: 0, flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 24, backgroundColor: Colors.background, borderTopWidth: 1, borderTopColor: Colors.border, gap: 10 },
  messageBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.card, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: Colors.border },
  messageText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  applyBtn: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  applyBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
