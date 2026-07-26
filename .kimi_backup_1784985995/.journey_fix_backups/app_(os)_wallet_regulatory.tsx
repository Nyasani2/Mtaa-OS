import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import {
  Shield,
  Building2,
  Receipt,
  FileCheck,
  Landmark,
  ChevronRight,
  Globe,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useWalletStore } from '@/lib/wallet/store';
import { useRegulatoryWallet } from '@/domains/civic/regulatory/hooks/useRegulatoryWallet';
import { useTaxWithholding } from '@/domains/civic/regulatory/hooks/useTaxWithholding';
import { JurisdictionSelector } from '@/domains/civic/regulatory/components/JurisdictionSelector';
import { TaxSummaryCard } from '@/domains/civic/regulatory/components/TaxSummaryCard';
import { ComplianceStatusCard } from '@/domains/civic/regulatory/components/ComplianceStatusCard';
import { Colors } from '@/constants/Colors';

export default function WalletRegulatoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('KE');

  const {
    dashboard,
    loading: dashLoading,
    refresh: refreshDashboard,
  } = useRegulatoryWallet(selectedJurisdiction);

  const {
    withholdings,
    totalWithheld,
    loading: taxLoading,
    refresh: refreshTax,
  } = useTaxWithholding(selectedJurisdiction);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshDashboard(), refreshTax()]);
    setRefreshing(false);
  };

  const menuItems = [
    {
      id: 'business',
      label: 'Business Registration',
      icon: Building2,
      route: '/(os)/wallet/regulatory/business',
      badge: dashboard?.pendingBusinesses ?? 0,
    },
    {
      id: 'tax',
      label: 'Tax Payments',
      icon: Receipt,
      route: '/(os)/wallet/regulatory/tax-payments',
      badge: dashboard?.pendingTaxPayments ?? 0,
    },
    {
      id: 'compliance',
      label: 'Compliance Status',
      icon: FileCheck,
      route: '/(os)/wallet/regulatory/compliance',
      badge: dashboard?.pendingCompliance ?? 0,
    },
    {
      id: 'authority',
      label: 'Tax Authority',
      icon: Landmark,
      route: '/(os)/wallet/regulatory/authority',
    },
    {
      id: 'withholding',
      label: 'Withholding Tax Log',
      icon: TrendingUp,
      route: '/(os)/wallet/regulatory/withholding',
      badge: withholdings?.length ?? 0,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Shield size={28} color={Colors.primary} />
            <Text style={styles.headerTitle}>Regulatory</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Tax, compliance & business registration
          </Text>
        </View>

        {/* Jurisdiction Selector */}
        <JurisdictionSelector
          selected={selectedJurisdiction}
          onSelect={setSelectedJurisdiction}
        />

        {/* Tax Summary */}
        <TaxSummaryCard
          jurisdiction={selectedJurisdiction}
          totalWithheld={totalWithheld}
          pendingTax={dashboard?.pendingTaxAmount ?? 0}
          taxRate={dashboard?.taxRate ?? 0}
          currency={dashboard?.currency ?? 'KES'}
          loading={dashLoading || taxLoading}
        />

        {/* Compliance Status */}
        <ComplianceStatusCard
          status={dashboard?.complianceStatus ?? 'unknown'}
          lastFiling={dashboard?.lastFilingDate}
          nextDue={dashboard?.nextFilingDate}
          loading={dashLoading}
        />

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <item.icon size={20} color={Colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  {item.badge > 0 && (
                    <Text style={styles.menuBadge}>{item.badge} pending</Text>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color={Colors.gray[400]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Auto-Withholding Notice */}
        <View style={styles.notice}>
          <AlertTriangle size={16} color={Colors.warning} />
          <Text style={styles.noticeText}>
            Tax is automatically withheld on all MTaxi, MTruck, and Boda
            earnings at {dashboard?.taxRate ?? 0}% and remitted to{' '}
            {dashboard?.authorityName ?? 'KRA'}.
          </Text>
        </View>

        {/* Recent Withholdings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Withholdings</Text>
          {withholdings?.slice(0, 5).map((w) => (
            <View key={w.id} style={styles.withholdingItem}>
              <View style={styles.withholdingLeft}>
                <Text style={styles.withholdingType}>{w.transactionType}</Text>
                <Text style={styles.withholdingDate}>
                  {new Date(w.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.withholdingRight}>
                <Text style={styles.withholdingAmount}>
                  -{w.currency} {w.amount.toLocaleString()}
                </Text>
                <View style={styles.statusBadge(w.status)}>
                  <Text style={styles.statusText(w.status)}>
                    {w.status === 'remitted' ? 'Remitted' : 'Pending'}
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {(!withholdings || withholdings.length === 0) && (
            <View style={styles.empty}>
              <CheckCircle2 size={32} color={Colors.success} />
              <Text style={styles.emptyText}>No withholdings this period</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: 20, paddingBottom: 12 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: Colors.text },
  headerSubtitle: { fontSize: 14, color: Colors.gray[500], marginTop: 4 },
  section: { paddingHorizontal: 20, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  menuBadge: { fontSize: 12, color: Colors.warning, marginTop: 2 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.warning + '15',
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 16,
  },
  noticeText: { flex: 1, fontSize: 13, color: Colors.gray[600], lineHeight: 18 },
  withholdingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 14,
    borderRadius: 10,
    marginBottom: 6,
  },
  withholdingLeft: { gap: 2 },
  withholdingType: { fontSize: 14, fontWeight: '600', color: Colors.text },
  withholdingDate: { fontSize: 12, color: Colors.gray[400] },
  withholdingRight: { alignItems: 'flex-end', gap: 4 },
  withholdingAmount: { fontSize: 14, fontWeight: '700', color: Colors.danger },
  statusBadge: (status: string) => ({
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: status === 'remitted' ? Colors.success + '20' : Colors.warning + '20',
  }),
  statusText: (status: string) => ({
    fontSize: 11,
    fontWeight: '600',
    color: status === 'remitted' ? Colors.success : Colors.warning,
  }),
  empty: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { fontSize: 14, color: Colors.gray[400] },
});
