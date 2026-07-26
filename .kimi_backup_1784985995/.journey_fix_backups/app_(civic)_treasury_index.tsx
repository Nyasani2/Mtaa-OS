// app/(civic)/treasury/index.tsx — MTAA Treasury Dashboard
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

interface TreasuryMetric {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: string;
  color: string;
}

interface BudgetItem {
  category: string;
  allocated: number;
  spent: number;
  color: string;
}

const METRICS: TreasuryMetric[] = [
  { label: "Total Revenue", value: "KES 847.2B", change: "+12.4%", positive: true, icon: "cash", color: "#10B981" },
  { label: "Total Expenditure", value: "KES 723.8B", change: "+8.1%", positive: false, icon: "trending-up", color: "#EF4444" },
  { label: "Budget Surplus", value: "KES 123.4B", change: "+34.2%", positive: true, icon: "wallet", color: "#0EA5E9" },
  { label: "Escrow Holdings", value: "KES 89.6B", change: "+5.7%", positive: true, icon: "shield-checkmark", color: "#8B5CF6" },
];

const BUDGET_ITEMS: BudgetItem[] = [
  { category: "Infrastructure", allocated: 245.0, spent: 198.3, color: "#0EA5E9" },
  { category: "Healthcare", allocated: 156.0, spent: 142.7, color: "#10B981" },
  { category: "Education", allocated: 134.0, spent: 128.5, color: "#F59E0B" },
  { category: "Security", allocated: 98.0, spent: 89.2, color: "#EF4444" },
  { category: "Agriculture", allocated: 67.0, spent: 45.8, color: "#8B5CF6" },
  { category: "Technology", allocated: 45.0, spent: 38.4, color: "#EC4899" },
];

const RECENT_TRANSACTIONS = [
  { id: "TX-001", desc: "County allocation — Nairobi", amount: "KES 2.4B", type: "out", date: "Today" },
  { id: "TX-002", desc: "VAT collection — Q2", amount: "KES 18.7B", type: "in", date: "Today" },
  { id: "TX-003", desc: "Road construction — Mombasa", amount: "KES 890M", type: "out", date: "Yesterday" },
  { id: "TX-004", desc: "Customs duty — Port", amount: "KES 4.2B", type: "in", date: "Yesterday" },
  { id: "TX-005", desc: "School infrastructure — Kisumu", amount: "KES 340M", type: "out", date: "2 days ago" },
];

