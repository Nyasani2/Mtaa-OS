import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Dimensions, ActivityIndicator, Alert
} from "react-native";
import { useRouter } from "expo-router";
import {
  Zap, DollarSign, Shield, CheckCircle, Clock, MessageSquare,
  ChevronRight, Users, Star, FileText, Briefcase, Lock,
  Unlock, AlertTriangle, Wallet
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { useAuthStore } from "@/lib/auth/store/auth.store";
import { supabase } from "@/lib/supabase";

const { width } = Dimensions.get("window");

interface RealContract {
  id: string;
  job_id: string;
  employer_id: string;
  worker_id: string;
  agreed_amount: number;
  status: string;
  job_title?: string;
  other_party_name?: string;
}

const PROJECTS = [
  { id: "1", title: "Mobile App Redesign", client: "Fintech Startup", budget: 150000, duration: "2 months", proposals: 8, status: "open", escrow: true },
  { id: "2", title: "E-commerce API Development", client: "Retail Co", budget: 200000, duration: "3 months", proposals: 12, status: "open", escrow: true },
  { id: "3", title: "Brand Identity Design", client: "NGO", budget: 75000, duration: "1 month", proposals: 5, status: "open", escrow: false },
];

const MILESTONES = [
  { id: "1", title: "Discovery Phase", amount: 25000, status: "completed", date: "2024-11-01" },
  { id: "2", title: "UI Design", amount: 50000, status: "in_progress", date: "2024-11-15" },
  { id: "3", title: "Development", amount: 75000, status: "pending", date: "2024-12-01" },
];

// NOTE: PROJECTS and MILESTONES below remain mock data — the freelance
// marketplace/proposal flow and milestone-based payments need their own
// tables (e.g. project_proposals, contract_milestones) that don't exist
// yet. That's new-feature scope, not a settlement-wiring fix, so it's
// intentionally left out of this pass. MY_CONTRACTS was replaced with
// real job_contracts data below since that's the table that actually
// exists and matches the settlement gap this fix addresses.

export default function FreelanceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("projects");
  const [contracts, setContracts] = useState<RealContract[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const loadContracts = useCallback(async () => {
    if (!user?.id) return;
    setLoadingContracts(true);
    const { data, error } = await supabase
      .from('job_contracts')
      .select('id, job_id, employer_id, worker_id, agreed_amount, status')
      .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (!error && data) {
      const enriched = await Promise.all(
        data.map(async (c) => {
          const [{ data: job }, { data: otherParty }] = await Promise.all([
            supabase.from('jobs').select('title').eq('id', c.job_id).maybeSingle(),
            supabase.from('user_profiles').select('full_name')
              .eq('user_id', user.id === c.employer_id ? c.worker_id : c.employer_id)
              .maybeSingle(),
          ]);
          return {
            ...c,
            job_title: job?.title || 'Untitled contract',
            other_party_name: otherParty?.full_name || 'Unknown',
          };
        })
      );
      setContracts(enriched);
    }
    setLoadingContracts(false);
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'contracts') loadContracts();
  }, [activeTab, loadContracts]);

  const handleSettle = async (contractId: string) => {
    setSettlingId(contractId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      const { data, error } = await supabase.functions.invoke('job-contract-settle', {
        body: { contract_id: contractId },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (error || data?.error) {
        Alert.alert('Settlement Failed', data?.error || error?.message || 'Unknown error');
      } else {
        Alert.alert('Payment Released', `Worker received KES ${data.worker_amount.toLocaleString()}`);
        loadContracts();
      }
    } catch (e: any) {
      Alert.alert('Settlement Failed', e?.message || 'Unknown error');
    } finally {
      setSettlingId(null);
    }
  };

  const TABS = [
    { id: "projects", label: "Projects" },
    { id: "milestones", label: "Milestones" },
    { id: "escrow", label: "Escrow" },
    { id: "contracts", label: "My Contracts" },
  ];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Freelance & Contracts</Text>
        <Text style={styles.subtitle}>Projects, milestones, escrow</Text>
      </View>

      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && styles.tabActive]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === "projects" && (
          <View>
            {PROJECTS.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <Text style={styles.projectClient}>{project.client}</Text>
                  </View>
                  {project.escrow && (
                    <View style={styles.escrowBadge}>
                      <Shield size={12} color="#34C759" />
                      <Text style={styles.escrowText}>Escrow</Text>
                    </View>
                  )}
                </View>
                <View style={styles.projectMeta}>
                  <View style={styles.metaItem}><DollarSign size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>KES {project.budget.toLocaleString()}</Text></View>
                  <View style={styles.metaItem}><Clock size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{project.duration}</Text></View>
                  <View style={styles.metaItem}><Users size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{project.proposals} proposals</Text></View>
                </View>
                <View style={styles.projectActions}>
                  <TouchableOpacity style={styles.projectAction}><Text style={styles.projectActionText}>Bid</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.projectAction}><Text style={styles.projectActionText}>Save</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.projectAction} onPress={() => router.push("/(os)/messenger" as any)}><Text style={styles.projectActionText}>Message</Text></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "milestones" && (
          <View>
            {MILESTONES.map((m) => (
              <View key={m.id} style={styles.milestoneCard}>
                <View style={styles.milestoneHeader}>
                  <View style={[styles.milestoneDot, { backgroundColor: m.status === "completed" ? "#34C759" : m.status === "in_progress" ? "#FF9500" : Colors.border }]} />
                  <View style={styles.milestoneInfo}>
                    <Text style={styles.milestoneTitle}>{m.title}</Text>
                    <Text style={styles.milestoneDate}>{m.date}</Text>
                  </View>
                  <Text style={styles.milestoneAmount}>KES {m.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.milestoneStatus}>
                  <Text style={[styles.milestoneStatusText, { color: m.status === "completed" ? "#34C759" : m.status === "in_progress" ? "#FF9500" : Colors.textSecondary }]}>{m.status.replace("_", " ")}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "escrow" && (
          <View>
            <View style={styles.escrowCard}>
              <View style={styles.escrowHeader}>
                <Shield size={24} color="#34C759" />
                <Text style={styles.escrowTitle}>Active Escrow</Text>
              </View>
              <Text style={styles.escrowAmount}>KES 125,000</Text>
              <Text style={styles.escrowLabel}>Protected by MTAA Escrow</Text>
              <View style={styles.escrowActions}>
                <TouchableOpacity style={styles.escrowAction}><Text style={styles.escrowActionText}>Fund Escrow</Text></TouchableOpacity>
                <TouchableOpacity style={styles.escrowAction}><Text style={styles.escrowActionText}>Release</Text></TouchableOpacity>
                <TouchableOpacity style={styles.escrowAction}><Text style={styles.escrowActionText}>Dispute</Text></TouchableOpacity>
              </View>
            </View>

            <View style={styles.escrowHistory}>
              <Text style={styles.escrowHistoryTitle}>Escrow History</Text>
              <View style={styles.historyItem}>
                <View style={styles.historyDot}><CheckCircle size={12} color="#34C759" /></View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyTitle}>Milestone 1 Released</Text>
                  <Text style={styles.historyDate}>Nov 1, 2024</Text>
                </View>
                <Text style={styles.historyAmount}>KES 25,000</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "contracts" && (
          <View>
            {loadingContracts ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : contracts.length === 0 ? (
              <Text style={styles.emptyText}>No contracts yet.</Text>
            ) : (
              contracts.map((contract) => {
                const isEmployer = user?.id === contract.employer_id;
                const canSettle = isEmployer && contract.status === 'active';
                const statusColor = contract.status === 'completed' ? '#34C759' : contract.status === 'active' ? '#FF9500' : '#8E8E93';
                return (
                  <View key={contract.id} style={styles.contractCard}>
                    <View style={styles.contractHeader}>
                      <View style={styles.contractIcon}><FileText size={18} color={Colors.primary} /></View>
                      <View style={styles.contractInfo}>
                        <Text style={styles.contractTitle}>{contract.job_title}</Text>
                        <Text style={styles.contractClient}>{isEmployer ? 'Worker' : 'Employer'}: {contract.other_party_name}</Text>
                      </View>
                      <View style={[styles.contractStatus, { backgroundColor: `${statusColor}15` }]}>
                        <Text style={[styles.contractStatusText, { color: statusColor }]}>{contract.status}</Text>
                      </View>
                    </View>

                    <View style={styles.contractValue}>
                      <View style={styles.valueItem}>
                        <Text style={styles.valueLabel}>Agreed Amount</Text>
                        <Text style={styles.valueAmount}>KES {Number(contract.agreed_amount).toLocaleString()}</Text>
                      </View>
                    </View>

                    <View style={styles.contractActions}>
                      {canSettle ? (
                        <TouchableOpacity
                          style={[styles.contractAction, { backgroundColor: Colors.primary }]}
                          onPress={() => handleSettle(contract.id)}
                          disabled={settlingId === contract.id}
                        >
                          {settlingId === contract.id ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <Text style={[styles.contractActionText, { color: '#fff' }]}>Release Payment</Text>
                          )}
                        </TouchableOpacity>
                      ) : contract.status === 'completed' ? (
                        <View style={styles.contractAction}>
                          <Text style={styles.contractActionText}>✓ Paid</Text>
                        </View>
                      ) : (
                        <View style={styles.contractAction}>
                          <Text style={styles.contractActionText}>Awaiting employer action</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  emptyText: { textAlign: 'center', color: '#8E8E93', marginTop: 40, fontSize: 14 },
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: "800", color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  tabsRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  projectCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  projectHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  projectClient: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  escrowBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#34C75915", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  escrowText: { fontSize: 10, color: "#34C759", fontWeight: "700" },
  projectMeta: { flexDirection: "row", gap: 16, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  projectActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  projectAction: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  projectActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  milestoneCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  milestoneHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  milestoneDot: { width: 12, height: 12, borderRadius: 6 },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { fontSize: 15, fontWeight: "600", color: Colors.text },
  milestoneDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  milestoneAmount: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  milestoneStatus: { marginTop: 8 },
  milestoneStatusText: { fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  escrowCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 20, marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderColor: Colors.border, alignItems: "center" },
  escrowHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  escrowTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  escrowAmount: { fontSize: 32, fontWeight: "800", color: Colors.primary },
  escrowLabel: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  escrowActions: { flexDirection: "row", gap: 8, marginTop: 16, width: "100%" },
  escrowAction: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  escrowActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
  escrowHistory: { backgroundColor: Colors.card, borderRadius: 16, padding: 16, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: Colors.border },
  escrowHistoryTitle: { fontSize: 16, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  historyItem: { flexDirection: "row", alignItems: "center", gap: 12 },
  historyDot: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#34C75915", justifyContent: "center", alignItems: "center" },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: "600", color: Colors.text },
  historyDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  historyAmount: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  contractCard: { backgroundColor: Colors.card, marginHorizontal: 16, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  contractHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  contractIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary + "15", justifyContent: "center", alignItems: "center" },
  contractInfo: { flex: 1 },
  contractTitle: { fontSize: 15, fontWeight: "700", color: Colors.text },
  contractClient: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  contractStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  contractStatusText: { fontSize: 10, fontWeight: "700" },
  contractValue: { flexDirection: "row", gap: 20, marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.border },
  valueItem: { flex: 1 },
  valueLabel: { fontSize: 12, color: Colors.textSecondary },
  valueAmount: { fontSize: 16, fontWeight: "800", color: Colors.text, marginTop: 2 },
  contractProgress: { marginTop: 14 },
  contractProgressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  contractProgressLabel: { fontSize: 12, color: Colors.textSecondary },
  contractProgressValue: { fontSize: 12, fontWeight: "700", color: Colors.text },
  contractBar: { height: 6, backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
  contractFill: { height: "100%", backgroundColor: Colors.primary, borderRadius: 3 },
  contractActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  contractAction: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  contractActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
});
