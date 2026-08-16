import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { useWalletStore } from "@/lib/modules/wallet/store";
import { WalletTransaction, TransactionType } from "@/lib/modules/wallet/types";
import { ArrowLeftRight, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle } from "lucide-react-native";

export default function HistoryScreen() {
  const { transactions } = useWalletStore();
  const [filter, setFilter] = useState<TransactionType | "all">("all");

  const filtered = filter === "all" ? transactions : transactions.filter((t) => t.type === filter);

  const getIcon = (type: string) => {
    switch (type) {
      case "send": return <ArrowUpRight size={20} color="#EF4444" />;
      case "receive": return <ArrowDownLeft size={20} color="#10B981" />;
      case "deposit": return <ArrowDownLeft size={20} color="#3B82F6" />;
      case "withdraw": return <ArrowUpRight size={20} color="#F59E0B" />;
      case "escrow": return <Clock size={20} color="#8B5CF6" />;
      case "go_fund": return <ArrowLeftRight size={20} color="#F97316" />;
      default: return <ArrowLeftRight size={20} color="#6B7280" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle size={16} color="#10B981" />;
      case "failed": return <XCircle size={16} color="#EF4444" />;
      case "pending": return <Clock size={16} color="#F59E0B" />;
      default: return null;
    }
  };

  const renderItem = ({ item }: { item: WalletTransaction }) => (
    <TouchableOpacity style={styles.txRow}>
      <View style={styles.txIcon}>{getIcon(item.type)}</View>
      <View style={styles.txInfo}>
        <Text style={styles.txType}>{item.type.replace("_", " ").toUpperCase()}</Text>
        <Text style={styles.txDesc}>{item.description}</Text>
        <Text style={styles.txDate}>{new Date(item.createdAt || item.timestamp).toLocaleDateString()}</Text>
      </View>
      <View style={styles.txAmount}>
        <Text style={[styles.amountText, item.type === "receive" || item.type === "deposit" ? styles.income : styles.expense]}>
          {item.type === "receive" || item.type === "deposit" ? "+" : "-"} KSh {item.amount.toLocaleString()}
        </Text>
        <View style={styles.statusWrap}>{getStatusIcon(item.status)}</View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Transaction History</Text>
      <View style={styles.filterRow}>
        {(["all", "send", "receive", "deposit", "withdraw", "escrow", "go_fund"] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === "all" ? "All" : f.replace("_", " ")}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <FlatList data={filtered} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.list} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC", padding: 16 },
  header: { fontSize: 22, fontWeight: "700", color: "#1F2937", marginBottom: 16 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  filterBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#E5E7EB" },
  filterBtnActive: { backgroundColor: "#3B82F6" },
  filterText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  filterTextActive: { color: "#FFF" },
  list: { gap: 8 },
  txRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 14, borderRadius: 12, gap: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txType: { fontSize: 13, fontWeight: "700", color: "#1F2937", textTransform: "capitalize" },
  txDesc: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  txDate: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  txAmount: { alignItems: "flex-end" },
  amountText: { fontSize: 14, fontWeight: "700" },
  income: { color: "#10B981" },
  expense: { color: "#EF4444" },
  statusWrap: { marginTop: 4 },
});
