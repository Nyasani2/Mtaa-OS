// @ts-nocheck
import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import {
  Search, Award, Star, TrendingUp, ChevronRight, Plus,
  CheckCircle2, Clock, Users, BookOpen, Zap, BarChart3,
  Trophy, Target, Flame
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const { width } = Dimensions.get("window");

const MY_SKILLS = [
  { id: "1", name: "React Native", level: 5, endorsements: 12, verified: true, category: "Mobile" },
  { id: "2", name: "TypeScript", level: 4, endorsements: 8, verified: true, category: "Languages" },
  { id: "3", name: "Node.js", level: 4, endorsements: 5, verified: false, category: "Backend" },
  { id: "4", name: "PostgreSQL", level: 3, endorsements: 3, verified: false, category: "Database" },
  { id: "5", name: "UI/UX Design", level: 3, endorsements: 7, verified: true, category: "Design" },
  { id: "6", name: "GraphQL", level: 3, endorsements: 2, verified: false, category: "Backend" },
];

const TRENDING_SKILLS = [
  { name: "AI/ML", growth: "+340%", demand: "Very High" },
  { name: "Rust", growth: "+180%", demand: "High" },
  { name: "Cloud Architecture", growth: "+220%", demand: "Very High" },
  { name: "Cybersecurity", growth: "+290%", demand: "Very High" },
  { name: "Blockchain", growth: "+95%", demand: "Medium" },
];

const SKILL_PATHS = [
  { id: "1", title: "Full Stack Mobile Developer", progress: 78, skills: 12, completed: 9, icon: "📱" },
  { id: "2", title: "Cloud DevOps Engineer", progress: 45, skills: 15, completed: 7, icon: "☁️" },
  { id: "3", title: "Data Scientist", progress: 20, skills: 18, completed: 4, icon: "📊" },
];

const ENDORSEMENTS = [
  { id: "1", skill: "React Native", from: "Sarah M.", role: "CTO at MTAA", date: "2 days ago", comment: "Built our entire mobile platform. Exceptional work." },
  { id: "2", skill: "TypeScript", from: "James K.", role: "Lead Engineer", date: "1 week ago", comment: "Clean, type-safe code. Production grade." },
];

export default function SkillsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("my_skills");
  const [searchQuery, setSearchQuery] = useState("");

  const TABS = [
    { id: "my_skills", label: "My Skills", icon: Award },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "paths", label: "Paths", icon: Target },
    { id: "endorsements", label: "Endorsements", icon: Users },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Skills Center</Text>
        <Text style={styles.subtitle}>Verify, grow, get endorsed</Text>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color={Colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search skills, certifications..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity style={styles.addBtn}>
          <Plus size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
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
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === "my_skills" && (
          <View>
            {/* Skill Score */}
            <View style={styles.scoreCard}>
              <View style={styles.scoreLeft}>
                <Text style={styles.scoreValue}>72</Text>
                <Text style={styles.scoreLabel}>Skill Score</Text>
              </View>
              <View style={styles.scoreRight}>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreFill, { width: "72%" }]} />
                </View>
                <Text style={styles.scoreSub}>Top 15% of React Native developers in Kenya</Text>
              </View>
            </View>

            {/* Skills List */}
            {MY_SKILLS.map((skill) => (
              <View key={skill.id} style={styles.skillCard}>
                <View style={styles.skillHeader}>
                  <View style={styles.skillNameRow}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    {skill.verified && <CheckCircle2 size={14} color="#34C759" />}
                  </View>
                  <View style={styles.levelRow}>
                    {[1,2,3,4,5].map((s) => (
                      <Star key={s} size={14} color={s <= skill.level ? "#FF9500" : Colors.border} fill={s <= skill.level ? "#FF9500" : "transparent"} />
                    ))}
                  </View>
                </View>
                <View style={styles.skillMeta}>
                  <View style={styles.metaItem}><Users size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{skill.endorsements} endorsements</Text></View>
                  <View style={styles.metaItem}><BookOpen size={12} color={Colors.textSecondary} /><Text style={styles.metaText}>{skill.category}</Text></View>
                </View>
                <View style={styles.skillActions}>
                  <TouchableOpacity style={styles.skillAction}><Text style={styles.skillActionText}>Verify</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.skillAction}><Text style={styles.skillActionText}>Endorse</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.skillAction}><Text style={styles.skillActionText}>Share</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "trending" && (
          <View>
            {TRENDING_SKILLS.map((skill) => (
              <View key={skill.name} style={styles.trendCard}>
                <View style={styles.trendHeader}>
                  <View style={styles.trendIcon}><Flame size={18} color="#FF3B30" /></View>
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendName}>{skill.name}</Text>
                    <Text style={styles.trendDemand}>{skill.demand} demand</Text>
                  </View>
                  <View style={styles.growthBadge}>
                    <TrendingUp size={12} color="#34C759" />
                    <Text style={styles.growthText}>{skill.growth}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.learnBtn}>
                  <Text style={styles.learnBtnText}>Start Learning</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === "paths" && (
          <View>
            {SKILL_PATHS.map((path) => (
              <View key={path.id} style={styles.pathCard}>
                <View style={styles.pathHeader}>
                  <Text style={styles.pathIcon}>{path.icon}</Text>
                  <View style={styles.pathInfo}>
                    <Text style={styles.pathTitle}>{path.title}</Text>
                    <Text style={styles.pathProgress}>{path.completed} of {path.skills} skills completed</Text>
                  </View>
                  <Text style={styles.pathPercent}>{path.progress}%</Text>
                </View>
                <View style={styles.pathBar}>
                  <View style={[styles.pathFill, { width: `${path.progress}%` }]} />
                </View>
                <TouchableOpacity style={styles.continueBtn}>
                  <Text style={styles.continueText}>Continue Path</Text>
                  <ChevronRight size={14} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {activeTab === "endorsements" && (
          <View>
            {ENDORSEMENTS.map((e) => (
              <View key={e.id} style={styles.endorseCard}>
                <View style={styles.endorseHeader}>
                  <View style={styles.endorseAvatar}><Text style={styles.endorseAvatarText}>{e.from.charAt(0)}</Text></View>
                  <View style={styles.endorseInfo}>
                    <Text style={styles.endorseFrom}>{e.from}</Text>
                    <Text style={styles.endorseRole}>{e.role}</Text>
                  </View>
                  <Text style={styles.endorseDate}>{e.date}</Text>
                </View>
                <View style={styles.endorseSkillBadge}>
                  <Award size={12} color={Colors.primary} />
                  <Text style={styles.endorseSkillText}>{e.skill}</Text>
                </View>
                <Text style={styles.endorseComment}>"{e.comment}"</Text>
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
  searchBox: { flexDirection: "row", alignItems: "center", backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: Colors.text },
  addBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  tabsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginTop: 12, marginBottom: 8 },
  tab: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  scoreCard: { flexDirection: "row", backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  scoreLeft: { alignItems: "center", marginRight: 20 },
  scoreValue: { fontSize: 36, fontWeight: "800", color: Colors.primary },
  scoreLabel: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  scoreRight: { flex: 1, justifyContent: "center" },
  scoreBar: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: "hidden" },
  scoreFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 4 },
  scoreSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 8 },
  skillCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  skillHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  skillNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  skillName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  levelRow: { flexDirection: "row", gap: 2 },
  skillMeta: { flexDirection: "row", gap: 16, marginTop: 10 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  skillActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  skillAction: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: "center" },
  skillActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  trendCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  trendHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  trendIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: "#FF3B3015", justifyContent: "center", alignItems: "center" },
  trendInfo: { flex: 1 },
  trendName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  trendDemand: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  growthBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#34C75915", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  growthText: { fontSize: 12, color: "#34C759", fontWeight: "700" },
  learnBtn: { marginTop: 12, backgroundColor: Colors.primary, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  learnBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  pathCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  pathHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  pathIcon: { fontSize: 24 },
  pathInfo: { flex: 1 },
  pathTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  pathProgress: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  pathPercent: { fontSize: 18, fontWeight: "800", color: Colors.primary },
  pathBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, marginTop: 12, overflow: "hidden" },
  pathFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 3 },
  continueBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 12, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  continueText: { fontSize: 13, color: Colors.primary, fontWeight: "600" },
  endorseCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  endorseHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  endorseAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  endorseAvatarText: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  endorseInfo: { flex: 1 },
  endorseFrom: { fontSize: 14, fontWeight: "600", color: Colors.text },
  endorseRole: { fontSize: 12, color: Colors.textSecondary },
  endorseDate: { fontSize: 11, color: Colors.textSecondary },
  endorseSkillBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: Colors.primary + "10", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start", marginTop: 10 },
  endorseSkillText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  endorseComment: { fontSize: 13, color: Colors.textSecondary, marginTop: 10, fontStyle: "italic", lineHeight: 20 },
});
