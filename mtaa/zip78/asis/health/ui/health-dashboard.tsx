import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { HealthVault } from '../health-vault';
import { ConsentManager } from '../consent-manager';
import { HealthAuditLog } from '../audit-log';
import { HealthRecord, HealthCategory } from '../types';

interface Props { userId: string; vault: HealthVault; consent: ConsentManager; audit: HealthAuditLog; }
const CATS: { key: HealthCategory; label: string; emoji: string }[] = [
  { key: 'medical_history', label: 'History', emoji: '📋' }, { key: 'prescriptions', label: 'Rx', emoji: '💊' },
  { key: 'visits', label: 'Visits', emoji: '🏥' }, { key: 'lab_results', label: 'Labs', emoji: '🔬' },
  { key: 'immunizations', label: 'Shots', emoji: '💉' }, { key: 'allergies', label: 'Allergies', emoji: '⚠️' },
  { key: 'emergency_contacts', label: 'SOS', emoji: '🆘' },
];

export const HealthDashboard: React.FC<Props> = ({ userId, vault, consent, audit }) => {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [selCat, setSelCat] = useState<HealthCategory | null>(null);
  const [activeConsents, setActiveConsents] = useState(0);
  const [recentAudit, setRecentAudit] = useState(0);

  useEffect(() => { loadData(); }, [userId]);
  const loadData = async () => {
    const all = await vault.getRecords(userId);
    setRecords(all);
    setActiveConsents((await consent.listActiveConsents(userId)).length);
    setRecentAudit((await audit.getLogs(userId, { from: new Date(Date.now() - 7 * 86400000).toISOString() })).length);
  };

  const filtered = selCat ? records.filter(r => r.category === selCat) : records;
  const counts = CATS.map(c => ({ ...c, count: records.filter(r => r.category === c.key).length }));

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Health Vault</Text>
        <Text style={styles.headerSub}>Owned by you. Shared only with your consent.</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}><Text style={styles.statNum}>{records.length}</Text><Text style={styles.statLabel}>Records</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{activeConsents}</Text><Text style={styles.statLabel}>Active Access</Text></View>
        <View style={styles.statCard}><Text style={styles.statNum}>{recentAudit}</Text><Text style={styles.statLabel}>Activity (7d)</Text></View>
      </View>
      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.grid}>
        {counts.map(c => (
          <TouchableOpacity key={c.key} style={[styles.catCard, selCat === c.key && styles.catActive]} onPress={() => setSelCat(selCat === c.key ? null : c.key)}>
            <Text style={styles.emoji}>{c.emoji}</Text><Text style={styles.catLabel}>{c.label}</Text><Text style={styles.catCount}>{c.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.sectionTitle}>{selCat ? CATS.find(c => c.key === selCat)?.label + ' Records' : 'All Records'}</Text>
      {filtered.length === 0 ? (
        <View style={styles.empty}><Text style={styles.emptyText}>No records</Text><Text style={styles.emptySub}>Tap + to add your first record</Text></View>
      ) : filtered.map(r => (
        <View key={r.id} style={styles.recordCard}>
          <Text style={styles.recordTitle}>{r.title}</Text>
          <Text style={styles.recordMeta}>{new Date(r.createdAt).toLocaleDateString()} · {r.source}</Text>
        </View>
      ))}
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.btnPrimary}><Text style={styles.btnPrimaryText}>➕ Add Record</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btnSecondary}><Text style={styles.btnSecondaryText}>📤 Export</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { padding: 24, paddingTop: 48, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1A1A2E' },
  headerSub: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '700', color: '#2563EB' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A2E', paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, gap: 8 },
  catCard: { width: '30%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 },
  catActive: { backgroundColor: '#DBEAFE', borderWidth: 2, borderColor: '#2563EB' },
  emoji: { fontSize: 24 },
  catLabel: { fontSize: 12, fontWeight: '500', color: '#374151', marginTop: 4, textAlign: 'center' },
  catCount: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  recordCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 8 },
  recordTitle: { fontSize: 16, fontWeight: '500', color: '#1A1A2E' },
  recordMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  empty: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#9CA3AF', fontWeight: '500' },
  emptySub: { fontSize: 13, color: '#D1D5DB', marginTop: 4 },
  actionRow: { flexDirection: 'row', padding: 16, gap: 12, marginBottom: 32 },
  btnPrimary: { flex: 1, backgroundColor: '#2563EB', borderRadius: 12, padding: 16, alignItems: 'center' },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  btnSecondary: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  btnSecondaryText: { color: '#374151', fontWeight: '600', fontSize: 14 },
});
