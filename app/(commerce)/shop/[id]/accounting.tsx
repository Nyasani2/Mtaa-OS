// @ts-nocheck
// app/(commerce)/shop/[id]/accounting.tsx
// Shop Financial Command Center — Accounting Dashboard
// Fixed: supabase import path corrected to @/lib/supabase

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useShop } from '@/domains/shop/hooks/useShop';
import { supabase } from '@/lib/supabase';

// ─── Types ─────────────────────────────────────────────────────

interface FinancialMetric {
  label: string;
  value: number;
  currency: string;
  change?: number;
  icon: string;
  color: string;
}

interface ExpenseCategory {
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

interface Receivable {
  customer_name: string;
  amount: number;
  days_overdue: number;
  invoice_count: number;
}

interface Payable {
  supplier_name: string;
  amount: number;
  days_overdue: number;
}

interface TaxEntry {
  type: string;
  amount: number;
  rate: number;
  period: string;
}

interface ReportType {
  id: string;
  name: string;
  icon: string;
  description: string;
}

// ─── Constants ─────────────────────────────────────────────────

const REPORTS: ReportType[] = [
  { id: 'pl', name: 'Profit & Loss', icon: 'trending-up', description: 'Revenue vs Expenses' },
  { id: 'balance', name: 'Balance Sheet', icon: 'scale', description: 'Assets & Liabilities' },
  { id: 'cashflow', name: 'Cash Flow', icon: 'swap-horizontal', description: 'Inflows & Outflows' },
  { id: 'revenue', name: 'Revenue Report', icon: 'cash', description: 'Revenue Breakdown' },
  { id: 'expense', name: 'Expense Report', icon: 'receipt', description: 'Expense Analysis' },
  { id: 'tax', name: 'Tax Report', icon: 'document-text', description: 'Tax Summary' },
  { id: 'inventory', name: 'Inventory Valuation', icon: 'cube', description: 'Stock Value' },
  { id: 'supplier', name: 'Supplier Report', icon: 'people', description: 'Supplier Analysis' },
  { id: 'branch', name: 'Branch Comparison', icon: 'git-branch', description: 'Branch Performance' },
];

const EXPENSE_CATEGORIES = [
  { name: 'Inventory', color: '#007AFF' },
  { name: 'Supplier', color: '#34C759' },
  { name: 'Payroll', color: '#FF9500' },
  { name: 'Operations', color: '#FF3B30' },
  { name: 'Transport', color: '#AF52DE' },
  { name: 'Utilities', color: '#5856D6' },
  { name: 'Taxes', color: '#FF2D55' },
  { name: 'Other', color: '#8E8E93' },
];

// ─── Main Component ────────────────────────────────────────────

export default function AccountingScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { shop } = useShop(shopId);

  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Fetch all accounting data
  const fetchData = useCallback(async () => {
    if (!shopId) return;
    setLoading(true);
    setError(null);

    try {
      // Get date range for period
      const now = new Date();
      let startDate: Date;
      switch (period) {
        case 'today': startDate = new Date(now.setHours(0, 0, 0, 0)); break;
        case 'week': startDate = new Date(now.setDate(now.getDate() - 7)); break;
        case 'month': startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
        case 'quarter': startDate = new Date(now.setMonth(now.getMonth() - 3)); break;
        case 'year': startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
      }

      const startIso = startDate!.toISOString();

      // Fetch orders (revenue)
      const { data: orders, error: ordersErr } = await supabase
        .from('shop_orders')
        .select('total_amount, status, created_at')
        .eq('shop_id', shopId)
        .gte('created_at', startIso);

      if (ordersErr) throw ordersErr;

      // Fetch expenses
      const { data: expenses, error: expErr } = await supabase
        .from('shop_expenses')
        .select('amount, category, created_at')
        .eq('shop_id', shopId)
        .gte('created_at', startIso);

      if (expErr) throw expErr;

      // Fetch wallet transactions
      const { data: walletTxs, error: walletErr } = await supabase
        .from('wallet_transactions')
        .select('amount, type, status, created_at')
        .eq('reference_type', 'shop')
        .eq('reference_id', shopId)
        .gte('created_at', startIso);

      if (walletErr) throw walletErr;

      // Calculate metrics
      const completedOrders = (orders || []).filter((o: any) => o.status === 'completed' || o.status === 'paid');
      const revenue = completedOrders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
      const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + (e.amount || 0), 0);
      const grossProfit = revenue - totalExpenses;

      // Expense breakdown
      const expenseBreakdown: ExpenseCategory[] = EXPENSE_CATEGORIES.map(cat => {
        const catExpenses = (expenses || []).filter((e: any) => (e.category || 'Other') === cat.name);
        const amount = catExpenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
        return {
          name: cat.name,
          amount,
          color: cat.color,
          percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0,
        };
      }).filter((e: ExpenseCategory) => e.amount > 0);

      // Receivables (pending orders)
      const pendingOrders = (orders || []).filter((o: any) => o.status === 'pending');
      const receivablesTotal = pendingOrders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);

      // Tax (simplified — pull from shop config or calculate)
      const taxRate = shop?.tax_rate || 0.16;
      const taxLiability = revenue * taxRate;

      setData({
        revenue,
        expenses: totalExpenses,
        grossProfit,
        netProfit: grossProfit - taxLiability,
        receivables: receivablesTotal,
        payables: 0, // Would need supplier invoice data
        taxLiability,
        expenseBreakdown,
        orderCount: completedOrders.length,
        pendingOrders: pendingOrders.length,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  }, [shopId, period, shop?.tax_rate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  // Business health score (0-100)
  const healthScore = useMemo(() => {
    if (!data) return 0;
    let score = 50;
    if (data.grossProfit > 0) score += 20;
    if (data.receivables < data.revenue * 0.3) score += 15;
    if (data.expenses < data.revenue * 0.7) score += 15;
    return Math.min(100, Math.max(0, score));
  }, [data]);

  const healthStatus = healthScore >= 80 ? 'Excellent' : healthScore >= 60 ? 'Good' : healthScore >= 40 ? 'Fair' : 'At Risk';
  const healthColor = healthScore >= 80 ? '#34C759' : healthScore >= 60 ? '#007AFF' : healthScore >= 40 ? '#FF9500' : '#FF3B30';

  const formatCurrency = (amount: number) => {
    return `KES ${(amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // ─── Render ──────────────────────────────────────────────────

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading financial data...</Text>
      </View>
    );
  }

  if (error && !data) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accounting</Text>
        <TouchableOpacity onPress={() => router.push(`/(commerce)/shop/${shopId}/settings`)}>
          <Ionicons name="settings-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
        {(['today', 'week', 'month', 'quarter', 'year'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Health Score */}
      <View style={[styles.healthCard, { borderLeftColor: healthColor }]}>
        <View style={styles.healthRow}>
          <View>
            <Text style={styles.healthLabel}>Business Health</Text>
            <Text style={[styles.healthScore, { color: healthColor }]}>{healthScore}/100</Text>
          </View>
          <View style={[styles.healthBadge, { backgroundColor: `${healthColor}15` }]}>
            <Text style={[styles.healthStatus, { color: healthColor }]}>{healthStatus}</Text>
          </View>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.cardsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Revenue</Text>
          <Text style={styles.metricValue}>{formatCurrency(data?.revenue)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Expenses</Text>
          <Text style={[styles.metricValue, { color: '#FF3B30' }]}>{formatCurrency(data?.expenses)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Gross Profit</Text>
          <Text style={[styles.metricValue, { color: data?.grossProfit >= 0 ? '#34C759' : '#FF3B30' }]}>
            {formatCurrency(data?.grossProfit)}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Net Profit</Text>
          <Text style={[styles.metricValue, { color: data?.netProfit >= 0 ? '#34C759' : '#FF3B30' }]}>
            {formatCurrency(data?.netProfit)}
          </Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Receivables</Text>
          <Text style={styles.metricValue}>{formatCurrency(data?.receivables)}</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricLabel}>Tax Liability</Text>
          <Text style={[styles.metricValue, { color: '#FF9500' }]}>{formatCurrency(data?.taxLiability)}</Text>
        </View>
      </View>

      {/* Expense Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Expense Breakdown</Text>
        {data?.expenseBreakdown?.length === 0 ? (
          <Text style={styles.emptyText}>No expenses this period</Text>
        ) : (
          data?.expenseBreakdown?.map((cat: ExpenseCategory) => (
            <View key={cat.name} style={styles.expenseRow}>
              <View style={styles.expenseLabel}>
                <View style={[styles.expenseDot, { backgroundColor: cat.color }]} />
                <Text style={styles.expenseName}>{cat.name}</Text>
              </View>
              <View style={styles.expenseBarContainer}>
                <View style={[styles.expenseBar, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
              </View>
              <Text style={styles.expenseAmount}>{formatCurrency(cat.amount)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Financial Reports */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Reports</Text>
        <View style={styles.reportsGrid}>
          {REPORTS.map(report => (
            <TouchableOpacity
              key={report.id}
              style={styles.reportCard}
              onPress={() => Alert.alert(report.name, `${report.description}\n\nReport generation will be implemented.`)}
            >
              <Ionicons name={report.icon as any} size={24} color="#007AFF" />
              <Text style={styles.reportName}>{report.name}</Text>
              <Text style={styles.reportDesc}>{report.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/(commerce)/shop/${shopId}/pos`)}
          >
            <Ionicons name="cash-register" size={22} color="#007AFF" />
            <Text style={styles.actionLabel}>Open POS</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/(commerce)/shop/${shopId}/wallet`)}
          >
            <Ionicons name="wallet" size={22} color="#34C759" />
            <Text style={styles.actionLabel}>Wallet</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push(`/(commerce)/shop/${shopId}/analytics`)}
          >
            <Ionicons name="bar-chart" size={22} color="#FF9500" />
            <Text style={styles.actionLabel}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#8E8E93' },
  errorText: { marginTop: 12, fontSize: 15, color: '#FF3B30', textAlign: 'center' },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000' },

  periodScroll: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  periodBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    marginHorizontal: 4,
  },
  periodBtnActive: { backgroundColor: '#007AFF' },
  periodText: { fontSize: 13, color: '#666', fontWeight: '600' },
  periodTextActive: { color: '#fff' },

  healthCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  healthRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  healthLabel: { fontSize: 13, color: '#8E8E93', marginBottom: 4 },
  healthScore: { fontSize: 28, fontWeight: '800' },
  healthBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  healthStatus: { fontSize: 13, fontWeight: '700' },

  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: '1%',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  metricLabel: { fontSize: 12, color: '#8E8E93', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricValue: { fontSize: 18, fontWeight: '800', color: '#000' },

  section: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#000', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#8E8E93', textAlign: 'center', paddingVertical: 16 },

  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  expenseLabel: { flexDirection: 'row', alignItems: 'center', width: 90 },
  expenseDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  expenseName: { fontSize: 13, color: '#333', fontWeight: '500' },
  expenseBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    marginHorizontal: 8,
  },
  expenseBar: { height: 6, borderRadius: 3 },
  expenseAmount: { fontSize: 13, fontWeight: '600', color: '#000', width: 80, textAlign: 'right' },

  reportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  reportCard: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    marginHorizontal: '1%',
    marginBottom: 8,
    alignItems: 'center',
  },
  reportName: { fontSize: 13, fontWeight: '700', color: '#000', marginTop: 8, textAlign: 'center' },
  reportDesc: { fontSize: 11, color: '#8E8E93', marginTop: 2, textAlign: 'center' },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    width: '30%',
  },
  actionLabel: { fontSize: 12, color: '#333', marginTop: 6, fontWeight: '500' },
});
