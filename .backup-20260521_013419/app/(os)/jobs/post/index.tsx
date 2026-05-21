import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useJobsStore } from "@/lib/jobs/hooks/use-jobs-store";

export default function PostScreen() {
  const router = useRouter();
  const { refreshJobs } = useJobsStore();
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [salary, setSalary] = useState("");

  const handlePost = async () => {
    Alert.alert("Posted", "Job posted successfully");
    router.back();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Post a Job</Text>
      <TextInput style={styles.input} placeholder="Job Title" placeholderTextColor="#64748B" value={title} onChangeText={setTitle} />
      <TextInput style={styles.input} placeholder="Company" placeholderTextColor="#64748B" value={company} onChangeText={setCompany} />
      <TextInput style={styles.input} placeholder="Salary Range" placeholderTextColor="#64748B" value={salary} onChangeText={setSalary} />
      <TouchableOpacity style={styles.button} onPress={handlePost}>
        <Text style={styles.buttonText}>Post Job</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#050816", padding: 20 },
  title: { fontSize: 24, fontWeight: "bold", color: "white", marginTop: 60, marginBottom: 20 },
  input: { backgroundColor: "#1E293B", borderRadius: 12, padding: 16, color: "white", fontSize: 16, marginBottom: 12 },
  button: { backgroundColor: "#6366F1", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 20 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
});
