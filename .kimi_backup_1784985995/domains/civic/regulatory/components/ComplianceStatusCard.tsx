import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CheckCircle2, AlertCircle, XCircle, FileCheck } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';

interface Props {
  status: 'compliant' | 'non_compliant' | 'under_review' | 'unknown';
  lastFiling?: string;
  nextDue?: string;
  loading: boolean;
}

const STATUS_CONFIG = {
  compliant: { icon: CheckCircle2, color: Colors.success, label: 'Compliant', bg: Colors.success + '15' },
  non_compliant: { icon: XCircle, color: Colors.danger, label: 'Non-Compliant', bg: Colors.danger + '15' },
  under_review: { icon: AlertCircle, color: Colors.warning, label: 'Under Review', bg: Colors.warning + '15' },
  unknown: { icon: FileCheck, color: Colors.gray[400], label: 'Unknown', bg: Colors.gray[100] },
};

export function ComplianceStatusCard({ status, lastFiling, nextDue, loading }: Props) {
  const router = useRouter();
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const Icon = config.icon;

  if (loading) {
    return (
      <View style={[styles.card, styles.skeleton]}>
        <View style={styles.skeletonLine} />
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push('/(os)/wallet/regulatory/compliance' as any)}
    >
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: config.bg }]}>
          <Icon size={20} color={config.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Compliance Status</Text>
          <Text style={[styles.status, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
      <View style={styles.dates}>
        <View>
          <Text style={styles.dateLabel}>Last Filing</Text>
          <Text style={styles.dateValue}>
            {lastFiling ? new Date(lastFiling).toLocaleDateString() : 'Never'}
          </Text>
        </View>
        <View>
          <Text style={styles.dateLabel}>Next Due</Text>
          <Text style={[styles.dateValue, !nextDue && { color: Colors.danger }]}>
            {nextDue ? new Date(nextDue).toLocaleDateString() : 'Overdue'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { fontSize: 14, fontWeight: '600', color: Colors.gray[500] },
  status: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  dates: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: Colors.gray[100] },
  dateLabel: { fontSize: 11, color: Colors.gray[400] },
  dateValue: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: 2 },
  skeleton: { padding: 20 },
  skeletonLine: { height: 16, backgroundColor: Colors.gray[200], borderRadius: 4, width: '80%' },
});
