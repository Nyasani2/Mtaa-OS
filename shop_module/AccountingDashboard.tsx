// components/shop/AccountingDashboard.tsx
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from "react-native";
import { AccountingService } from "@/lib/shop/services/accountingService";
import { ShopAccount, ShopExpense } from "@/lib/shop/types";

interface AccountingDashboardProps {
  shopId: string;
}

export default function AccountingDashboard({ shopId }: AccountingDashboardProps) {
  const [accounts, setAccounts] = useState<ShopAccount[]>([]);
  const [expenses, setExpenses] = useState<ShopExpense[]>([]);
  const [report, setReport] = useState<any>(null);
  const [activeView, setActiveView] = useState<"accounts" | "reports" | "expenses">("accounts");
  const [period, setPeriod] = useState("month");

  useEffect(() => { loadData(); }, [shopId, activeView, period]);

  const loadData = async () => {
    try {
      if (activeView === "accounts") {
        const accs = await AccountingService.getAccounts(shopId);
        setAccounts(accs);
      } else if (activeView === "expenses") {
        const exps = await AccountingService.getExpenses(shopId);
        setExpenses(exps);
      } else if (activeView === "reports") {
        const endDate = new Date().toISOString().split("T")[0];
        const startDate = getPeriodStart(period);
        const pl = await AccountingService.getProfitLoss(shopId, startDate, endDate);
        setReport(pl);
      }
    } catch (e) {
      Alert.alert("Error", (e as Error).message);
    }
  };

  const getPeriodStart = (p: string) => {
    const d = new Date();
    if (p === "week") d.setDate(d.getDate() - 7);
    if (p === "month") d.setMonth(d.getMonth() - 1);
    if (p === "quarter") d.setMonth(d.getMonth() - 3);
    if (p === "year") d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split("T")[0];
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Accounting</Text>
      <View style={styles.tabRow}>
        {(["accounts", "reports", "expenses"] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeView === tab && styles.tabActive]} onPress={() => setActiveView(tab)}>
            <Text style={[styles.tabText, activeView === tab && styles.tabTextActive]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {activeView === "accounts" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chart of Accounts</Text>
          {accounts.map((account) => (
            <View key={account.id} style={styles.accountRow}>
              <View style={styles.accountInfo}>
                <Text style={styles.accountCode}>{account.code}</Text>
                <Text style={styles.accountName}>{account.name}</Text>
                <Text style={styles.accountType}>{account.type}</Text>
              </View>
              <Text style={[styles.accountBalance, account.current_balance < 0 && styles.negative]}>R{account.current_balance.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}
      {activeView === "reports" && report && (
        <View style={styles.section}>
          <View style={styles.periodRow}>
            {["week", "month", "quarter", "year"].map((p) => (
              <TouchableOpacity key={p} style={[styles.periodChip, period === p && styles.periodChipActive]} onPress={() => setPeriod(p)}>
                <Text style={[styles.periodChipText, period === p && styles.periodChipTextActive]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Profit & Loss</Text>
            <View style={styles.reportRow}><Text style={styles.reportLabel}>Revenue</Text><Text style={styles.reportValue}>R{report.revenue?.toFixed(2) || "0.00"}</Text></View>
            <View style={styles.reportRow}><Text style={styles.reportLabel}>Cost of Goods</Text><Text style={styles.reportValue}>R{report.cogs?.toFixed(2) || "0.00"}</Text></View>
            <View style={styles.reportRow}><Text style={styles.reportLabel}>Gross Profit</Text><Text style={[styles.reportValue, styles.positive]}>R{report.gross_profit?.toFixed(2) || "0.00"}</Text></View>
            <View style={styles.reportRow}><Text style={styles.reportLabel}>Expenses</Text><Text style={styles.reportValue}>R{report.expenses?.toFixed(2) || "0.00"}</Text></View>
            <View style={[styles.reportRow, styles.totalRow]}><Text style={styles.totalLabel}>Net Profit</Text><Text style={[styles.totalValue, (report.net_profit || 0) >= 0 ? styles.positive : styles.negative]}>R{report.net_profit?.toFixed(2) || "0.00"}</Text></View>
            <Text style={styles.marginText}>Margin: {report.net_margin || "0"}%</Text>
          </View>
        </View>
      )}
      {activeView === "expenses" && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          {expenses.map((expense) => (
            <View key={expense.id} style={styles.expenseRow}>
              <View>
                <Text style={styles.expenseCategory}>{expense.category}</Text>
                <Text style={styles.expenseDesc}>{expense.description || "No description"}</Text>
                <Text style={styles.expenseDate}>{expense.expense_date}</Text>
              </View>
              <Text style={styles.expenseAmount}>R{expense.total_amount.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { color: "#f8fafc", fontSize: 24, fontWeight: "700", padding: 20 },
  tabRow: { flexDirection: "row", paddingHorizontal: 12, marginBottom: 16, gap: 8 },
  tab: { flex: 1, backgroundColor: "#1e293b", paddingVertical: 12, borderRadius: 10, alignItems: "center" },
  tabActive: { backgroundColor: "#3b82f6" },
  tabText: { color: "#94a3b8", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  section: { padding: 16 },
  sectionTitle: { color: "#94a3b8", fontSize: 14, fontWeight: "600", textTransform: "uppercase", marginBottom: 12 },
  accountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  accountInfo: { flex: 1 },
  accountCode: { color: "#64748b", fontSize: 12, fontFamily: "monospace" },
  accountName: { color: "#f8fafc", fontSize: 15, fontWeight: "500" },
  accountType: { color: "#64748b", fontSize: 12, textTransform: "capitalize" },
  accountBalance: { color: "#22c55e", fontSize: 16, fontWeight: "600" },
  negative: { color: "#ef4444" },
  positive: { color: "#22c55e" },
  periodRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  periodChip: { backgroundColor: "#1e293b", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  periodChipActive: { backgroundColor: "#3b82f6" },
  periodChipText: { color: "#94a3b8" },
  periodChipTextActive: { color: "#fff" },
  reportCard: { backgroundColor: "#1e293b", borderRadius: 12, padding: 20 },
  reportTitle: { color: "#f8fafc", fontSize: 18, fontWeight: "700", marginBottom: 16 },
  reportRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  reportLabel: { color: "#94a3b8" },
  reportValue: { color: "#f8fafc", fontWeight: "600" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#334155", marginTop: 8, paddingTop: 12 },
  totalLabel: { color: "#f8fafc", fontSize: 18, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "700" },
  marginText: { color: "#64748b", marginTop: 8, textAlign: "right" },
  expenseRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  expenseCategory: { color: "#f8fafc", fontWeight: "500" },
  expenseDesc: { color: "#64748b", fontSize: 13, marginTop: 2 },
  expenseDate: { color: "#475569", fontSize: 12, marginTop: 2 },
  expenseAmount: { color: "#ef4444", fontWeight: "600", fontSize: 16 },
});
