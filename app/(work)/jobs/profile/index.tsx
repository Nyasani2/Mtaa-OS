// @ts-nocheck
import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import {
  User, Briefcase, MapPin, Mail, Phone, Globe, Linkedin,
  Github, Award, Star, Edit3, Save, ChevronRight, Camera,
  FileText, Share2, Download, QrCode
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const SKILLS = [
  { name: "React Native", level: 5, verified: true },
  { name: "TypeScript", level: 4, verified: true },
  { name: "Node.js", level: 4, verified: false },
  { name: "UI/UX Design", level: 3, verified: true },
  { name: "PostgreSQL", level: 3, verified: false },
];

const EXPERIENCE = [
  { id: "1", role: "Senior Mobile Developer", company: "MTAA Technologies", duration: "2022 - Present", type: "full_time" },
  { id: "2", role: "Frontend Engineer", company: "Safaricom Digital", duration: "2020 - 2022", type: "full_time" },
];

const EDUCATION = [
  { id: "1", degree: "BSc. Computer Science", institution: "University of Nairobi", year: "2016 - 2020" },
];

const CERTIFICATIONS = [
  { id: "1", name: "AWS Certified Developer", issuer: "Amazon Web Services", year: "2023", verified: true },
  { id: "2", name: "Google Mobile Web Specialist", issuer: "Google", year: "2022", verified: true },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

  const SECTIONS = [
    { id: "overview", label: "Overview" },
    { id: "experience", label: "Experience" },
    { id: "education", label: "Education" },
    { id: "skills", label: "Skills" },
    { id: "portfolio", label: "Portfolio" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronRight size={24} color={Colors.text} style={{ transform: [{ rotate: "180deg" }] }} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Opportunity Profile</Text>
          <TouchableOpacity onPress={() => setEditMode(!editMode)}>
            {editMode ? <Save size={20} color={Colors.primary} /> : <Edit3 size={20} color={Colors.text} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <User size={40} color={Colors.textSecondary} />
            <TouchableOpacity style={styles.cameraBtn}>
              <Camera size={14} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>Kevin Nyasani</Text>
            <Text style={styles.headline}>Senior React Native Developer</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color={Colors.textSecondary} />
              <Text style={styles.locationText}>Nairobi, Kenya</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>85%</Text>
            <Text style={styles.statLabel}>Profile Score</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <Share2 size={14} color={Colors.primary} />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <Download size={14} color={Colors.primary} />
            <Text style={styles.actionText}>Export CV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <QrCode size={14} color={Colors.primary} />
            <Text style={styles.actionText}>QR Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sectionTabs}>
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.sectionTab, activeSection === s.id && styles.sectionTabActive]}
            onPress={() => setActiveSection(s.id)}
          >
            <Text style={[styles.sectionTabText, activeSection === s.id && styles.sectionTabTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {activeSection === "overview" && (
          <View>
            {/* About */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>About</Text>
              <Text style={styles.aboutText}>
                Passionate mobile developer with 5+ years building production apps for the African market.
                Specialized in React Native, TypeScript, and cross-platform architecture.
                Led teams of 4-8 engineers across fintech, logistics, and civic tech sectors.
              </Text>
            </View>

            {/* Contact */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Contact</Text>
              <View style={styles.contactRow}><Mail size={14} color={Colors.textSecondary} /><Text style={styles.contactText}>kevin@mtaa.app</Text></View>
              <View style={styles.contactRow}><Phone size={14} color={Colors.textSecondary} /><Text style={styles.contactText}>+254 712 345 678</Text></View>
              <View style={styles.contactRow}><Globe size={14} color={Colors.textSecondary} /><Text style={styles.contactText}>kevinnyasani.dev</Text></View>
              <View style={styles.contactRow}><Linkedin size={14} color={Colors.textSecondary} /><Text style={styles.contactText}>linkedin.com/in/kevinnyasani</Text></View>
            </View>
          </View>
        )}

        {activeSection === "experience" && (
          <View>
            {EXPERIENCE.map((exp) => (
              <View key={exp.id} style={styles.card}>
                <View style={styles.expHeader}>
                  <View style={styles.expIcon}><Briefcase size={16} color={Colors.primary} /></View>
                  <View style={styles.expInfo}>
                    <Text style={styles.expRole}>{exp.role}</Text>
                    <Text style={styles.expCompany}>{exp.company}</Text>
                    <Text style={styles.expDuration}>{exp.duration}</Text>
                  </View>
                </View>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn}>
              <Text style={styles.addBtnText}>+ Add Experience</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeSection === "education" && (
          <View>
            {EDUCATION.map((edu) => (
              <View key={edu.id} style={styles.card}>
                <View style={styles.expHeader}>
                  <View style={styles.expIcon}><Award size={16} color={Colors.primary} /></View>
                  <View style={styles.expInfo}>
                    <Text style={styles.expRole}>{edu.degree}</Text>
                    <Text style={styles.expCompany}>{edu.institution}</Text>
                    <Text style={styles.expDuration}>{edu.year}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeSection === "skills" && (
          <View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Skills & Endorsements</Text>
              {SKILLS.map((skill) => (
                <View key={skill.name} style={styles.skillRow}>
                  <View style={styles.skillInfo}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    <View style={styles.stars}>
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={12} color={s <= skill.level ? "#FF9500" : Colors.border} fill={s <= skill.level ? "#FF9500" : "transparent"} />
                      ))}
                    </View>
                  </View>
                  {skill.verified && (
                    <View style={styles.verifiedChip}>
                      <Award size={10} color="#34C759" />
                      <Text style={styles.verifiedText}>Verified</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/(work)/jobs/skills" as any)}>
              <Text style={styles.addBtnText}>+ Add Skills</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeSection === "portfolio" && (
          <View>
            <TouchableOpacity style={styles.card} onPress={() => router.push("/(work)/jobs/portfolio" as any)}>
              <Text style={styles.cardTitle}>Portfolio</Text>
              <Text style={styles.aboutText}>3 projects showcased. Tap to view full portfolio.</Text>
              <View style={styles.portfolioPreview}>
                <View style={styles.portfolioThumb}><Text style={styles.thumbText}>MTAA OS</Text></View>
                <View style={styles.portfolioThumb}><Text style={styles.thumbText}>Safaricom App</Text></View>
                <View style={styles.portfolioThumb}><Text style={styles.thumbText}>Twiga Portal</Text></View>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: Colors.text },
  profileCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: Colors.border },
  avatarSection: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center", position: "relative" },
  cameraBtn: { position: "absolute", bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: Colors.card },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: "800", color: Colors.text },
  headline: { fontSize: 14, color: Colors.primary, marginTop: 2, fontWeight: "600" },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  locationText: { fontSize: 12, color: Colors.textSecondary },
  statsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  stat: { alignItems: "center", flex: 1 },
  statValue: { fontSize: 20, fontWeight: "800", color: Colors.text },
  statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.background, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  actionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  sectionTabs: { paddingHorizontal: 16, gap: 8, paddingVertical: 12 },
  sectionTab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  sectionTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  sectionTabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },
  sectionTabTextActive: { color: "#fff" },
  content: { paddingHorizontal: 16, marginTop: 8 },
  card: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  cardTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  aboutText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  contactText: { fontSize: 13, color: Colors.textSecondary },
  expHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  expIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  expInfo: { flex: 1 },
  expRole: { fontSize: 15, fontWeight: "700", color: Colors.text },
  expCompany: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  expDuration: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  addBtn: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, alignItems: "center", borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed", marginBottom: 12 },
  addBtnText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  skillRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  skillInfo: { flex: 1 },
  skillName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  stars: { flexDirection: "row", gap: 2, marginTop: 4 },
  verifiedChip: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#34C75915", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  verifiedText: { fontSize: 10, color: "#34C759", fontWeight: "700" },
  portfolioPreview: { flexDirection: "row", gap: 8, marginTop: 12 },
  portfolioThumb: { flex: 1, height: 80, borderRadius: 10, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  thumbText: { fontSize: 11, color: Colors.primary, fontWeight: "600", textAlign: "center" },
});
