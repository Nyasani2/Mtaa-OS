// @ts-nocheck
import React from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from "react-native";
import {
  Video, Mic, Calendar, Clock, FileText, CheckCircle,
  ChevronRight, MessageSquare, ArrowLeft, Star,
  Monitor, Headphones
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";

const INTERVIEWS = [
  { id: "1", type: "video", title: "Senior React Native Developer", company: "MTAA Technologies", date: "2024-11-25", time: "10:00 AM", duration: "45 min", status: "scheduled", meetingUrl: "https://meet.mtaa.app/abc123" },
  { id: "2", type: "audio", title: "UI/UX Designer", company: "Safaricom Digital", date: "2024-11-28", time: "2:00 PM", duration: "30 min", status: "completed", feedback: "Strong portfolio, move to next round" },
  { id: "3", type: "video", title: "DevOps Engineer", company: "Andela Kenya", date: "2024-12-02", time: "11:00 AM", duration: "60 min", status: "scheduled", meetingUrl: "https://meet.mtaa.app/def456" },
];

const PAST_INTERVIEWS = [
  { id: "4", type: "video", title: "Frontend Developer", company: "Twiga Foods", date: "2024-10-15", status: "completed", feedback: "Good technical skills, culture fit concern" },
];

export default function InterviewsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Interview Center</Text>
        <Text style={styles.subtitle}>Schedule, join, review</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Upcoming */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming Interviews</Text>
          {INTERVIEWS.filter((i: any) => i.status === "scheduled").map((interview) => (
            <View key={interview.id} style={styles.interviewCard}>
              <View style={styles.interviewHeader}>
                <View style={[styles.typeIcon, { backgroundColor: interview.type === "video" ? "#0A84FF15" : "#34C75915" }]}>
                  {interview.type === "video" ? <Video size={18} color="#0A84FF" /> : <Mic size={18} color="#34C759" />}
                </View>
                <View style={styles.interviewInfo}>
                  <Text style={styles.interviewTitle}>{interview.title}</Text>
                  <Text style={styles.interviewCompany}>{interview.company}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: "#0A84FF15" }]}>
                  <Text style={[styles.statusText, { color: "#0A84FF" }]}>{interview.status}</Text>
                </View>
              </View>
              <View style={styles.interviewMeta}>
                <View style={styles.metaItem}><Calendar size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{interview.date}</Text></View>
                <View style={styles.metaItem}><Clock size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{interview.time}</Text></View>
                <View style={styles.metaItem}><FileText size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{interview.duration}</Text></View>
              </View>
              <TouchableOpacity style={styles.joinButton}>
                <Video size={16} color="#fff" />
                <Text style={styles.joinText}>Join Interview</Text>
              </TouchableOpacity>
              <View style={styles.interviewActions}>
                <TouchableOpacity style={styles.interviewAction}><Text style={styles.interviewActionText}>Reschedule</Text></TouchableOpacity>
                <TouchableOpacity style={styles.interviewAction}><Text style={styles.interviewActionText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.interviewAction}><Text style={styles.interviewActionText}>Notes</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Completed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Completed</Text>
          {INTERVIEWS.filter((i: any) => i.status === "completed").concat(PAST_INTERVIEWS).map((interview) => (
            <View key={interview.id} style={[styles.interviewCard, { opacity: 0.8 }]}>
              <View style={styles.interviewHeader}>
                <View style={[styles.typeIcon, { backgroundColor: "#34C75915" }]}>
                  {interview.type === "video" ? <Video size={18} color="#34C759" /> : <Mic size={18} color="#34C759" />}
                </View>
                <View style={styles.interviewInfo}>
                  <Text style={styles.interviewTitle}>{interview.title}</Text>
                  <Text style={styles.interviewCompany}>{interview.company}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: "#34C75915" }]}>
                  <Text style={[styles.statusText, { color: "#34C759" }]}>Done</Text>
                </View>
              </View>
              <View style={styles.interviewMeta}>
                <View style={styles.metaItem}><Calendar size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{interview.date}</Text></View>
                <View style={styles.metaItem}><Clock size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{interview.time || "Completed"}</Text></View>
              </View>
              {interview.feedback && (
                <View style={styles.feedbackCard}>
                  <CheckCircle size={14} color="#34C759" />
                  <Text style={styles.feedbackText}>{interview.feedback}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

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
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  interviewCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  interviewHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  typeIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  interviewInfo: { flex: 1 },
  interviewTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  interviewCompany: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  interviewMeta: { flexDirection: "row", gap: 16, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  joinButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#0A84FF", marginTop: 12, paddingVertical: 12, borderRadius: 10 },
  joinText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  interviewActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  interviewAction: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  interviewActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  feedbackCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#34C75908", padding: 12, borderRadius: 10, marginTop: 12 },
  feedbackText: { flex: 1, fontSize: 13, color: "#34C759" },
});
