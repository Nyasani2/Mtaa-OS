"use client";

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useAgriculture } from "../controllers/useAgriculture";
import { useAuth } from "@/hooks/useAuth";
import { router } from "expo-router";
import { Bug, MapPin, Send } from "lucide-react-native";

export function PestReportForm() {
  const { user } = useAuth();
  const { reportPestDisease, isLoading, error } = useAgriculture();

  const [type, setType] = useState<"pest" | "disease" | "weed" | "invasive_species">("pest");
  const [pestName, setPestName] = useState("");
  const [affectedCrop, setAffectedCrop] = useState("");
  const [county, setCounty] = useState("");
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<"low" | "moderate" | "high" | "severe">("moderate");
  const [areaAffected, setAreaAffected] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [spreadStatus, setSpreadStatus] = useState<"contained" | "spreading" | "outbreak">("spreading");

  const types = [
    { key: "pest", label: "Pest", color: "#DC2626" },
    { key: "disease", label: "Disease", color: "#7C3AED" },
    { key: "weed", label: "Weed", color: "#059669" },
    { key: "invasive_species", label: "Invasive", color: "#EA580C" },
  ];

  const severities = [
    { key: "low", label: "Low", color: "#059669" },
    { key: "moderate", label: "Moderate", color: "#F59E0B" },
    { key: "high", label: "High", color: "#EA580C" },
    { key: "severe", label: "Severe", color: "#DC2626" },
  ];

  const spreads = [
    { key: "contained", label: "Contained", color: "#059669" },
    { key: "spreading", label: "Spreading", color: "#F59E0B" },
    { key: "outbreak", label: "Outbreak", color: "#DC2626" },
  ];

  const handleSubmit = async () => {
    if (!user?.id || !pestName.trim() || !affectedCrop.trim() || !county.trim()) return;
    try {
      await reportPestDisease({
        reporter_id: user.id,
        pest_disease_name: pestName,
        type,
        affected_crop: affectedCrop,
        county,
        location: location || county,
        severity,
        area_affected_hectares: parseFloat(areaAffected) || 0,
        symptoms,
        spread_status: spreadStatus,
        status: "reported",
      });
      router.back();
    } catch (err) {
      // handled in store
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Report Pest / Disease</Text>

      <Text style={styles.sectionLabel}>Type</Text>
      <View style={styles.chipRow}>
        {types.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.chip, type === t.key && { backgroundColor: t.color + "20", borderColor: t.color }]}
            onPress={() => setType(t.key as any)}
          >
            <Text style={[styles.chipText, type === t.key && { color: t.color, fontWeight: "700" }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Pest / Disease Name</Text>
      <TextInput style={styles.input} placeholder="e.g. Fall Armyworm" value={pestName} onChangeText={setPestName} />

      <Text style={styles.sectionLabel}>Affected Crop</Text>
      <TextInput style={styles.input} placeholder="e.g. Maize" value={affectedCrop} onChangeText={setAffectedCrop} />

      <Text style={styles.sectionLabel}>County</Text>
      <TextInput style={styles.input} placeholder="e.g. Uasin Gishu" value={county} onChangeText={setCounty} />

      <Text style={styles.sectionLabel}>Location / Farm</Text>
      <View style={styles.inputBox}>
        <MapPin size={18} color="#64748B" />
        <TextInput style={styles.input} placeholder="Specific location" value={location} onChangeText={setLocation} />
      </View>

      <Text style={styles.sectionLabel}>Severity</Text>
      <View style={styles.chipRow}>
        {severities.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.chip, severity === s.key && { backgroundColor: s.color + "20", borderColor: s.color }]}
            onPress={() => setSeverity(s.key as any)}
          >
            <Text style={[styles.chipText, severity === s.key && { color: s.color, fontWeight: "700" }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Area Affected (hectares)</Text>
      <TextInput style={styles.input} placeholder="0.0" value={areaAffected} onChangeText={setAreaAffected} keyboardType="numeric" />

      <Text style={styles.sectionLabel}>Symptoms</Text>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Describe visible symptoms..." value={symptoms} onChangeText={setSymptoms} multiline numberOfLines={3} />

      <Text style={styles.sectionLabel}>Spread Status</Text>
      <View style={styles.chipRow}>
        {spreads.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.chip, spreadStatus === s.key && { backgroundColor: s.color + "20", borderColor: s.color }]}
            onPress={() => setSpreadStatus(s.key as any)}
          >
            <Text style={[styles.chipText, spreadStatus === s.key && { color: s.color, fontWeight: "700" }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
          <Bug size={16} color="#DC2626" />
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
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F1F5F9", borderWidth: 1, borderColor: "#E2E8F0" },
  chipText: { fontSize: 13, color: "#64748B" },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
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
  textArea: { height: 80, textAlignVertical: "top", paddingTop: 10 },
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
