import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COUNTRIES, CountryCode, CountryConfig } from '../types';
import { useRevenueSummary } from '../hooks';
import TaxRevenueScreen from './TaxRevenueScreen';
import BusinessLookupScreen from './BusinessLookupScreen';
import TaxPaymentsScreen from './TaxPaymentsScreen';
import ComplianceScreen from './ComplianceScreen';

type TabKey = 'dashboard' | 'revenue' | 'business' | 'payments' | 'compliance';

const TABS: { key: TabKey; label: string; icon: any }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { key: 'revenue', label: 'Revenue', icon: 'cash' },
  { key: 'business', label: 'Business', icon: 'business' },
  { key: 'payments', label: 'Payments', icon: 'card' },
  { key: 'compliance', label: 'Compliance', icon: 'shield-checkmark' },
];

export default function RegulatoryDashboard() {
  const [country, setCountry] = useState<CountryCode>('KE');
  const [tab, setTab] = useState<TabKey>('dashboard');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  const countryConfig = COUNTRIES.find(c => c.code === country)!;
  const { data: summary, loading, error, refresh } = useRevenueSummary(country);

  const renderContent = () => {
    switch (tab) {
      case 'dashboard': return renderDashboard();
      case 'revenue': return <TaxRevenueScreen country={country} config={countryConfig} />;
      case 'business': return <BusinessLookupScreen country={country} config={countryConfig} />;
      case 'payments': return <TaxPaymentsScreen country={country} config={countryConfig} />;
      case 'compliance': return <ComplianceScreen country={country} config={countryConfig} />;
    }
  };

  function renderDashboard() {
    return (
      <ScrollView style={styles.content} contentContainerStyle={{ padding: 16 }}>
        {/* Country Header Card */}
        <TouchableOpacity style={styles.countryCard} onPress={() => setShowCountryPicker(true)}>
          <Text style={styles.flag}>{countryConfig.flag}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.countryName}>{countryConfig.name}</Text>
            <Text style={styles.taxAuthority}>{countryConfig.taxAuthority} · {countryConfig.currency}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        </TouchableOpacity>

        {/* Revenue Summary Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="cash-outline" size={24} color="#3B82F6" />
            <Text style={styles.statValue}>{countryConfig.currency} {summary?.total_collected?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Total Collected</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="trending-up-outline" size={24} color="#059669" />
            <Text style={styles.statValue}>{summary?.collection_rate?.toFixed(1) || '0'}%</Text>
            <Text style={styles.statLabel}>Collection Rate</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="business-outline" size={24} color="#D97706" />
            <Text style={styles.statValue}>{summary?.total_businesses?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Registered Businesses</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={24} color="#DC2626" />
            <Text style={styles.statValue}>{summary?.overdue_payments?.toLocaleString() || '0'}</Text>
            <Text style={styles.statLabel}>Overdue Payments</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setTab('revenue')}>
            <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="cash" size={22} color="#3B82F6" />
            </View>
            <Text style={styles.actionLabel}>Tax Revenue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setTab('business')}>
            <View style={[styles.actionIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="business" size={22} color="#059669" />
            </View>
            <Text style={styles.actionLabel}>Business Lookup</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setTab('payments')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="card" size={22} color="#D97706" />
            </View>
            <Text style={styles.actionLabel}>Tax Payments</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setTab('compliance')}>
            <View style={[styles.actionIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="shield-checkmark" size={22} color="#DC2626" />
            </View>
            <Text style={styles.actionLabel}>Compliance</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Regulatory</Text>
        <TouchableOpacity style={styles.countryBadge} onPress={() => setShowCountryPicker(true)}>
          <Text style={styles.countryBadgeText}>{countryConfig.flag} {countryConfig.code}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={{ paddingHorizontal: 8 }}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, tab === t.key && styles.tabActive]}
            onPress={() => setTab(t.key)}
          >
            <Ionicons name={t.icon} size={16} color={tab === t.key ? '#3B82F6' : '#9CA3AF'} />
            <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {renderContent()}

      {/* Country Picker Modal */}
      <Modal visible={showCountryPicker} animationType="slide" transparent onRequestClose={() => setShowCountryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            {COUNTRIES.map(c => (
              <TouchableOpacity
                key={c.code}
                style={[styles.countryItem, country === c.code && styles.countryItemActive]}
                onPress={() => { setCountry(c.code); setShowCountryPicker(false); }}
              >
                <Text style={styles.countryItemFlag}>{c.flag}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.countryItemName}>{c.name}</Text>
                  <Text style={styles.countryItemMeta}>{c.taxAuthority} · {c.currency}</Text>
                </View>
                {country === c.code && <Ionicons name="checkmark" size={20} color="#3B82F6" />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#111827' },
  countryBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  countryBadgeText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  tabBar: { backgroundColor: '#fff', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, marginRight: 8, borderRadius: 20 },
  tabActive: { backgroundColor: '#DBEAFE' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#9CA3AF', marginLeft: 6 },
  tabTextActive: { color: '#3B82F6' },
  content: { flex: 1 },
  countryCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  flag: { fontSize: 32 },
  countryName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  taxAuthority: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, marginRight: 8, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 8 },
  statLabel: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  actionBtn: { width: '48%', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12, marginRight: '4%' },
  actionIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#374151', marginTop: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderColor: '#F3F4F6' },
  countryItemActive: { backgroundColor: '#EFF6FF' },
  countryItemFlag: { fontSize: 24 },
  countryItemName: { fontSize: 15, fontWeight: '600', color: '#374151' },
  countryItemMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
});
