import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useJobsStore } from "@/lib/jobs/hooks/use-jobs-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { ApplicationCard } from "@/lib/jobs/components/ApplicationCard";

export default function ApplicationsScreen() {
  const { user } = useAuthStore();
  const { applications, refreshApplications } = useJobsStore();

  useEffect(() => { if (user) refreshApplications(user.id); }, [user]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Applications</Text>
      {applications.map((app) => <ApplicationCard key={app.id} app={app} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  title: { fontSize: 24, fontWeight: "bold", color: "white", paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
});
