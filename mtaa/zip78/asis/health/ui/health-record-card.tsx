import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { HealthRecord, HealthCategory } from '../types';

interface Props { record: HealthRecord; onPress?: (r: HealthRecord) => void; onDelete?: (id: string) => void; onShare?: (r: HealthRecord) => void; }
const COLORS: Record<HealthCategory, string> = { medical_history: '#3B82F6', prescriptions: '#10B981', visits: '#F59E0B', lab_results: '#8B5CF6', immunizations: '#EC4899', allergies: '#EF4444', emergency_contacts: '#6B7280' };
const ICONS: Record<HealthCategory, string> = { medical_history: '📋', prescriptions: '💊', visits: '🏥', lab_results: '🔬', immunizations: '💉', allergies: '⚠️', emergency_contacts: '🆘' };

export const HealthRecordCard: React.FC<Props> = ({ record, onPress, onDelete, onShare }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <TouchableOpacity style={[styles.card, { borderLeftColor: COLORS[record.category] }]} onPress={() => { setExpanded(!expanded); onPress?.(record); }} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.icon}>{ICONS[record.category]}</Text>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{record.title}</Text>
          <Text style={styles.meta}>{new Date(record.createdAt).toLocaleDateString()} · {record.source}</Text>
        </View>
      </View>
      {expanded && (
        <View style={styles.expanded}>
          <Text style={styles.content}>{record.content}</Text>
          <View style={styles.actions}>
            {onShare && <TouchableOpacity style={styles.actionBtn} onPress={() => onShare(record)}><Text style={styles.actionText}>🔗 Share</Text></TouchableOpacity>}
            {onDelete && <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => onDelete(record.id)}><Text style={[styles.actionText, styles.deleteText]}>🗑️ Delete</Text></TouchableOpacity>}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 16, marginBottom: 8, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center' },
  icon: { fontSize: 24, marginRight: 12 },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: '500', color: '#1A1A2E' },
  meta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  expanded: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  content: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  actions: { flexDirection: 'row', marginTop: 12, gap: 8 },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 14, backgroundColor: '#F3F4F6', borderRadius: 8 },
  actionText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  deleteBtn: { backgroundColor: '#FEE2E2' },
  deleteText: { color: '#DC2626' },
});
