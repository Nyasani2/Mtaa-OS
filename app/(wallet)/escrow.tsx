import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ChevronRight,
  Plus,
  X,
  AlertTriangle,
  CheckCircle,
  ArrowUpRight,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWalletStore } from "@/lib/modules/wallet/store";
import type { EscrowTransaction } from "@/lib/modules/wallet/types";

export default function EscrowScreen() {
  const router = useRouter();
  const { escrows, addEscrow, releaseEscrow, disputeEscrow } = useWalletStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [selectedEscrow, setSelectedEscrow] = useState<EscrowTransaction | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showDispute, setShowDispute] = useState(false);

  const totalHeld = escrows
    .filter((e) => e.status === "held" || e.status === "pending")
    .reduce((sum, e) => sum + e.amount, 0);

  const activeEscrows = escrows.filter((e) => e.status === "held" || e.status === "pending");
  const completedEscrows = escrows.filter((e) => e.status === "released" || e.status === "refunded");
  const disputedEscrows = escrows.filter((e) => e.status === "disputed");

  const handleCreateEscrow = () => {
    const amount = parseFloat(newAmount);
    if (!amount || !newRecipient) return;

    const escrow: EscrowTransaction = {
      id: Math.random().toString(36).substring(2, 15),
      amount,
      currency: "KES",
      status: "held",
      recipientName: newRecipient,
      description: newDescription || "Escrow transaction",
      createdAt: new Date().toISOString(),
      heldUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    addEscrow(escrow);
    setShowCreate(false);
    setNewAmount("");
    setNewRecipient("");
    setNewDescription("");
  };

  const handleRelease = (id: string) => {
    releaseEscrow(id);
    setSelectedEscrow(null);
  };

  const handleDispute = () => {
    if (!selectedEscrow || !disputeReason) return;
    disputeEscrow(selectedEscrow.id, disputeReason);
    setShowDispute(false);
    setDisputeReason("");
    setSelectedEscrow(null);
  };

  const getStatusIcon = (status: EscrowTransaction["status"]) => {
    switch (status) {
      case "held":
      case "pending":
        return <Shield size={18} color="#F59E0B" />;
      case "released":
        return <ShieldCheck size={18} color="#10B981" />;
      case "disputed":
        return <ShieldAlert size={18} color="#EF4444" />;
      case "refunded":
        return <ArrowUpRight size={18} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: EscrowTransaction["status"]) => {
    switch (status) {
      case "held":
      case "pending":
        return "#FEF3C7";
      case "released":
        return "#ECFDF5";
      case "disputed":
        return "#FEF2F2";
      case "refunded":
        return "#F3F4F6";
    }
  };

  const getStatusText = (status: EscrowTransaction["status"]) => {
    switch (status) {
      case "held":
        return "Held";
      case "pending":
        return "Pending";
      case "released":
        return "Released";
      case "disputed":
        return "Disputed";
      case "refunded":
        return "Refunded";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Escrow</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)}>
          <Plus size={24} color="#10B981" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <LinearGradient
          colors={["#6366F1", "#4F46E5"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryRow}>
            <View>
              <Text style={styles.summaryLabel}>Total Held</Text>
              <Text style={styles.summaryAmount}>KSh {totalHeld.toLocaleString()}</Text>
            </View>
            <View style={styles.summaryBadge}>
              <Shield size={16} color="#6366F1" />
              <Text style={styles.summaryBadgeText}>{activeEscrows.length} Active</Text>
            </View>
          </View>
          <View style={styles.summaryStats}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{completedEscrows.length}</Text>
              <Text style={styles.summaryStatLabel}>Completed</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{disputedEscrows.length}</Text>
              <Text style={styles.summaryStatLabel}>Disputed</Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatValue}>{escrows.length}</Text>
              <Text style={styles.summaryStatLabel}>Total</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Active Escrows */}
        {activeEscrows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active</Text>
            {activeEscrows.map((escrow) => (
              <TouchableOpacity
                key={escrow.id}
                style={styles.escrowCard}
                onPress={() => setSelectedEscrow(escrow)}
              >
                <View style={[styles.escrowIcon, { backgroundColor: getStatusColor(escrow.status) }]}>
                  {getStatusIcon(escrow.status)}
                </View>
                <View style={styles.escrowInfo}>
                  <Text style={styles.escrowName} numberOfLines={1}>{escrow.recipientName}</Text>
                  <Text style={styles.escrowDesc} numberOfLines={1}>{escrow.description}</Text>
                  <View style={styles.escrowMeta}>
                    <Clock size={12} color="#9CA3AF" />
                    <Text style={styles.escrowMetaText}>
                      Held until {new Date(escrow.heldUntil || "").toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                    </Text>
                  </View>
                </View>
                <View style={styles.escrowAmount}>
                  <Text style={styles.escrowAmountText}>KSh {escrow.amount.toLocaleString()}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(escrow.status) }]}>
                    <Text style={[styles.statusBadgeText, { color: escrow.status === "held" ? "#D97706" : "#6B7280" }]}>
                      {getStatusText(escrow.status)}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Disputed Escrows */}
        {disputedEscrows.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>Disputed</Text>
            {disputedEscrows.map((escrow) => (
              <View key={escrow.id} style={[styles.escrowCard, { borderColor: "#FECACA" }]}>
                <View style={[styles.escrowIcon, { backgroundColor: "#FEF2F2" }]}>
                  <ShieldAlert size={18} color="#EF4444" />
                </View>
                <View style={styles.escrowInfo}>
                  <Text style={styles.escrowName} numberOfLines={1}>{escrow.recipientName}</Text>
                  <Text style={styles.escrowDesc} numberOfLines={1}>{escrow.description}</Text>
                  <Text style={[styles.escrowMetaText, { color: "#EF4444" }]}>
                    {escrow.disputeReason}
                  </Text>
                </View>
                <View style={styles.escrowAmount}>
                  <Text style={[styles.escrowAmountText, { color: "#EF4444" }]}>
                    KSh {escrow.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Completed Escrows */}
        {completedEscrows.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>History</Text>
            {completedEscrows.map((escrow) => (
              <View key={escrow.id} style={styles.escrowCard}>
                <View style={[styles.escrowIcon, { backgroundColor: getStatusColor(escrow.status) }]}>
                  {getStatusIcon(escrow.status)}
                </View>
                <View style={styles.escrowInfo}>
                  <Text style={styles.escrowName} numberOfLines={1}>{escrow.recipientName}</Text>
                  <Text style={styles.escrowDesc} numberOfLines={1}>{escrow.description}</Text>
                  <Text style={styles.escrowMetaText}>
                    {escrow.releasedAt
                      ? `Released ${new Date(escrow.releasedAt).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`
                      : "Refunded"}
                  </Text>
                </View>
                <View style={styles.escrowAmount}>
                  <Text style={[styles.escrowAmountText, { color: "#6B7280" }]}>
                    KSh {escrow.amount.toLocaleString()}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {escrows.length === 0 && (
          <View style={styles.emptyState}>
            <Shield size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No escrow transactions</Text>
            <Text style={styles.emptySub}>Create an escrow to protect your payments</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
              <Plus size={16} color="#FFF" />
              <Text style={styles.emptyBtnText}>Create Escrow</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Create Escrow Modal */}
      <Modal visible={showCreate} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create Escrow</Text>
            <TouchableOpacity onPress={() => setShowCreate(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Who are you paying?"
                value={newRecipient}
                onChangeText={setNewRecipient}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount (KSh)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={newAmount}
                onChangeText={setNewAmount}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="What is this payment for?"
                multiline
                value={newDescription}
                onChangeText={setNewDescription}
              />
            </View>
            <View style={styles.escrowNotice}>
              <AlertTriangle size={16} color="#F59E0B" />
              <Text style={styles.escrowNoticeText}>
                Funds will be held for 7 days or until both parties confirm.
              </Text>
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity onPress={handleCreateEscrow} activeOpacity={0.8}>
              <LinearGradient
                colors={["#6366F1", "#4F46E5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createBtn}
              >
                <Shield size={18} color="#FFF" />
                <Text style={styles.createBtnText}>Create Escrow</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Escrow Detail Modal */}
      <Modal visible={!!selectedEscrow && !showDispute} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Escrow Details</Text>
            <TouchableOpacity onPress={() => setSelectedEscrow(null)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {selectedEscrow && (
            <ScrollView style={styles.modalBody}>
              <View style={styles.detailCard}>
                <Text style={styles.detailAmount}>KSh {selectedEscrow.amount.toLocaleString()}</Text>
                <View style={[styles.detailStatus, { backgroundColor: getStatusColor(selectedEscrow.status) }]}>
                  <Text style={[styles.detailStatusText, { color: selectedEscrow.status === "held" ? "#D97706" : "#6B7280" }]}>
                    {getStatusText(selectedEscrow.status)}
                  </Text>
                </View>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recipient</Text>
                <Text style={styles.detailValue}>{selectedEscrow.recipientName}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue}>{selectedEscrow.description}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedEscrow.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              </View>
              {selectedEscrow.heldUntil && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Held Until</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedEscrow.heldUntil).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
          {selectedEscrow?.status === "held" && (
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#10B981" }]}
                onPress={() => handleRelease(selectedEscrow.id)}
              >
                <CheckCircle size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>Release Funds</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: "#EF4444", marginTop: 8 }]}
                onPress={() => setShowDispute(true)}
              >
                <AlertTriangle size={18} color="#FFF" />
                <Text style={styles.actionBtnText}>Dispute</Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Dispute Modal */}
      <Modal visible={showDispute} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Raise Dispute</Text>
            <TouchableOpacity onPress={() => setShowDispute(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.disputeWarning}>
              <AlertTriangle size={20} color="#EF4444" />
              <Text style={styles.disputeWarningText}>
                Disputing will freeze funds and require mediation. Use only when necessary.
              </Text>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reason for Dispute</Text>
              <TextInput
                style={[styles.modalInput, { height: 100 }]}
                placeholder="Explain why you are disputing this transaction..."
                multiline
                value={disputeReason}
                onChangeText={setDisputeReason}
              />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#EF4444" }]}
              onPress={handleDispute}
            >
              <ShieldAlert size={18} color="#FFF" />
              <Text style={styles.actionBtnText}>Submit Dispute</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },

  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  summaryLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 4 },
  summaryAmount: { fontSize: 28, fontWeight: "800", color: "#FFF" },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  summaryBadgeText: { fontSize: 12, fontWeight: "600", color: "#FFF" },
  summaryStats: { flexDirection: "row", gap: 24 },
  summaryStat: { alignItems: "center" },
  summaryStatValue: { fontSize: 20, fontWeight: "800", color: "#FFF" },
  summaryStatLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937", paddingHorizontal: 20, marginBottom: 12 },

  escrowCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  escrowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  escrowInfo: { flex: 1 },
  escrowName: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  escrowDesc: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  escrowMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  escrowMetaText: { fontSize: 11, color: "#9CA3AF" },
  escrowAmount: { alignItems: "flex-end", marginRight: 8 },
  escrowAmountText: { fontSize: 14, fontWeight: "700", color: "#1F2937" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusBadgeText: { fontSize: 10, fontWeight: "600" },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#6B7280", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4, marginBottom: 20 },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#6366F1",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "600", color: "#FFF" },

  modalContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  modalBody: { paddingHorizontal: 20, paddingTop: 20 },
  modalFooter: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: "#FFF", borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#6B7280", marginBottom: 8 },
  modalInput: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1F2937",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  escrowNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFBEB",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  escrowNoticeText: { flex: 1, fontSize: 13, color: "#B45309", lineHeight: 18 },
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  createBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  detailCard: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "#FFF",
    borderRadius: 16,
    marginBottom: 20,
  },
  detailAmount: { fontSize: 32, fontWeight: "800", color: "#1F2937", marginBottom: 8 },
  detailStatus: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  detailStatusText: { fontSize: 12, fontWeight: "600" },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: { fontSize: 14, color: "#6B7280" },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#1F2937", maxWidth: "60%", textAlign: "right" },

  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  actionBtnText: { fontSize: 16, fontWeight: "700", color: "#FFF" },

  disputeWarning: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FEF2F2",
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  disputeWarningText: { flex: 1, fontSize: 13, color: "#B91C1C", lineHeight: 18 },
});
