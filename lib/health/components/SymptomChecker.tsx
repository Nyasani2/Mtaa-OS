"use client";

import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";

export function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [result, setResult] = useState<any>(null);

  const checkSymptoms = () => {
    // Stub — would call AI service
    setResult({ urgency: "low", recommendation: "Rest and hydrate" });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Symptom Checker</Text>
      <TextInput
        style={styles.input}
        value={symptoms}
        onChangeText={setSymptoms}
        placeholder="Describe your symptoms..."
        placeholderTextColor="#9CA3AF"
        multiline
      />
      <TouchableOpacity onPress={checkSymptoms} style={styles.button}>
        <Text style={styles.buttonText}>Check Symptoms</Text>
      </TouchableOpacity>
      {result && (
        <View style={styles.result}>
          <Text style={styles.urgency}>Urgency: {result.urgency}</Text>
          <Text style={styles.recommendation}>{result.recommendation}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#0F0F0F" },
  title: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginBottom: 16 },
  input: { backgroundColor: "#1F1F1F", color: "#FFFFFF", padding: 16, borderRadius: 12, minHeight: 100, textAlignVertical: "top" },
  button: { backgroundColor: "#2563eb", padding: 16, borderRadius: 12, marginTop: 16, alignItems: "center" },
  buttonText: { color: "#FFFFFF", fontWeight: "600" },
  result: { backgroundColor: "#1F1F1F", padding: 16, borderRadius: 12, marginTop: 16 },
  urgency: { fontSize: 16, fontWeight: "600", color: "#FFFFFF" },
  recommendation: { fontSize: 14, color: "#9CA3AF", marginTop: 8 },
});
