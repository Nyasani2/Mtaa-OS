// ============================================================================
// MTAA Restaurant Module — Reports Screen
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions
} from 'react-native';
import { useReports, useDashboardAutoRefresh } from '@/lib/restaurant/hooks';

const { width } = Dimensions.get('window');

export default function RestaurantReports() {
  const {
    dailySales, salesPeriod, profitLoss, topItems, staffPerformance,
    isLoading, error, loadDailySales, loadSalesPeriod, loadProfitLoss,
    loadTopItems, loadStaffPerformance, exportCSV, clearError
  } = useReports();

  const { metrics } = useDashboardAutoRefresh();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'sales' | 'items' | 'staff' | 'p&l'>('sales');
  const [periodFilter, setPeriodFilter] = useState<'day' | 'week' | 'month'>('day');

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadDailySales(today);
    loadSalesPeriod('day', today);
    loadTopItems('today', 10);
    loadStaffPerformance(undefined, 'today');
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadDailySales(today),
      loadSalesPeriod(periodFilter, today),
      loadTopItems('today', 10),
      loadStaffPerformance(undefined, 'today'),
    ]);
    setRefreshing(false);
  };

  const handleExport = async (type: string) => {
    try {
      const url = await exportCSV(type, { date: today, period: periodFilter });
      // In real app, open download URL
      console.log('Export URL:', url);
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <TouchableOpacity style={styles.exportButton} onPress={() => handleExport(activeTab)}>
          <Text style={styles.exportButtonText}>📥 Export</Text>
        </TouchableOpacity>
      </View>

      {/* Period Filter */}
      <View style={styles.periodBar}>
        {(['day', 'week', 'month'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodChip, periodFilter === p && styles.periodChipActive]}
            onPress={() => { setPeriodFilter(p); loadSalesPeriod(p, today); }}
          >
            <Text style={[styles.periodChipText, periodFilter === p && styles.periodChipTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Selector */}
      <View style={styles.tabBar}>
        {(['sales', 'items', 'staff', 'p&l'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'p&l' ? 'P&L' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <View style={styles.tabContent}>
          {dailySales && (
            <View style={styles.reportCard}>
              <Text style={styles.reportTitle}>Daily Sales — {today}</Text>
              <View style={styles.salesGrid}>
                <SalesMetric label="Total Sales" value={`£${dailySales.total_sales?.toFixed(2)}`} color="#10B981" />
                <SalesMetric label="Orders" value={String(dailySales.total_orders || 0)} />
                <SalesMetric label="Avg Ticket" value={`£${dailySales.average_ticket?.toFixed(2)}`} />
                <SalesMetric label="Refunds" value={`£${dailySales.refunds?.toFixed(2)}`} color="#EF4444" />
              </View>
            </View>
          )}

          {salesPeriod && (
            <View style={styles.reportCard}>
              <Text style={styles.reportTitle}>Sales Trend ({periodFilter})</Text>
              <View style={styles.chartPlaceholder}>
                <Text style={styles.chartPlaceholderText}>
                  📊 Chart: {salesPeriod.labels?.join(', ') || 'No data'}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Top Items Tab */}
      {activeTab === 'items' && (
        <View style={styles.tabContent}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Top Selling Items</Text>
            {topItems.map((item, idx) => (
              <View key={idx} style={styles.topItemRow}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>{idx + 1}</Text>
                </View>
                <Text style={styles.topItemName}>{item.name}</Text>
                <Text style={styles.topItemQty}>{item.quantity_sold} sold</Text>
                <Text style={styles.topItemRev}>£{item.revenue?.toFixed(2)}</Text>
              </View>
            ))}
            {topItems.length === 0 && (
              <Text style={styles.noDataText}>No sales data yet</Text>
            )}
          </View>
        </View>
      )}

      {/* Staff Performance Tab */}
      {activeTab === 'staff' && (
        <View style={styles.tabContent}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Staff Performance</Text>
            {staffPerformance.map((staff, idx) => (
              <View key={idx} style={styles.staffRow}>
                <Text style={styles.staffName}>{staff.name}</Text>
                <View style={styles.staffStats}>
                  <StatBadge label="Orders" value={staff.orders_served} />
                  <StatBadge label="Sales" value={`£${staff.sales_total?.toFixed(0)}`} />
                  <StatBadge label="Avg" value={`£${staff.avg_ticket?.toFixed(2)}`} />
                  <StatBadge label="Tips" value={`£${staff.tips?.toFixed(2)}`} />
                </View>
              </View>
            ))}
            {staffPerformance.length === 0 && (
              <Text style={styles.noDataText}>No staff data yet</Text>
            )}
          </View>
        </View>
      )}

      {/* P&L Tab */}
      {activeTab === 'p&l' && (
        <View style={styles.tabContent}>
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>Profit & Loss</Text>
            {profitLoss ? (
              <>
                <PnLRow label="Revenue" value={profitLoss.revenue} positive />
                <PnLRow label="Cost of Goods" value={-profitLoss.cogs} />
                <View style={styles.pnlDivider} />
                <PnLRow label="Gross Profit" value={profitLoss.gross_profit} positive bold />
                <PnLRow label="Labor Cost" value={-profitLoss.labor_cost} />
                <PnLRow label="Operating Expenses" value={-profitLoss.operating_expenses} />
                <View style={styles.pnlDivider} />
                <PnLRow label="Net Profit" value={profitLoss.net_profit} positive={profitLoss.net_profit >= 0} bold />
                <Text style={styles.marginText}>Margin: {profitLoss.profit_margin?.toFixed(1)}%</Text>
              </>
            ) : (
              <Text style={styles.noDataText}>Select a date range to view P&L</Text>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function SalesMetric({ label, value, color = '#1F2937' }: any) {
  return (
    <View style={styles.salesMetric}>
      <Text style={[styles.salesMetricValue, { color }]}>{value}</Text>
      <Text style={styles.salesMetricLabel}>{label}</Text>
    </View>
  );
}

function StatBadge({ label, value }: any) {
  return (
    <View style={styles.statBadge}>
      <Text style={styles.statBadgeValue}>{value}</Text>
      <Text style={styles.statBadgeLabel}>{label}</Text>
    </View>
  );
}

function PnLRow({ label, value, positive = false, bold = false }: any) {
  return (
    <View style={styles.pnlRow}>
      <Text style={[styles.pnlLabel, bold && styles.pnlBold]}>{label}</Text>
      <Text style={[styles.pnlValue, { color: positive ? '#10B981' : value < 0 ? '#EF4444' : '#1F2937' }, bold && styles.pnlBold]}>
        {value >= 0 ? '' : '-'}£{Math.abs(value)?.toFixed(2)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFFFFF' },
  exportButton: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  exportButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  periodBar: { flexDirection: 'row', padding: 12, backgroundColor: '#FFFFFF', gap: 8 },
  periodChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F3F4F6' },
  periodChipActive: { backgroundColor: '#1F2937' },
  periodChipText: { fontSize: 13, color: '#4B5563' },
  periodChipTextActive: { color: '#FFFFFF', fontWeight: '600' },
  tabBar: { flexDirection: 'row', padding: 4, backgroundColor: '#FFFFFF' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#1F2937' },
  tabText: { fontSize: 13, color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },
  tabContent: { padding: 12 },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  reportTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  salesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  salesMetric: { width: '47%', marginBottom: 8 },
  salesMetricValue: { fontSize: 20, fontWeight: 'bold' },
  salesMetricLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  chartPlaceholder: {
    height: 150,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: { fontSize: 14, color: '#9CA3AF' },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  topItemRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  topItemRankText: { fontSize: 13, fontWeight: 'bold', color: '#6B7280' },
  topItemName: { flex: 1, fontSize: 14, color: '#1F2937' },
  topItemQty: { fontSize: 13, color: '#6B7280', marginRight: 12 },
  topItemRev: { fontSize: 14, fontWeight: '600', color: '#10B981', minWidth: 60, textAlign: 'right' },
  noDataText: { textAlign: 'center', padding: 20, color: '#9CA3AF', fontSize: 14 },
  staffRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  staffName: { fontSize: 15, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  staffStats: { flexDirection: 'row', gap: 8 },
  statBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  statBadgeValue: { fontSize: 13, fontWeight: '600', color: '#1F2937' },
  statBadgeLabel: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  pnlRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  pnlLabel: { fontSize: 14, color: '#4B5563' },
  pnlValue: { fontSize: 14, fontWeight: '500' },
  pnlBold: { fontWeight: 'bold', fontSize: 15 },
  pnlDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  marginText: { fontSize: 14, fontWeight: '600', color: '#3B82F6', marginTop: 8 },
});