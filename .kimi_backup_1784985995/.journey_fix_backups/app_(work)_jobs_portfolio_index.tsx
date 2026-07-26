import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, Image
} from "react-native";
import { useRouter } from "expo-router";
import {
  Plus, Star, ExternalLink, Share2, Download, QrCode,
  Edit3, Eye, Heart, MessageSquare, ChevronRight,
  FileText, Image as ImageIcon, Video, Link2
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const PROJECTS = [
  {
    id: "1",
    title: "MTAA OS Mobile Platform",
    description: "Full-stack mobile operating system for African civic and commercial services. Built with React Native, Expo, Supabase.",
    skills: ["React Native", "TypeScript", "Supabase", "Expo"],
    views: 1240,
    likes: 89,
    comments: 23,
    featured: true,
    type: "mobile",
    color: "#0A84FF",
  },
  {
    id: "2",
    title: "Safaricom Digital Wallet",
    description: "Mobile wallet integration with M-Pesa, supporting payments, transfers, and bill payments for 5M+ users.",
    skills: ["React Native", "Node.js", "M-Pesa API", "PostgreSQL"],
    views: 892,
    likes: 67,
    comments: 15,
    featured: false,
    type: "mobile",
    color: "#34C759",
  },
  {
    id: "3",
    title: "Twiga Foods Supplier Portal",
    description: "B2B supplier management platform connecting 10,000+ farmers to urban retailers across Kenya.",
    skills: ["Next.js", "TypeScript", "GraphQL", "AWS"],
    views: 654,
    likes: 45,
    comments: 8,
    featured: false,
    type: "web",
    color: "#FF9500",
  },
];

const TEMPLATES = [
  { id: "1", name: "Developer Portfolio", description: "Showcase code, projects, GitHub", icon: "</>" },
  { id: "2", name: "Designer Portfolio", description: "Visual work, case studies", icon: "🎨" },
  { id: "3", name: "Consultant Portfolio", description: "Projects, testimonials, metrics", icon: "📊" },
];

export default function PortfolioScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("projects");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Portfolio Builder</Text>
        <Text style={styles.subtitle}>Showcase your best work</Text>
      </View>

      <View style={styles.tabsRow}>
        {[
          { id: "projects", label: "Projects" },
          { id: "templates", label: "Templates" },
          { id: "analytics", label: "Analytics" },
        ].map((tab) => (
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
        {activeTab === "projects" && (
          <View>
            <TouchableOpacity style={styles.addProjectBtn}>
              <Plus size={20} color={Colors.primary} />
              <Text style={styles.addProjectText}>Add New Project</Text>
            </TouchableOpacity>

            {PROJECTS.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={[styles.projectThumb, { backgroundColor: project.color + "15" }]}>
                  <Text style={[styles.projectThumbText, { color: project.color }]}>{project.title.charAt(0)}</Text>
                  {project.featured && (
                    <View style={styles.featuredBadge}>
                      <Star size={10} color="#FF9500" fill="#FF9500" />
                      <Text style={styles.featuredText}>Featured</Text>
                    </View>
                  )}
                </View>
                <View style={styles.projectContent}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <Text style={styles.projectDesc} numberOfLines={2}>{project.description}</Text>
                  <View style={styles.skillsRow}>
                    {project.skills.map((s) => (
                      <View key={s} style={styles.skillChip}><Text style={styles.skillChipText}>{s}</Text></View>
                    ))}
                  </View>
                  <View style={styles.projectStats}>
                    <View style={styles.statItem}><Eye size={12} color={Colors.textSecondary} /><Text style={styles.statText}>{project.views}</Text></View>
                    <View style={styles.statItem}><Heart size={12} color={Colors.textSecondary} /><Text style={styles.statText}>{project.likes}</Text></View>
                    <View style={styles.statItem}><MessageSquare size={12} color={Colors.textSecondary} /><Text style={styles.statText}>{project.comments}</Text></View>
                  </View>
                </View>
                <View style={styles.projectActions}>
                  <TouchableOpacity style={styles.projAction}><Edit3 size={14} color={Colors.primary} /></TouchableOpacity>
                  <TouchableOpacity style={styles.projAction}><Share2 size={14} color={Colors.primary} /></TouchableOpacity>
                  <TouchableOpacity style={styles.projAction}><ExternalLink size={14} color={Colors.primary} /></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "templates" && (
          <View>
            {TEMPLATES.map((t) => (
              <TouchableOpacity key={t.id} style={styles.templateCard}>
                <View style={styles.templateIcon}><Text style={styles.templateIconText}>{t.icon}</Text></View>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{t.name}</Text>
                  <Text style={styles.templateDesc}>{t.description}</Text>
                </View>
                <ChevronRight size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {activeTab === "analytics" && (
          <View>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsTitle}>Portfolio Analytics</Text>
              <View style={styles.analyticsGrid}>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>2,786</Text>
                  <Text style={styles.analyticsLabel}>Total Views</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>201</Text>
                  <Text style={styles.analyticsLabel}>Likes</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>46</Text>
                  <Text style={styles.analyticsLabel}>Comments</Text>
                </View>
                <View style={styles.analyticsItem}>
                  <Text style={styles.analyticsValue}>12</Text>
                  <Text style={styles.analyticsLabel}>Shares</Text>
                </View>
              </View>
            </View>

            <View style={styles.exportCard}>
              <Text style={styles.exportTitle}>Export Portfolio</Text>
              <View style={styles.exportActions}>
                <TouchableOpacity style={styles.exportBtn}><Download size={16} color={Colors.primary} /><Text style={styles.exportText}>PDF</Text></TouchableOpacity>
                <TouchableOpacity style={styles.exportBtn}><Link2 size={16} color={Colors.primary} /><Text style={styles.exportText}>Link</Text></TouchableOpacity>
                <TouchableOpacity style={styles.exportBtn}><QrCode size={16} color={Colors.primary} /><Text style={styles.exportText}>QR Code</Text></TouchableOpacity>
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
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  tabsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  addProjectBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border, borderStyle: "dashed" },
  addProjectText: { fontSize: 14, color: Colors.primary, fontWeight: "600" },
  projectCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  projectThumb: { height: 120, borderRadius: 12, justifyContent: "center", alignItems: "center", marginBottom: 12, position: "relative" },
  projectThumbText: { fontSize: 32, fontWeight: "800" },
  featuredBadge: { position: "absolute", top: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FF950015", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  featuredText: { fontSize: 10, color: "#FF9500", fontWeight: "700" },
  projectContent: { marginBottom: 12 },
  projectTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  projectDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  skillsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
  skillChip: { backgroundColor: Colors.primary + "10", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  skillChipText: { fontSize: 11, color: Colors.primary, fontWeight: "500" },
  projectStats: { flexDirection: "row", gap: 16, marginTop: 12 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, color: Colors.textSecondary },
  projectActions: { flexDirection: "row", gap: 8 },
  projAction: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  templateCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  templateIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  templateIconText: { fontSize: 20 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  templateDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  analyticsCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  analyticsTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 16 },
  analyticsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  analyticsItem: { width: (width - 72) / 2, backgroundColor: Colors.background, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: Colors.border },
  analyticsValue: { fontSize: 22, fontWeight: "800", color: Colors.text },
  analyticsLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  exportCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border },
  exportTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  exportActions: { flexDirection: "row", gap: 8 },
  exportBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: Colors.background, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border },
  exportText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
});
