import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, ScrollView } from "react-native";
import { useJobsStore } from "@/lib/jobs/hooks/use-jobs-store";
import { useAuthStore } from "@/lib/stores/auth-store";
import { JobCard } from "@/lib/jobs/components/JobCard";

export default function SearchScreen() {
  const { user } = useAuthStore();
  const { jobs, refreshJobs, apply } = useJobsStore();
  const [search, setSearch] = useState("");

  const filtered = jobs.filter((j) => j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()) || j.skills.some((s) => s.toLowerCase().includes(search.toLowerCase())));

  return (
    <View style={styles.container}>
      <TextInput style={styles.search} placeholder="Search jobs, companies, skills..." placeholderTextColor="#64748B" value={search} onChangeText={setSearch} />
      <ScrollView>
        {filtered.map((job) => <JobCard key={job.id} job={job} onApply={() => user && apply(job.id, user.id)} />)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816" },
  search: { backgroundColor: "#1E293B", borderRadius: 12, padding: 14, margin: 16, color: "white", fontSize: 15 },
});
