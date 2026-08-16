import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { useWalletStore } from "@/lib/modules/wallet/store";
import { ArrowUpRight, ArrowDownLeft, Zap, Bell, Settings, Eye, EyeOff } from "lucide-react-native";
import { useRouter } from "expo-router";

export default function WalletHomeScreen() {
  const router = useRouter();
  const { accounts, activeAccountId, transactions, notifications, goFund, hideBalance, toggleHideBalance } = useWalletStore();
  const [showBalance, setShowBalance] = useState(!hideBalance);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const balance = activeAccount?.balance || 0;
  const unreadCount = notifications.filter((n) => !n.read && !n.isRead).length;

  const recentTx = transactions.slice(0, 5);

  const getIcon = (type: string) => {
    switch (type) {
      case "send": return <ArrowUpRight size={18} color="#EF4444" />;
      case "receive": return <ArrowDownLeft size={18} color="#10B981" />;
      case "deposit": return <ArrowDownLeft size={18} color="#3B82F6" />;
      case "withdraw": return <ArrowUpRight size={18} color="#F59E0B" />;
      case "qr_pay": return <ArrowUpRight size={18} color="#8B5CF6" />;
      default: return <ArrowUpRight size={18} color="#6B7280" />;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(os)/wallet/notifications")}>
            <Bell size={22} color="#1F2937" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push("/(os)/wallet/settings")}>
            <Settings size={22} color="#1F2937" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <TouchableOpacity onPress={() => { toggleHideBalance(); setShowBalance(!showBalance); }}>
            {showBalance ? <Eye size={18} color="#FFF" /> : <EyeOff size={18} color="#FFF" />}
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceAmount}>
          {showBalance ? `KSh ${balance.toLocaleString()}` : "******"}
        </Text>
        <Text style={styles.balanceCurrency}>Kenyan Shilling</Text>

        {goFund.isActive && (
          <View style={styles.goFundBanner}>
            <Zap size={16} color="#F97316" />
            <Text style={styles.goFundText}>GoFund Available: KSh {goFund.creditAvailable.toLocaleString()}</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(os)/wallet/send")}>
          <View style={[styles.actionIcon, { backgroundColor: "#FEF2F2" }]}>
            <ArrowUpRight size={22} color="#EF4444" />
          </View>
          <Text style={styles.actionText}>Send</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(os)/wallet/deposit")}>
          <View style={[styles.actionIcon, { backgroundColor: "#ECFDF5" }]}>
            <ArrowDownLeft size={22} color="#10B981" />
          </View>
          <Text style={styles.actionText}>Deposit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(os)/wallet/withdraw")}>
          <View style={[styles.actionIcon, { backgroundColor: "#FFFBEB" }]}>
            <ArrowUpRight size={22} color="#F59E0B" />
          </View>
          <Text style={styles.actionText}>Withdraw</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(os)/wallet/qr-pay")}>
          <View style={[styles.actionIcon, { backgroundColor: "#F5F3FF" }]}>
            <Zap size={22} color="#8B5CF6" />
          </View>
          <Text style={styles.actionText}>QR Pay</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push("/(os)/wallet/history")}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {recentTx.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
          </View>
        ) : (
          recentTx.map((tx) => (
            <TouchableOpacity key={tx.id} style={styles.txRow} onPress={() => router.push("/(os)/wallet/history")}>
              <View style={styles.txIcon}>{getIcon(tx.type)}</View>
              <View style={styles.txInfo}>
                <Text style={styles.txType}>{tx.type.replace("_", " ").toUpperCase()}</Text>
                <Text style={styles.txDate}>{new Date(tx.createdAt || tx.timestamp).toLocaleDateString()}</Text>
              </View>
              <Text style={[styles.txAmount, tx.type === "receive" || tx.type === "deposit" ? styles.income : styles.expense]}>
                {tx.type === "receive" || tx.type === "deposit" ? "+" : "-"} KSh {tx.amount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#1F2937" },
  headerActions: { flexDirection: "row", gap: 12 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: -4, right: -4, backgroundColor: "#EF4444", borderRadius: 10, minWidth: 18, height: 18, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "700" },
  balanceCard: { backgroundColor: "#1E40AF", marginHorizontal: 20, borderRadius: 20, padding: 24, marginBottom: 20 },
  balanceHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  balanceLabel: { fontSize: 14, color: "#93C5FD" },
  balanceAmount: { fontSize: 36, fontWeight: "800", color: "#FFF", marginBottom: 4 },
  balanceCurrency: { fontSize: 13, color: "#93C5FD" },
  goFundBanner: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 16, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  goFundText: { fontSize: 13, color: "#FFF", fontWeight: "600" },
  actionsRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 20, marginBottom: 24 },
  actionBtn: { alignItems: "center", gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  actionText: { fontSize: 12, fontWeight: "600", color: "#374151" },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  seeAll: { fontSize: 13, fontWeight: "600", color: "#3B82F6" },
  emptyState: { alignItems: "center", paddingVertical: 32 },
  emptyText: { fontSize: 14, color: "#9CA3AF" },
  txRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF", padding: 14, borderRadius: 12, marginBottom: 8, gap: 12 },
  txIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1 },
  txType: { fontSize: 13, fontWeight: "700", color: "#1F2937", textTransform: "capitalize" },
  txDate: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "700" },
  income: { color: "#10B981" },
  expense: { color: "#EF4444" },
});
