import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getTimeline, HealthRecordMetadata } from '@/lib/health/services/health-record.service';

type FilterType = 'all' | 'visit' | 'lab' | 'prescription' | 'imaging' | 'vaccination';

export default function TimelineScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<any[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) load();
  }, [user?.id, filter]);

  async function load() {
    setLoading(true);
    const data = await getTimeline(user!.id);
    const filtered = filter === 'all' ? data : data.filter((e: any) => e.type === filter);
    setEntries(filtered);
    setLoading(false);
  }

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'visit', label: 'Visits' },
    { key: 'lab', label: 'Labs' },
    { key: 'prescription', label: 'Rx' },
    { key: 'imaging', label: 'Imaging' },
    { key: 'vaccination', label: 'Vax' },
  ];

  const typeIcon: Record<string, string> = {
    visit: '🏥', lab: '🧪', prescription: '💊', imaging: '📷', vaccination: '💉', note: '📝', allergy: '⚠️',
  };

  const groupByMonth = (items: any[]) => {
    const groups: Record<string, any[]> = {};
    for (const item of items) {
      const month = item.date?.slice(0, 7) || 'Unknown';
      if (!groups[month]) groups[month] = [];
      groups[month].push(item);
    }
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Medical Timeline</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {filters.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {loading ? (
          <Text style={styles.empty}>Loading...</Text>
        ) : entries.length === 0 ? (
          <Text style={styles.empty}>No records found</Text>
        ) : (
          groupByMonth(entries).map(([month, items]) => (
            <View key={month}>
              <Text style={styles.monthLabel}>{formatMonth(month)}</Text>
              {items.map((item: any) => (
                <View key={item.id} style={styles.entry}>
                  <View style={styles.entryLeft}>
                    <Text style={styles.entryIcon}>{typeIcon[item.type] || '📄'}</Text>
                    <View style={styles.entryLine} />
                  </View>
                  <View style={styles.entryContent}>
                    <View style={styles.entryHeader}>
                      <Text style={styles.entryDate}>{formatDate(item.date)}</Text>
                      {item.isVerified && <Text style={styles.verified}>✅</Text>}
                    </View>
                    <Text style={styles.entryTitle}>{item.title}</Text>
                    <Text style={styles.entrySub}>{item.hospitalName} • {item.doctorName}</Text>
                    <View style={styles.entryActions}>
                      <TouchableOpacity>
                        <Text style={styles.actionText}>View</Text>
                      </TouchableOpacity>
                      <TouchableOpacity>
                        <Text style={styles.actionText}>Share</Text>
                      </TouchableOpacity>
                      <TouchableOpacity>
                        <Text style={styles.actionText}>Download</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
        <View style={styles.bottomPad} />
      </ScrollView>
    </View>
  );
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${y}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 },
  back: { color: '#fff', fontSize: 22 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  filterRow: { maxHeight: 50 },
  filterContent: { paddingHorizontal: 16, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1a1a1a', marginRight: 8 },
  filterChipActive: { backgroundColor: '#007AFF' },
  filterText: { color: '#888', fontSize: 13 },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  list: { flex: 1 },
  listContent: { padding: 16 },
  empty: { color: '#666', textAlign: 'center', marginTop: 60, fontSize: 14 },
  monthLabel: { color: '#007AFF', fontSize: 13, fontWeight: '700', marginBottom: 12, marginTop: 8 },
  entry: { flexDirection: 'row', marginBottom: 16 },
  entryLeft: { alignItems: 'center', width: 32 },
  entryIcon: { fontSize: 18 },
  entryLine: { width: 2, flex: 1, backgroundColor: '#2a2a2a', marginTop: 4 },
  entryContent: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  entryDate: { color: '#888', fontSize: 12 },
  verified: { fontSize: 12 },
  entryTitle: { color: '#fff', fontSize: 15, fontWeight: '600', marginBottom: 2 },
  entrySub: { color: '#888', fontSize: 12, marginBottom: 8 },
  entryActions: { flexDirection: 'row', gap: 16 },
  actionText: { color: '#007AFF', fontSize: 12, fontWeight: '500' },
  bottomPad: { height: 40 },
});
