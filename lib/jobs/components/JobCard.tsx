import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Job } from "@/lib/jobs/types";

interface Props {
  job: Job;
  onApply: () => void;
}

export function JobCard({ job, onApply }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.company}>{job.company} • {job.location}</Text>
        </View>
        <View style={[styles.typeBadge, { backgroundColor: job.type === "gig" ? "#F59E0B20" : "#6366F120" }]}>
          <Text style={[styles.typeText, { color: job.type === "gig" ? "#F59E0B" : "#6366F1" }]}>{job.type.replace("_", " ").toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.salary}>${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} / {job.salary.period}</Text>
      <Text style={styles.desc} numberOfLines={2}>{job.description}</Text>
      <View style={styles.skills}>
        {job.skills.slice(0, 3).map((s) => <View key={s} style={styles.skill}><Text style={styles.skillText}>{s}</Text></View>)}
      </View>
      <View style={styles.footer}>
        <Text style={styles.meta}>{job.applications} applications</Text>
        <TouchableOpacity style={styles.applyBtn} onPress={onApply}>
          <Text style={styles.applyText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#1E293B", borderRadius: 12, padding: 16, marginBottom: 10, marginHorizontal: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  title: { color: "white", fontSize: 16, fontWeight: "600" },
  company: { color: "#94A3B8", fontSize: 13, marginTop: 2 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  typeText: { fontSize: 10, fontWeight: "bold" },
  salary: { color: "#10B981", fontSize: 14, fontWeight: "600", marginBottom: 6 },
  desc: { color: "#94A3B8", fontSize: 13, marginBottom: 8 },
  skills: { flexDirection: "row", gap: 6, marginBottom: 10 },
  skill: { backgroundColor: "#0F172A", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  skillText: { color: "#94A3B8", fontSize: 11 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  meta: { color: "#64748B", fontSize: 12 },
  applyBtn: { backgroundColor: "#6366F1", paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8 },
  applyText: { color: "white", fontSize: 13, fontWeight: "bold" },
});
