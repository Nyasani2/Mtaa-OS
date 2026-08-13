// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

interface ClaimDetail {
  id: string;
  claim_number: string;
  policy_number: string;
  patient_name: string;
  service_type: string;
  provider: string;
  service_date: string;
  diagnosis: string;
  items: string;
  total_amount: number;
  approved_amount?: number;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  notes: string;
  timeline: { status: string; timestamp: string; note: string }[];
}

const STATUS_COLORS: Record<string, string> = {
  submitted: "#3b82f6",
  under_review: "#f59e0b",
  approved: "#8b5cf6",
  rejected: "#ef4444",
  paid: "#10b981",
};

export default function ClaimDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getInsuranceClaimDetail } = useHealthStore();

  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInsuranceClaimDetail(id).then((data) => {
      setClaim(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#2563eb" />
      </SafeAreaView>
    );
  }

  if (!claim) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Claim Detail</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "#6b7280" }}>Claim not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Claim {claim.claim_number}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: STATUS_COLORS[claim.status] + "15" }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[claim.status] }]} />
          <Text style={[styles.statusBannerText, { color: STATUS_COLORS[claim.status] }]}>
            {claim.status.replace("_", " ").toUpperCase()}
          </Text>
        </View>

        {/* Claim Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Patient</Text>
            <Text style={styles.infoValue}>{claim.patient_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Policy</Text>
            <Text style={styles.infoValue}>{claim.policy_number}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service Type</Text>
            <Text style={styles.infoValue}>{claim.service_type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Provider</Text>
            <Text style={styles.infoValue}>{claim.provider || "N/A"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Service Date</Text>
            <Text style={styles.infoValue}>{new Date(claim.service_date).toLocaleDateString()}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Submitted</Text>
            <Text style={styles.infoValue}>{new Date(claim.submitted_at).toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Diagnosis */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Diagnosis</Text>
          <View style={styles.box}>
            <Text style={styles.boxText}>{claim.diagnosis || "N/A"}</Text>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itemized Services</Text>
          <View style={styles.box}>
            <Text style={styles.boxText}>{claim.items || "N/A"}</Text>
          </View>
        </View>

        {/* Amount */}
        <View style={styles.amountCard}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Claimed Amount</Text>
            <Text style={styles.amountValue}>KSh {claim.total_amount.toLocaleString()}</Text>
          </View>
          {claim.approved_amount !== undefined && (
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Approved Amount</Text>
              <Text style={[styles.amountValue, { color: "#10b981" }]}>KSh {claim.approved_amount.toLocaleString()}</Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          {claim.timeline?.map((event, index) => (
            <View key={index} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStatus}>{event.status.replace("_", " ").toUpperCase()}</Text>
                <Text style={styles.timelineNote}>{event.note}</Text>
                <Text style={styles.timelineDate}>{new Date(event.timestamp).toLocaleString()}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Notes */}
        {claim.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.box}>
              <Text style={styles.boxText}>{claim.notes}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f3f4f6" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  content: { padding: 16, paddingBottom: 40 },
  statusBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginBottom: 16,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusBannerText: { fontSize: 14, fontWeight: "800" },
  infoCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  infoRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  infoLabel: { fontSize: 13, color: "#6b7280" },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#374151" },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 8 },
  box: { backgroundColor: "#fff", borderRadius: 12, padding: 14 },
  boxText: { fontSize: 14, color: "#374151", lineHeight: 22 },
  amountCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  amountRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  amountLabel: { fontSize: 14, color: "#6b7280" },
  amountValue: { fontSize: 16, fontWeight: "800", color: "#111827" },
  timelineItem: { flexDirection: "row", marginBottom: 14 },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2563eb", marginRight: 12, marginTop: 4 },
  timelineContent: { flex: 1 },
  timelineStatus: { fontSize: 13, fontWeight: "700", color: "#111827" },
  timelineNote: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  timelineDate: { fontSize: 11, color: "#9ca3af", marginTop: 2 },
});
