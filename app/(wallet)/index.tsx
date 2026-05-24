import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowUpRight,
  ArrowDownLeft,
  QrCode,
  Shield,
  Bell,
  Settings,
  Eye,
  EyeOff,
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  ChevronRight,
  Zap,
  Landmark,
  Banknote,
  Send,
  ScanLine,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useWalletStore } from "@/lib/modules/wallet/store";
import type { WalletTransaction } from "@/lib/modules/wallet/types";

const { width } = Dimensions.get("window");

export default function WalletHome() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  const {
    accounts,
    activeAccountId,
    transactions,
    goFund,
    notifications,
    settings,
    setActiveAccount,
  } = useWalletStore();

  const activeAccount = accounts.find((a) => a.id === activeAccountId) || accounts[0];
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const recentTx = transactions.slice(0, 5);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  const formatMoney = (amount: number) => {
    if (settings.hideBalance && !showBalance) return "****";
    return `KSh ${amount.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getTxIcon = (tx: WalletTransaction) => {
    switch (tx.type) {
      case "send": return <ArrowUpRight size={20} color="#EF4444" />;
      case "receive": return <ArrowDownLeft size={20} color="#10B981" />;
      case "deposit": return <ArrowDownLeft size={20} color="#3B82F6" />;
      case "withdraw": return <ArrowUpRight size={20} color="#F59E0B" />;
      case "qr_pay": return <QrCode size={20} color="#8B5CF6" />;
      case "go_fund_draw": return <Zap size={20} color="#F97316" />;
      case "go_fund_repay": return <TrendingUp size={20} color="#10B981" />;
      case "escrow_hold": return <Shield size={20} color="#6366F1" />;
      default: return <Wallet size={20} color="#6B7280" />;
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10B981" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>My Wallet</Text>
            <Text style={styles.subGreeting}>{activeAccount.name}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/(wallet)/notifications")}
            >
              <Bell size={22} color="#1F2937" />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => router.push("/(wallet)/settings")}
            >
              <Settings size={22} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <LinearGradient
          colors={["#10B981", "#059669"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              {showBalance ? (
                <EyeOff size={18} color="rgba(255,255,255,0.8)" />
              ) : (
                <Eye size={18} color="rgba(255,255,255,0.8)" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={styles.balanceAmount}>{formatMoney(activeAccount.balance)}</Text>
          <View style={styles.balanceFooter}>
            <Text style={styles.balanceCurrency}>Kenyan Shilling</Text>
            <View style={styles.accountSwitcher}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[
                    styles.accountDot,
                    acc.id === activeAccountId && styles.accountDotActive,
                  ]}
                  onPress={() => setActiveAccount(acc.id)}
                />
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Go Fund Card (if active) */}
        {goFund.isActive && goFund.isEligible && (
          <TouchableOpacity
            style={styles.goFundCard}
            onPress={() => router.push("/(wallet)/credit")}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#F97316", "#EA580C"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.goFundGradient}
            >
              <View style={styles.goFundRow}>
                <View style={styles.goFundIconWrap}>
                  <Zap size={20} color="#F97316" />
                </View>
                <View style={styles.goFundInfo}>
                  <Text style={styles.goFundTitle}>Go Fund</Text>
                  <Text style={styles.goFundSubtitle}>
                    {goFund.creditUsed > 0
                      ? `KSh ${goFund.creditUsed.toLocaleString()} used · Due ${new Date(goFund.dueDate || "").toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`
                      : `KSh ${goFund.creditAvailable.toLocaleString()} available`}
                  </Text>
                </View>
                <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
              </View>
              {goFund.creditUsed > 0 && (
                <View style={styles.goFundBarBg}>
                  <View
                    style={[
                      styles.goFundBarFill,
                      { width: `${(goFund.creditUsed / goFund.creditLimit) * 100}%` },
                    ]}
                  />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(wallet)/send")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FEF3C7" }]}>
              <Send size={22} color="#D97706" />
            </View>
            <Text style={styles.actionLabel}>Send</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(wallet)/deposit")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#DBEAFE" }]}>
              <ArrowDownLeft size={22} color="#2563EB" />
            </View>
            <Text style={styles.actionLabel}>Deposit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(wallet)/withdraw")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FCE7F3" }]}>
              <ArrowUpRight size={22} color="#BE185D" />
            </View>
            <Text style={styles.actionLabel}>Withdraw</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(wallet)/qr-pay")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#EDE9FE" }]}>
              <ScanLine size={22} color="#7C3AED" />
            </View>
            <Text style={styles.actionLabel}>QR Pay</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(wallet)/escrow")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#E0E7FF" }]}>
              <Shield size={22} color="#4338CA" />
            </View>
            <Text style={styles.actionLabel}>Escrow</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/(wallet)/credit")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FFEDD5" }]}>
              <Zap size={22} color="#EA580C" />
            </View>
            <Text style={styles.actionLabel}>Go Fund</Text>
          </TouchableOpacity>
        </View>

        {/* Income / Expense Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: "#ECFDF5" }]}>
            <View style={styles.summaryIconWrap}>
              <TrendingUp size={16} color="#10B981" />
            </View>
            <Text style={styles.summaryLabel}>Income (30d)</Text>
            <Text style={[styles.summaryAmount, { color: "#10B981" }]}>
              KSh 124,500
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: "#FEF2F2" }]}>
            <View style={styles.summaryIconWrap}>
              <TrendingDown size={16} color="#EF4444" />
            </View>
            <Text style={styles.summaryLabel}>Spent (30d)</Text>
            <Text style={[styles.summaryAmount, { color: "#EF4444" }]}>
              KSh 87,320
            </Text>
          </View>
        </View>

        {/* Linked Cards / Banks */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Linked Accounts</Text>
          <TouchableOpacity>
            <Text style={styles.sectionAction}>Manage</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cardsScroll}>
          <View style={styles.linkedCard}>
            <Landmark size={20} color="#3B82F6" />
            <Text style={styles.linkedCardText}>KCB Bank</Text>
            <Text style={styles.linkedCardSub}>****4521</Text>
          </View>
          <View style={styles.linkedCard}>
            <CreditCard size={20} color="#8B5CF6" />
            <Text style={styles.linkedCardText}>Visa</Text>
            <Text style={styles.linkedCardSub}>****8842</Text>
          </View>
          <View style={styles.linkedCard}>
            <Banknote size={20} color="#10B981" />
            <Text style={styles.linkedCardText}>M-Pesa</Text>
            <Text style={styles.linkedCardSub}>07****2345</Text>
          </View>
        </ScrollView>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => router.push("/(wallet)/history")}>
            <Text style={styles.sectionAction}>See All</Text>
          </TouchableOpacity>
        </View>

        {recentTx.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={40} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptySub}>Send money or make a deposit to get started</Text>
          </View>
        ) : (
          recentTx.map((tx) => (
            <TouchableOpacity key={tx.id} style={styles.txRow}>
              <View style={[styles.txIconWrap, { backgroundColor: getTxColor(tx) + "15" }]}>
                {getTxIcon(tx)}
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txName} numberOfLines={1}>
                  {tx.recipientName || tx.description || tx.type}
                </Text>
                <Text style={styles.txDate}>
                  {new Date(tx.createdAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
              <Text style={[styles.txAmount, { color: getTxColor(tx) }]}>
                {tx.type === "receive" || tx.type === "deposit" || tx.type === "go_fund_repay"
                  ? "+"
                  : "-"}
                KSh {tx.amount.toLocaleString()}
              </Text>
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  greeting: { fontSize: 24, fontWeight: "800", color: "#1F2937" },
  subGreeting: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#FFF", fontSize: 10, fontWeight: "700" },

  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  balanceLabel: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  balanceAmount: { fontSize: 32, fontWeight: "800", color: "#FFF", marginBottom: 12 },
  balanceFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  balanceCurrency: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  accountSwitcher: { flexDirection: "row", gap: 6 },
  accountDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.4)" },
  accountDotActive: { backgroundColor: "#FFF", width: 20 },

  goFundCard: { marginHorizontal: 20, borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  goFundGradient: { padding: 16 },
  goFundRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  goFundIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  goFundInfo: { flex: 1 },
  goFundTitle: { fontSize: 15, fontWeight: "700", color: "#FFF" },
  goFundSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  goFundBarBg: {
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    marginTop: 12,
  },
  goFundBarFill: { height: 4, backgroundColor: "#FFF", borderRadius: 2 },

  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  actionBtn: {
    width: (width - 56) / 3,
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#FFF",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },

  summaryRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  summaryLabel: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  summaryAmount: { fontSize: 16, fontWeight: "700" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1F2937" },
  sectionAction: { fontSize: 13, color: "#10B981", fontWeight: "600" },

  cardsScroll: { paddingHorizontal: 20, marginBottom: 20 },
  linkedCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginRight: 10,
    minWidth: 120,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  linkedCardText: { fontSize: 13, fontWeight: "600", color: "#374151", marginTop: 8 },
  linkedCardSub: { fontSize: 11, color: "#9CA3AF", marginTop: 2 },

  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: "#FFF",
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 14,
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
  txDate: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "700" },

  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    marginHorizontal: 20,
    backgroundColor: "#FFF",
    borderRadius: 16,
  },
  emptyTitle: { fontSize: 15, fontWeight: "600", color: "#6B7280", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4, textAlign: "center" },
});
