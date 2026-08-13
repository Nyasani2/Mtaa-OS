// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useHealthStore } from "@/domains/health/state/healthStore";

interface Policy {
  id: string;
  policy_number: string;
  provider: string;
  type: string;
  holder_name: string;
  start_date: string;
  end_date: string;
  coverage_limit: number;
  used_amount: number;
  status: "active" | "expired" | "pending" | "suspended";
  dependents: number;
}

interface Claim {
  id: string;
  claim_number: string;
  patient_name: string;
  amount: number;
  status: "submitted" | "under_review" | "approved" | "rejected" | "paid";
  submitted_at: string;
  service_type: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: "#10b981",
  expired: "#ef4444",
  pending: "#f59e0b",
  suspended: "#6b7280",
  submitted: "#3b82f6",
  under_review: "#f59e0b",
  approved: "#8b5cf6",
  rejected: "#ef4444",
  paid: "#10b981",
};

export default function InsuranceDashboard() {
  const router = useRouter();
  const { fetchInsurancePolicies, fetchInsuranceClaims } = useHealthStore();

  const [policies, setPolicies] = useState<Policy[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"policies" | "claims">("policies");

  const loadData = async () => {
    const [p, c] = await Promise.all([fetchInsurancePolicies(), fetchInsuranceClaims()]);
    setPolicies(p || []);
    setClaims(c || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const totalCoverage = policies.reduce((sum, p) => sum + (p.coverage_limit || 0), 0);
  const totalUsed = policies.reduce((sum, p) => sum + (p.used_amount || 0), 0);
  const activePolicies = policies.filter((p) => p.status === "active").length;
  const pendingClaims = claims.filter((c) => ["submitted", "under_review"].includes(c.status)).length;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Insurance</Text>
        <TouchableOpacity onPress={() => router.push("/(os)/health/insurance/claims/new" as any)}>
          <Ionicons name="add-circle" size={26} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Coverage Overview */}
        <View style={styles.overviewCard}>
          <Text style={styles.overviewTitle}>Coverage Overview</Text>
          <View style={styles.coverageRow}>
            <View style={styles.coverageItem}>
              <Text style={styles.coverageValue}>KSh {(totalCoverage / 1000000).toFixed(1)}M</Text>
              <Text style={styles.coverageLabel}>Total Coverage</Text>
            </View>
            <View style={styles.coverageDivider} />
            <View style={styles.coverageItem}>
              <Text style={[styles.coverageValue, { color: "#ef4444" }]}>KSh {(totalUsed / 1000000).toFixed(1)}M</Text>
              <Text style={styles.coverageLabel}>Used</Text>
            </View>
            <View style={styles.coverageDivider} />
            <View style={styles.coverageItem}>
              <Text style={[styles.coverageValue, { color: "#10b981" }]}>KSh {((totalCoverage - totalUsed) / 1000000).toFixed(1)}M</Text>
              <Text style={styles.coverageLabel}>Remaining</Text>
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${totalCoverage > 0 ? (totalUsed / totalCoverage) * 100 : 0}%` }]} />
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{activePolicies}</Text>
            <Text style={styles.statLabel}>Active Policies</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{pendingClaims}</Text>
            <Text style={styles.statLabel}>Pending Claims</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{claims.filter((c) => c.status === "paid").length}</Text>
            <Text style={styles.statLabel}>Paid Claims</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "policies" && styles.tabActive]}
            onPress={() => setActiveTab("policies")}
          >
            <Text style={[styles.tabText, activeTab === "policies" && styles.tabTextActive]}>Policies</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "claims" && styles.tabActive]}
            onPress={() => setActiveTab("claims")}
          >
            <Text style={[styles.tabText, activeTab === "claims" && styles.tabTextActive]}>Claims</Text>
          </TouchableOpacity>
        </View>

        {/* Policies Tab */}
        {activeTab === "policies" && (
          <>
            {policies.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="shield-check-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No policies found</Text>
              </View>
            ) : (
              policies.map((policy) => (
                <View key={policy.id} style={styles.policyCard}>
                  <View style={styles.policyHeader}>
                    <View>
                      <Text style={styles.policyNumber}>{policy.policy_number}</Text>
                      <Text style={styles.policyProvider}>{policy.provider}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[policy.status] + "20" }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[policy.status] }]}>
                        {policy.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.policyDetails}>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Holder</Text>
                      <Text style={styles.detailValue}>{policy.holder_name}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Type</Text>
                      <Text style={styles.detailValue}>{policy.type}</Text>
                    </View>
                    <View style={styles.detailCol}>
                      <Text style={styles.detailLabel}>Dependents</Text>
                      <Text style={styles.detailValue}>{policy.dependents}</Text>
                    </View>
                  </View>
                  <View style={styles.policyFooter}>
                    <Text style={styles.policyDate}>Valid: {new Date(policy.start_date).toLocaleDateString()} - {new Date(policy.end_date).toLocaleDateString()}</Text>
                    <Text style={styles.policyLimit}>Limit: KSh {(policy.coverage_limit / 1000).toFixed(0)}K</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* Claims Tab */}
        {activeTab === "claims" && (
          <>
            {claims.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="file-document-outline" size={40} color="#d1d5db" />
                <Text style={styles.emptyTitle}>No claims found</Text>
              </View>
            ) : (
              claims.map((claim) => (
                <TouchableOpacity
                  key={claim.id}
                  style={styles.claimCard}
                  onPress={() => router.push(`/(os)/health/insurance/claims/${claim.id}` as any)}
                >
                  <View style={styles.claimHeader}>
                    <Text style={styles.claimNumber}>{claim.claim_number}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[claim.status] + "20" }]}>
                      <Text style={[styles.statusText, { color: STATUS_COLORS[claim.status] }]}>
                        {claim.status.replace("_", " ").toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.claimPatient}>{claim.patient_name}</Text>
                  <Text style={styles.claimService}>{claim.service_type}</Text>
                  <View style={styles.claimFooter}>
                    <Text style={styles.claimAmount}>KSh {claim.amount.toLocaleString()}</Text>
                    <Text style={styles.claimDate}>{new Date(claim.submitted_at).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </>
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
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  content: { padding: 12, paddingBottom: 24 },
  overviewCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  overviewTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 14 },
  coverageRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  coverageItem: { alignItems: "center", flex: 1 },
  coverageValue: { fontSize: 18, fontWeight: "800", color: "#111827" },
  coverageLabel: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  coverageDivider: { width: 1, backgroundColor: "#e5e7eb" },
  progressBar: { height: 8, backgroundColor: "#e5e7eb", borderRadius: 4 },
  progressFill: { height: "100%", backgroundColor: "#2563eb", borderRadius: 4 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12, padding: 12,
    alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#6b7280", marginTop: 2, fontWeight: "500" },
  tabRow: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, marginBottom: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 10 },
  tabActive: { backgroundColor: "#2563eb" },
  tabText: { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  empty: { alignItems: "center", marginTop: 40 },
  emptyTitle: { fontSize: 14, color: "#9ca3af", marginTop: 8 },
  policyCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  policyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  policyNumber: { fontSize: 15, fontWeight: "700", color: "#111827" },
  policyProvider: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800" },
  policyDetails: { flexDirection: "row", gap: 16, marginBottom: 10 },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 2 },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#374151" },
  policyFooter: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 10 },
  policyDate: { fontSize: 11, color: "#9ca3af" },
  policyLimit: { fontSize: 12, fontWeight: "700", color: "#2563eb" },
  claimCard: {
    backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 10,
    shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  claimHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  claimNumber: { fontSize: 14, fontWeight: "700", color: "#111827" },
  claimPatient: { fontSize: 15, fontWeight: "600", color: "#374151" },
  claimService: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  claimFooter: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  claimAmount: { fontSize: 14, fontWeight: "800", color: "#111827" },
  claimDate: { fontSize: 11, color: "#9ca3af" },
});
