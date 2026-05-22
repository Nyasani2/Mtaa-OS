"use client";

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useTransport } from "../controllers/useTransport";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { MapPin, AlertTriangle, Send } from "lucide-react-native";

export function IncidentReport() {
  const { user } = useAuth();
  const { reportIncident, isLoading, error } = useTransport();

  const [type, setType] = useState<"accident" | "breakdown" | "hazard" | "traffic_jam" | "road_closure">("accident");
  const [location, setLocation] = useState("");
  const [county, setCounty] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "high" | "critical">("medium");

  const types = [
    { key: "accident", label: "Accident", color: "#DC2626" },
    { key: "breakdown", label: "Breakdown", color: "#F59E0B" },
    { key: "hazard", label: "Hazard", color: "#EA580C" },
    { key: "traffic_jam", label: "Traffic Jam", color: "#7C3AED" },
    { key: "road_closure", label: "Road Closure", color: "#0891B2" },
  ];

  const severities = [
    { key: "low", label: "Low", color: "#059669" },
    { key: "medium", label: "Medium", color: "#F59E0B" },
    { key: "high", label: "High", color: "#EA580C" },
    { key: "critical", label: "Critical", color: "#DC2626" },
  ];

  const handleSubmit = async () => {
    if (!user?.id || !location.trim() || !county.trim() || !description.trim()) return;
    try {
      await reportIncident({
        reporter_id: user.id,
        type,
        location,
        county,
        description,
        severity,
        status: "reported",
      });
      router.back();
    } catch (err) {
      // error handled in store
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report Road Incident</Text>

      <Text style={styles.sectionLabel}>Incident Type</Text>
      <View style={styles.typeRow}>
        {types.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.typeChip, type === t.key && { backgroundColor: t.color + "20", borderColor: t.color }]}
            onPress={() => setType(t.key as any)}
          >
            <Text style={[styles.typeChipText, type === t.key && { color: t.color, fontWeight: "700" }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Severity</Text>
      <View style={styles.severityRow}>
        {severities.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.severityChip, severity === s.key && { backgroundColor: s.color + "20", borderColor: s.color }]}
            onPress={() => setSeverity(s.key as any)}
          >
            <Text style={[styles.severityChipText, severity === s.key && { color: s.color, fontWeight: "700" }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Location</Text>
      <View style={styles.inputBox}>
        <MapPin size={18} color="#64748B" />
        <TextInput style={styles.input} placeholder="Street / Road name" value={location} onChangeText={setLocation} />
      </View>

      <Text style={styles.sectionLabel}>County</Text>
      <View style={styles.inputBox}>
        <TextInput style={styles.input} placeholder="e.g. Nairobi" value={county} onChangeText={setCounty} />
      </View>

      <Text style={styles.sectionLabel}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe what happened..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <TouchableOpacity
        style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading}
      >
        <Send size={18} color="#FFFFFF" />
        <Text style={styles.submitButtonText}>
          {isLoading ? "Submitting..." : "Submit Report"}
        </Text>
      </TouchableOpacity>

      {error && (
        <View style={styles.errorBox}>
          <AlertTriangle size={16} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#1E293B", marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "600", color: "#475569", marginTop: 16, marginBottom: 8 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  typeChipText: { fontSize: 13, color: "#64748B" },
  severityRow: { flexDirection: "row", gap: 8 },
  severityChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  severityChipText: { fontSize: 13, color: "#64748B" },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  input: { flex: 1, fontSize: 15, color: "#1E293B" },
  textArea: { height: 100, textAlignVertical: "top", paddingTop: 10 },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#DC2626",
    marginTop: 24,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, padding: 12, backgroundColor: "#FEE2E2", borderRadius: 8 },
  errorText: { color: "#DC2626", fontSize: 14, flex: 1 },
});
