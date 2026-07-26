// ============================================================================
// MTAA Restaurant Module — Payroll Screen
// ============================================================================

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, Alert, RefreshControl, ScrollView
} from 'react-native';
import { usePayroll } from '@/lib/restaurant/hooks';

export default function RestaurantPayroll() {
  const {
    records, currentRecord, taxSummary, isLoading, error,
    generate, loadPayslip, loadRecords, approve, markPaid, loadTaxSummary, clearError
  } = usePayroll();

  const [refreshing, setRefreshing] = useState(false);
  const [showPayslip, setShowPayslip] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [period, setPeriod] = useState({ start_date: '', end_date: '' });

  useEffect(() => {
    loadRecords({ limit: 50 });
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecords({ limit: 50 });
    setRefreshing(false);
  };

  const handleApprove = async (recordId: string) => {
    try {
      await approve(recordId, 'manager');
      Alert.alert('Success', 'Payroll approved');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleMarkPaid = async (recordId: string) => {
    try {
      await markPaid(recordId, `PAY-${Date.now()}`);
      Alert.alert('Success', 'Marked as paid');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#9CA3AF';
      case 'approved': return '#3B82F6';
      case 'paid': return '#10B981';
      case 'disputed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Payroll</Text>
        <TouchableOpacity style={styles.taxButton} onPress={() => {
          const now = new Date();
          const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          const end = now.toISOString().split('T')[0];
          loadTaxSummary({ start_date: start, end_date: end });
        }}>
          <Text style={styles.taxButtonText}>📊 Tax Summary</Text>
        </TouchableOpacity>
      </View>

      {taxSummary && (
        <View style={styles.taxCard}>
          <Text style={styles.taxTitle}>This Month's Tax Summary</Text>
          <View style={styles.taxGrid}>
            <TaxItem label="Total Gross" value={`£${taxSummary.total_gross?.toFixed(2)}`} />
            <TaxItem label="Total Tax" value={`£${taxSummary.total_tax?.toFixed(2)}`} />
            <TaxItem label="Total NI" value={`£${taxSummary.total_ni?.toFixed(2)}`} />
            <TaxItem label="Total Pension" value={`£${taxSummary.total_pension?.toFixed(2)}`} />
            <TaxItem label="Total Net" value={`£${taxSummary.total_net?.toFixed(2)}`} color="#10B981" />
            <TaxItem label="Employees" value={String(taxSummary.employee_count)} />
          </View>
        </View>
      )}

      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.recordsList}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.recordCard}
            onPress={() => { setSelectedRecord(item); setShowPayslip(true); }}
          >
            <View style={styles.recordHeader}>
              <View>
                <Text style={styles.recordName}>{item.staff_name || 'Unknown'}</Text>
                <Text style={styles.recordPeriod}>
                  {item.period_start} → {item.period_end}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>

            <View style={styles.recordDetails}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Gross</Text>
                <Text style={styles.detailValue}>£{item.gross_pay?.toFixed(2)}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Tax</Text>
                <Text style={styles.detailValue}>£{item.tax_deducted?.toFixed(2)}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Net</Text>
                <Text style={[styles.detailValue, { color: '#10B981' }]}>£{item.net_pay?.toFixed(2)}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Hours</Text>
                <Text style={styles.detailValue}>{item.total_hours}h</Text>
              </View>
            </View>

            {item.status === 'draft' && (
              <TouchableOpacity style={styles.actionButton} onPress={() => handleApprove(item.id)}>
                <Text style={styles.actionButtonText}>✓ Approve</Text>
              </TouchableOpacity>
            )}
            {item.status === 'approved' && (
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#10B981' }]} onPress={() => handleMarkPaid(item.id)}>
                <Text style={styles.actionButtonText}>💰 Mark Paid</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>{isLoading ? 'Loading...' : 'No payroll records'}</Text>
          </View>
        }
      />

      {/* Payslip Modal */}
      <Modal visible={showPayslip} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Payslip</Text>
              <TouchableOpacity onPress={() => setShowPayslip(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            {selectedRecord && (
              <View style={styles.payslip}>
                <Text style={styles.payslipName}>{selectedRecord.staff_name}</Text>
                <Text style={styles.payslipPeriod}>{selectedRecord.period_start} — {selectedRecord.period_end}</Text>

                <View style={styles.payslipSection}>
                  <PayslipRow label="Basic Pay" value={`£${selectedRecord.basic_pay?.toFixed(2)}`} />
                  <PayslipRow label="Overtime" value={`£${selectedRecord.overtime_pay?.toFixed(2)}`} />
                  <PayslipRow label="Tips" value={`£${selectedRecord.tips?.toFixed(2)}`} />
                  <PayslipRow label="Bonus" value={`£${selectedRecord.bonus?.toFixed(2)}`} />
                  <View style={styles.payslipDivider} />
                  <PayslipRow label="Gross Pay" value={`£${selectedRecord.gross_pay?.toFixed(2)}`} bold />
                </View>

                <View style={styles.payslipSection}>
                  <PayslipRow label="Income Tax" value={`-£${selectedRecord.tax_deducted?.toFixed(2)}`} color="#EF4444" />
                  <PayslipRow label="National Insurance" value={`-£${selectedRecord.ni_deducted?.toFixed(2)}`} color="#EF4444" />
                  <PayslipRow label="Pension" value={`-£${selectedRecord.pension_deducted?.toFixed(2)}`} color="#EF4444" />
                  <PayslipRow label="Other Deductions" value={`-£${selectedRecord.other_deductions?.toFixed(2)}`} color="#EF4444" />
                  <View style={styles.payslipDivider} />
                  <PayslipRow label="Total Deductions" value={`-£${selectedRecord.total_deductions?.toFixed(2)}`} color="#EF4444" bold />
                </View>

                <View style={[styles.payslipSection, styles.netSection]}>
                  <PayslipRow label="NET PAY" value={`£${selectedRecord.net_pay?.toFixed(2)}`} color="#10B981" bold />
                </View>

                <View style={styles.payslipMeta}>
                  <Text style={styles.payslipMetaText}>Total Hours: {selectedRecord.total_hours}h</Text>
                  <Text style={styles.payslipMetaText}>Overtime: {selectedRecord.overtime_hours}h</Text>
                  <Text style={styles.payslipMetaText}>Tax Code: {selectedRecord.tax_code || '1257L'}</Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function TaxItem({ label, value, color = '#1F2937' }: any) {
  return (
    <View style={styles.taxItem}>
      <Text style={styles.taxItemLabel}>{label}</Text>
      <Text style={[styles.taxItemValue, { color }]}>{value}</Text>
    </View>
  );
}

function PayslipRow({ label, value, color = '#1F2937', bold = false }: any) {
  return (
    <View style={styles.payslipRow}>
      <Text style={[styles.payslipLabel, bold && styles.payslipBold]}>{label}</Text>
      <Text style={[styles.payslipValue, { color }, bold && styles.payslipBold]}>{value}</Text>
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
  taxButton: { backgroundColor: '#3B82F6', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  taxButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  taxCard: {
    backgroundColor: '#FFFFFF',
    margin: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taxTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 },
  taxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  taxItem: { width: '30%' },
  taxItemLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 2 },
  taxItemValue: { fontSize: 15, fontWeight: '600' },
  recordsList: { padding: 12 },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  recordName: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  recordPeriod: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  recordDetails: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  detailCol: { alignItems: 'center' },
  detailLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  detailValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyStateText: { fontSize: 15, color: '#9CA3AF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  modalClose: { fontSize: 24, color: '#6B7280', padding: 4 },
  payslip: { paddingBottom: 20 },
  payslipName: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
  payslipPeriod: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 4 },
  payslipSection: { marginTop: 20, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 12 },
  netSection: { backgroundColor: '#ECFDF5' },
  payslipRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  payslipLabel: { fontSize: 14, color: '#4B5563' },
  payslipValue: { fontSize: 14, fontWeight: '500' },
  payslipBold: { fontWeight: 'bold', fontSize: 15 },
  payslipDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  payslipMeta: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  payslipMetaText: { fontSize: 12, color: '#9CA3AF', marginBottom: 4 },
});
