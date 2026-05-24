import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Shield,
  Zap,
  Wallet,
  X,
  ChevronDown,
} from "lucide-react-native";
import { useWalletStore } from "@/lib/modules/wallet/store";
import type { WalletTransaction, TransactionType } from "@/lib/modules/wallet/types";

type FilterType = "all" | TransactionType;

const TYPE_FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "send", label: "Sent" },
  { id: "receive", label: "Received" },
  { id: "deposit", label: "Deposits" },
  { id: "withdraw", label: "Withdrawals" },
  { id: "qr_pay", label: "QR Pay" },
  { id: "go_fund_draw", label: "Go Fund" },
  { id: "escrow_hold", label: "Escrow" },
];

export default function HistoryScreen() {
  const router = useRouter();
  const { transactions } = useWalletStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (filter !== "all") {
      result = result.filter((tx) => tx.type === filter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (tx) =>
          tx.recipientName?.toLowerCase().includes(q) ||
          tx.senderName?.toLowerCase().includes(q) ||
          tx.description?.toLowerCase().includes(q) ||
          tx.amount.toString().includes(q)
      );
    }

    return result;
  }, [transactions, filter, searchQuery]);

  const grouped = useMemo(() => {
    const groups: Record<string, WalletTransaction[]> = {};
    filtered.forEach((tx) => {
      const date = new Date(tx.createdAt).toLocaleDateString("en-KE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
    });
    return groups;
  }, [filtered]);

  const getTxIcon = (tx: WalletTransaction) => {
    switch (tx.type) {
      case "send": return <ArrowUpRight size={18} color="#EF4444" />;
      case "receive": return <ArrowDownLeft size={18} color="#10B981" />;
      case "deposit": return <ArrowDownLeft size={18} color="#3B82F6" />;
      case "withdraw": return <ArrowUpRight size={18} color="#F59E0B" />;
      case "qr_pay": return <QrCode size={18} color="#8B5CF6" />;
      case "go_fund_draw": return <Zap size={18} color="#F97316" />;
      case "go_fund_repay": return <Zap size={18} color="#10B981" />;
      case "escrow_hold": return <Shield size={18} color="#6366F1" />;
      default: return <Wallet size={18} color="#6B7280" />;
    }
  };

  const getTxColor = (tx: WalletTransaction) => {
    switch (tx.type) {
      case "receive":
      case "deposit":
      case "go_fund_repay":
        return "#10B981";
      case "send":
      case "withdraw":
      case "go_fund_draw":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getTypeLabel = (type: TransactionType) => {
    const labels: Record<string, string> = {
      send: "Sent",
      receive: "Received",
      deposit: "Deposit",
      withdraw: "Withdrawal",
      qr_pay: "QR Payment",
      escrow_hold: "Escrow",
      escrow_release: "Escrow Released",
      escrow_dispute: "Escrow Disputed",
      go_fund_draw: "Go Fund Draw",
      go_fund_repay: "Go Fund Repaid",
      go_fund_fee: "Go Fund Fee",
      go_fund_interest: "Go Fund Interest",
      refund: "Refund",
    };
    return labels[type] || type;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <TouchableOpacity onPress={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={22} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search transactions..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <X size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      {showFilters && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {TYPE_FILTERS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterChip, filter === f.id && styles.filterChipActive]}
              onPress={() => setFilter(f.id)}
            >
              <Text style={[styles.filterChipText, filter === f.id && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {Object.entries(grouped).map(([date, txs]) => (
          <View key={date}>
            <Text style={styles.dateHeader}>{date}</Text>
            {txs.map((tx) => (
              <TouchableOpacity
                key={tx.id}
                style={styles.txRow}
                onPress={() => setSelectedTx(tx)}
              >
                <View style={[styles.txIconWrap, { backgroundColor: getTxColor(tx) + "15" }]}>
                  {getTxIcon(tx)}
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txName} numberOfLines={1}>
                    {tx.recipientName || tx.senderName || tx.description || getTypeLabel(tx.type)}
                  </Text>
                  <Text style={styles.txType}>{getTypeLabel(tx.type)}</Text>
                  {tx.goFundUsed && tx.goFundUsed > 0 && (
                    <View style={styles.goFundTag}>
                      <Zap size={10} color="#F97316" />
                      <Text style={styles.goFundTagText}>Go Fund KSh {tx.goFundUsed.toLocaleString()}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.txAmountCol}>
                  <Text style={[styles.txAmount, { color: getTxColor(tx) }]}>
                    {tx.type === "receive" || tx.type === "deposit" || tx.type === "go_fund_repay"
                      ? "+"
                      : "-"}
                    KSh {tx.amount.toLocaleString()}
                  </Text>
                  <Text style={styles.txStatus}>{tx.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {filtered.length === 0 && (
          <View style={styles.emptyState}>
            <Search size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptySub}>Try adjusting your filters or search</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <View style={styles.detailOverlay}>
          <TouchableOpacity style={styles.detailBackdrop} onPress={() => setSelectedTx(null)} />
          <View style={styles.detailSheet}>
            <View style={styles.detailHandle} />
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Transaction Details</Text>
              <TouchableOpacity onPress={() => setSelectedTx(null)}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailAmountRow}>
              <Text style={[styles.detailAmount, { color: getTxColor(selectedTx) }]}>
                {selectedTx.type === "receive" || selectedTx.type === "deposit" || selectedTx.type === "go_fund_repay"
                  ? "+"
                  : "-"}
                KSh {selectedTx.amount.toLocaleString()}
              </Text>
              <View style={[styles.detailStatusBadge, { backgroundColor: selectedTx.status === "completed" ? "#ECFDF5" : "#FEF3C7" }]}>
                <Text style={[styles.detailStatusText, { color: selectedTx.status === "completed" ? "#059669" : "#D97706" }]}>
                  {selectedTx.status}
                </Text>
              </View>
            </View>

            <View style={styles.detailDivider} />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{getTypeLabel(selectedTx.type)}</Text>
            </View>
            {selectedTx.recipientName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recipient</Text>
                <Text style={styles.detailValue}>{selectedTx.recipientName}</Text>
              </View>
            )}
            {selectedTx.senderName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Sender</Text>
                <Text style={styles.detailValue}>{selectedTx.senderName}</Text>
              </View>
            )}
            {selectedTx.note && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Note</Text>
                <Text style={styles.detailValue}>{selectedTx.note}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedTx.createdAt).toLocaleString("en-KE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction ID</Text>
              <Text style={[styles.detailValue, { fontSize: 12 }]}>{selectedTx.id}</Text>
            </View>
            {selectedTx.goFundUsed && selectedTx.goFundUsed > 0 && (
              <View style={[styles.detailRow, { backgroundColor: "#FFF7ED", marginHorizontal: -20, paddingHorizontal: 20, paddingVertical: 12 }]}>
                <Text style={[styles.detailLabel, { color: "#F97316" }]}>Go Fund Used</Text>
                <Text style={[styles.detailValue, { color: "#F97316", fontWeight: "700" }]}>
                  KSh {selectedTx.goFundUsed.toLocaleString()}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Balance After</Text>
              <Text style={styles.detailValue}>KSh {selectedTx.balanceAfter.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      )}
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

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1F2937", paddingVertical: 10, marginLeft: 10 },

  filterScroll: { marginBottom: 12 },
  filterChip: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipActive: { backgroundColor: "#10B981", borderColor: "#10B981" },
  filterChipText: { fontSize: 12, fontWeight: "500", color: "#6B7280" },
  filterChipTextActive: { color: "#FFF", fontWeight: "700" },

  dateHeader: {
    fontSize: 13,
    fontWeight: "600",
    color: "#9CA3AF",
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 8,
  },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  txIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txName: { fontSize: 14, fontWeight: "600", color: "#1F2937" },
  txType: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  goFundTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFF7ED",
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  goFundTagText: { fontSize: 10, fontWeight: "600", color: "#F97316" },
  txAmountCol: { alignItems: "flex-end" },
  txAmount: { fontSize: 14, fontWeight: "700" },
  txStatus: { fontSize: 11, color: "#9CA3AF", marginTop: 2, textTransform: "capitalize" },

  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: "#6B7280", marginTop: 16 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },

  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  detailBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  detailSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  detailHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  detailTitle: { fontSize: 18, fontWeight: "700", color: "#1F2937" },
  detailAmountRow: { alignItems: "center", marginBottom: 20 },
  detailAmount: { fontSize: 32, fontWeight: "800", marginBottom: 8 },
  detailStatusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  detailStatusText: { fontSize: 12, fontWeight: "600" },
  detailDivider: { height: 1, backgroundColor: "#F3F4F6", marginBottom: 16 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  detailLabel: { fontSize: 14, color: "#6B7280" },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#1F2937", maxWidth: "60%", textAlign: "right" },
});