export default function TreasuryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "budget" | "transactions">("overview");

  const renderMetricCard = (metric: TreasuryMetric, index: number) => (
    <View key={index} style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${metric.color}20` }]}>
        <Ionicons name={metric.icon as any} size={20} color={metric.color} />
      </View>
      <Text style={styles.metricLabel}>{metric.label}</Text>
      <Text style={styles.metricValue}>{metric.value}</Text>
      <Text style={[styles.metricChange, { color: metric.positive ? "#10B981" : "#EF4444" }]}>
        {metric.change} from last quarter
      </Text>
    </View>
  );

  const renderBudgetBar = (item: BudgetItem, index: number) => {
    const pct = (item.spent / item.allocated) * 100;
    return (
      <View key={index} style={styles.budgetRow}>
        <View style={styles.budgetHeader}>
          <Text style={styles.budgetCategory}>{item.category}</Text>
          <Text style={styles.budgetNumbers}>
            KES {item.spent}B / {item.allocated}B
          </Text>
        </View>
        <View style={styles.budgetTrack}>
          <View style={[styles.budgetFill, { width: `${pct}%`, backgroundColor: item.color }]} />
        </View>
        <Text style={styles.budgetPct}>{pct.toFixed(1)}% utilized</Text>
      </View>
    );
  };

  const renderTransaction = (tx: typeof RECENT_TRANSACTIONS[0], index: number) => (
    <View key={index} style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: tx.type === "in" ? "#10B98120" : "#EF444420" }]}>
        <Ionicons
          name={tx.type === "in" ? "arrow-down" : "arrow-up"}
          size={16}
          color={tx.type === "in" ? "#10B981" : "#EF4444"}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc}>{tx.desc}</Text>
        <Text style={styles.txId}>{tx.id} · {tx.date}</Text>
      </View>
      <Text style={[styles.txAmount, { color: tx.type === "in" ? "#10B981" : "#EF4444" }]}>
        {tx.type === "in" ? "+" : "-"}{tx.amount}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="cash" size={20} color="#10B981" />
          <Text style={styles.headerTitle}>Treasury</Text>
        </View>
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="ellipsis-horizontal" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(["overview", "budget", "transactions"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "overview" && (
          <>
            {/* Metrics Grid */}
            <View style={styles.metricsGrid}>
              {METRICS.map(renderMetricCard)}
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="send" size={20} color="#0EA5E9" />
                <Text style={styles.actionText}>Disburse</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="download" size={20} color="#10B981" />
                <Text style={styles.actionText}>Collect</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="document-text" size={20} color="#F59E0B" />
                <Text style={styles.actionText}>Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="people" size={20} color="#8B5CF6" />
                <Text style={styles.actionText}>Counties</Text>
              </TouchableOpacity>
            </View>

            {/* Revenue Trend Card */}
            <View style={styles.trendCard}>
              <View style={styles.trendHeader}>
                <Text style={styles.trendTitle}>Revenue Trend</Text>
                <Text style={styles.trendPeriod}>FY 2025/26</Text>
              </View>
              <View style={styles.trendBars}>
                {[65, 78, 72, 85, 90, 88, 92, 87, 95, 98, 102, 110].map((h, i) => (
                  <View key={i} style={styles.trendBarContainer}>
                    <View style={[styles.trendBar, { height: h * 0.8, backgroundColor: h > 90 ? "#10B981" : "#0EA5E9" }]} />
                  </View>
                ))}
              </View>
              <View style={styles.trendLabels}>
                <Text style={styles.trendLabel}>Jul</Text>
                <Text style={styles.trendLabel}>Sep</Text>
                <Text style={styles.trendLabel}>Nov</Text>
                <Text style={styles.trendLabel}>Jan</Text>
                <Text style={styles.trendLabel}>Mar</Text>
                <Text style={styles.trendLabel}>May</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === "budget" && (
          <>
            <Text style={styles.sectionTitle}>Budget Allocation</Text>
            <View style={styles.budgetCard}>
              {BUDGET_ITEMS.map(renderBudgetBar)}
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Budget Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Allocated</Text>
                <Text style={styles.summaryValue}>KES 745.0B</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Spent</Text>
                <Text style={styles.summaryValue}>KES 642.9B</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Remaining</Text>
                <Text style={[styles.summaryValue, { color: "#10B981" }]}>KES 102.1B</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Utilization Rate</Text>
                <Text style={styles.summaryValue}>86.3%</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === "transactions" && (
          <>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <View style={styles.txCard}>
              {RECENT_TRANSACTIONS.map(renderTransaction)}
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  tabActive: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
  },
  tabText: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#10B981",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 42) / 2,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  metricIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  metricLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "500",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 4,
  },
  metricChange: {
    fontSize: 11,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  actionText: {
    fontSize: 11,
    color: "#CBD5E1",
    fontWeight: "500",
  },
  trendCard: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  trendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  trendTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  trendPeriod: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  trendBars: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 80,
    gap: 4,
  },
  trendBarContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  trendBar: {
    width: "80%",
    borderRadius: 3,
    minHeight: 4,
  },
  trendLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  trendLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "400",
  },
  budgetCard: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 16,
  },
  budgetRow: {
    marginBottom: 16,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  budgetCategory: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  budgetNumbers: {
    fontSize: 12,
    color: "#94A3B8",
    fontWeight: "400",
  },
  budgetTrack: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  budgetFill: {
    height: "100%",
    borderRadius: 4,
  },
  budgetPct: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "400",
  },
  summaryCard: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  summaryTitle: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  summaryLabel: {
    fontSize: 13,
    color: "#94A3B8",
    fontWeight: "400",
  },
  summaryValue: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  txCard: {
    backgroundColor: "rgba(30, 41, 59, 0.8)",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "500",
    marginBottom: 2,
  },
  txId: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "400",
  },
  txAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
});

