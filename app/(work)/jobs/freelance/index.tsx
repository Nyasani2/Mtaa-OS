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

interface RealJob {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  duration: string;
  status: string;
  employer_id: string;
  created_at: string;
  escrow_required: boolean;
}

interface RealMilestone {
  id: string;
  contract_id: string;
  title: string;
  amount: number;
  status: 'pending' | 'in_progress' | 'completed' | 'disputed';
  due_date: string;
}

export default function FreelanceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("projects");
  const [contracts, setContracts] = useState<RealContract[]>([]);
  const [projects, setProjects] = useState<RealJob[]>([]);
  const [milestones, setMilestones] = useState<RealMilestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [settlingId, setSettlingId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, description, budget_min, budget_max, duration, status, employer_id, created_at, escrow_required')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setProjects(data);
    } else if (error) {
      console.error('[Freelance] Projects load error:', error);
    }
    setLoading(false);
  }, []);

  const loadContracts = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
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
    setLoading(false);
  }, [user?.id]);

  const loadMilestones = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // Get user's active contracts first
    const { data: userContracts } = await supabase
      .from('job_contracts')
      .select('id')
      .or(`employer_id.eq.${user.id},worker_id.eq.${user.id}`)
      .in('status', ['active', 'in_progress']);

    if (userContracts && userContracts.length > 0) {
      const contractIds = userContracts.map(c => c.id);
      const { data, error } = await supabase
        .from('contract_milestones')
        .select('id, contract_id, title, amount, status, due_date')
        .in('contract_id', contractIds)
        .order('due_date', { ascending: true });

      if (!error && data) {
        setMilestones(data);
      }
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === 'projects') loadProjects();
    if (activeTab === 'contracts') loadContracts();
    if (activeTab === 'milestones') loadMilestones();
  }, [activeTab, loadProjects, loadContracts, loadMilestones]);

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

  const handleBid = (jobId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to place a bid.');
      return;
    }
    router.push({ pathname: '/(work)/jobs/bid' as any, params: { job_id: jobId } });
  };

  const handleSaveJob = async (jobId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please log in to save jobs.');
      return;
    }
    const { error } = await supabase
      .from('job_saved_items')
      .insert({ user_id: user.id, job_id: jobId })
      .select();

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Saved', 'Job saved to your list.');
    }
  };

  const handleMessage = (jobId: string, employerId: string) => {
    router.push({
      pathname: '/(os)/messenger' as any,
      params: { recipient_id: employerId, context: 'job', job_id: jobId }
    });
  };

  const handleFundEscrow = async () => {
    Alert.alert('Fund Escrow', 'This will create an escrow deposit. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Continue', onPress: () => router.push('/(finance)/wallet/escrow' as any) }
    ]);
  };

  const handleReleaseEscrow = async () => {
    Alert.alert('Release Escrow', 'This will release funds to the worker. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Release', onPress: () => Alert.alert('Coming Soon', 'Escrow release via smart contract coming soon.') }
    ]);
  };

  const handleDispute = () => {
    router.push('/(work)/jobs/dispute' as any);
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
            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : projects.length === 0 ? (
              <Text style={styles.emptyText}>No open projects found.</Text>
            ) : (
              projects.map((project) => (
                <View key={project.id} style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <View style={styles.projectInfo}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      <Text style={styles.projectClient} numberOfLines={2}>{project.description}</Text>
                    </View>
                    {project.escrow_required && (
                      <View style={styles.escrowBadge}>
                        <Shield size={12} color="#34C759" />
                        <Text style={styles.escrowText}>Escrow</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.projectMeta}>
                    <View style={styles.metaItem}><DollarSign size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>KES {project.budget_min?.toLocaleString()} - {project.budget_max?.toLocaleString()}</Text></View>
                    <View style={styles.metaItem}><Clock size={14} color={Colors.textSecondary} /><Text style={styles.metaText}>{project.duration || 'Not specified'}</Text></View>
                  </View>
                  <View style={styles.projectActions}>
                    <TouchableOpacity style={styles.projectAction} onPress={() => handleBid(project.id)}>
                      <Text style={styles.projectActionText}>Bid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.projectAction} onPress={() => handleSaveJob(project.id)}>
                      <Text style={styles.projectActionText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.projectAction} onPress={() => handleMessage(project.id, project.employer_id)}>
                      <Text style={styles.projectActionText}>Message</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "milestones" && (
          <View>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
            ) : milestones.length === 0 ? (
              <Text style={styles.emptyText}>No active milestones.</Text>
            ) : (
              milestones.map((m) => (
                <View key={m.id} style={styles.milestoneCard}>
                  <View style={styles.milestoneHeader}>
                    <View style={[styles.milestoneDot, { backgroundColor: m.status === "completed" ? "#34C759" : m.status === "in_progress" ? "#FF9500" : Colors.border }]} />
                    <View style={styles.milestoneInfo}>
                      <Text style={styles.milestoneTitle}>{m.title}</Text>
                      <Text style={styles.milestoneDate}>{new Date(m.due_date).toLocaleDateString()}</Text>
                    </View>
                    <Text style={styles.milestoneAmount}>KES {Number(m.amount).toLocaleString()}</Text>
                  </View>
                  <View style={styles.milestoneStatus}>
                    <Text style={[styles.milestoneStatusText, { color: m.status === "completed" ? "#34C759" : m.status === "in_progress" ? "#FF9500" : Colors.textSecondary }]}>{m.status.replace("_", " ")}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === "escrow" && (
          <View>
            <View style={styles.escrowCard}>
              <View style={styles.escrowHeader}>
                <Shield size={24} color="#34C759" />
                <Text style={styles.escrowTitle}>Active Escrow</Text>
              </View>
              <Text style={styles.escrowAmount}>KES 0</Text>
              <Text style={styles.escrowLabel}>Protected by MTAA Escrow</Text>
              <View style={styles.escrowActions}>
                <TouchableOpacity style={styles.escrowAction} onPress={handleFundEscrow}>
                  <Text style={styles.escrowActionText}>Fund Escrow</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.escrowAction} onPress={handleReleaseEscrow}>
                  <Text style={styles.escrowActionText}>Release</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.escrowAction} onPress={handleDispute}>
                  <Text style={styles.escrowActionText}>Dispute</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.escrowHistory}>
              <Text style={styles.escrowHistoryTitle}>Escrow History</Text>
              <Text style={styles.emptyText}>No escrow history yet.</Text>
            </View>
          </View>
        )}

        {activeTab === "contracts" && (
          <View>
            {loading ? (
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
                          <Text style={styles.contractActionText}>Paid</Text>
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
  contractActions: { flexDirection: "row", gap: 8, marginTop: 14 },
  contractAction: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: Colors.background, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
  contractActionText: { fontSize: 12, color: Colors.primary, fontWeight: "600" },
});
