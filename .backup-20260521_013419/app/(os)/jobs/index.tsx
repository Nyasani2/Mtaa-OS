import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useJobsStore } from "@/lib/jobs/hooks/use-jobs-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { JobCard } from "@/lib/jobs/components/JobCard";
import { ApplicationCard } from "@/lib/jobs/components/ApplicationCard";

export default function JobsHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { jobs, applications, refreshJobs, refreshApplications, apply } = useJobsStore();

  useEffect(() => {
    refreshJobs();
    if (user) refreshApplications(user.id);
  }, [user]);

  const actions = [
    { label: "Find Jobs", icon: "search", route: "/(os)/jobs/search", color: "#6366F1" },
    { label: "Applications", icon: "document", route: "/(os)/jobs/applications", color: "#10B981" },
    { label: "Profile", icon: "person", route: "/(os)/jobs/profile", color: "#F59E0B" },
    { label: "Post Job", icon: "add", route: "/(os)/jobs/post", color: "#EC4899" },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Jobs & Work</Text>
        <Text style={styles.subtitle}>Find work or hire talent</Text>
      </View>

      <View style={styles.actionsRow}>
        {actions.map((a) => (
          <TouchableOpacity key={a.label} style={styles.actionBtn} onPress={() => router.push(a.route as any)}>
            <View style={[styles.actionIcon, { backgroundColor: a.color + "20" }]}>
              <Ionicons name={a.icon as any} size={22} color={a.color} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Featured Jobs</Text>
      {jobs.slice(0, 3).map((job) => (
        <JobCard key={job.id} job={job} onApply={() => user && apply(job.id, user.id)} />
      ))}

      {applications.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>My Applications</Text>
          {applications.slice(0, 3).map((app) => <ApplicationCard key={app.id} app={app} />)}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "white" },
  subtitle: { color: "#94A3B8", fontSize: 14, marginTop: 4 },
  actionsRow: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 16, marginBottom: 20 },
  actionBtn: { alignItems: "center" },
  actionIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  actionLabel: { color: "white", fontSize: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "white", marginTop: 24, marginBottom: 12, paddingHorizontal: 20 },
});
