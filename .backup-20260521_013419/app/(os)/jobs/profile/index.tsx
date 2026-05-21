import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useJobsStore } from "@/lib/jobs/hooks/use-jobs-store";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function ProfileScreen() {
  const { user } = useAuthStore();
  const { profile, refreshProfile } = useJobsStore();

  useEffect(() => { if (user) refreshProfile(user.id); }, [user]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Work Profile</Text>
      {profile ? (
        <View style={styles.card}>
          <Text style={styles.headline}>{profile.headline}</Text>
          <Text style={styles.summary}>{profile.summary}</Text>
          <View style={styles.skills}>
            {profile.skills.map((s) => <View key={s} style={styles.skill}><Text style={styles.skillText}>{s}</Text></View>)}
          </View>
        </View>
      ) : (
        <Text style={styles.empty}>No work profile yet. Create one to apply for jobs.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  title: { fontSize: 24, fontWeight: "bold", color: "white", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  card: { backgroundColor: "#1E293B", borderRadius: 16, padding: 20, margin: 16 },
  headline: { color: "white", fontSize: 18, fontWeight: "600" },
  summary: { color: "#94A3B8", fontSize: 14, marginTop: 8, lineHeight: 20 },
  skills: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  skill: { backgroundColor: "#0F172A", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  skillText: { color: "#94A3B8", fontSize: 12 },
  empty: { color: "#64748B", textAlign: "center", marginTop: 40 },
});
