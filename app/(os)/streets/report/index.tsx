import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from "react-native";

export default function ReportScreen() {
  const [issue, setIssue] = useState("");
  const [location, setLocation] = useState("");
  const handleSubmit = () => { Alert.alert("Submitted", "Issue reported to city services"); };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Report Issue</Text>
      <TextInput style={styles.input} placeholder="Issue type (pothole, graffiti, etc)" placeholderTextColor="#64748B" value={issue} onChangeText={setIssue} />
      <TextInput style={styles.input} placeholder="Location" placeholderTextColor="#64748B" value={location} onChangeText={setLocation} />
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Report</Text>
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
