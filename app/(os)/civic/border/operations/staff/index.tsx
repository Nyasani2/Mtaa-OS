import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useState } from 'react';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SafeAreaWrapper } from '@/components/ui/SafeAreaWrapper';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { useStaffOperations } from '@/lib/domains/civic/border/hooks/useStaffOperations';
import { Text } from 'react-native';

export default function StaffManagement() {
  const [clocking, setClocking] = useState(false);
  const { data: staff, isLoading } = useStaffOperations();

  const handleClockInOut = async (staffId: string, action: 'in' | 'out') => {
    setClocking(true);
    setTimeout(() => setClocking(false), 1000);
  };

  return (
    <SafeAreaWrapper>
      <ScreenHeader title="Staff Management" subtitle="Officer shifts & attendance" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {isLoading && <LoadingState message="Loading staff..." />}
        {staff?.map(officer => (
          <Card key={officer.id} style={styles.staffCard}>
            <View style={styles.header}>
              <View>
                <Text style={styles.name}>{officer.full_name}</Text>
                <Text style={styles.role}>{officer.role} — {officer.border_post_name}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: officer.is_clocked_in ? '#10b981' : '#64748b' }]}>
                <Text style={styles.statusText}>{officer.is_clocked_in ? 'ON DUTY' : 'OFF DUTY'}</Text>
              </View>
            </View>
            <View style={styles.shiftInfo}>
              <Text style={styles.shiftText}>🕐 Shift: {officer.shift_start} — {officer.shift_end}</Text>
              <Text style={styles.shiftText}>📅 Last clock: {officer.last_clock_time || 'Never'}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity 
                style={[styles.clockBtn, { backgroundColor: officer.is_clocked_in ? '#ef4444' : '#10b981' }]}
                onPress={() => handleClockInOut(officer.id, officer.is_clocked_in ? 'out' : 'in')}
                disabled={clocking}
              >
                <Text style={styles.clockBtnText}>{officer.is_clocked_in ? '⏹ Clock Out' : '▶ Clock In'}</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  staffCard: { padding: 16, marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  name: { color: '#e2e8f0', fontSize: 15, fontWeight: '700' },
  role: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  shiftInfo: { backgroundColor: '#1e293b', padding: 10, borderRadius: 6, marginBottom: 12 },
  shiftText: { color: '#94a3b8', fontSize: 12, marginBottom: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  clockBtn: { flex: 1, padding: 10, borderRadius: 6, alignItems: 'center' },
  clockBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});
