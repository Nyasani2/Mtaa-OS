import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
}

export default function LogsScreen() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const stored = await AsyncStorage.getItem('mtaa_logs');
      if (stored) {
        setLogs(JSON.parse(stored));
      } else {
        // Generate sample logs for demo
        const sampleLogs: LogEntry[] = [
          { id: '1', timestamp: new Date().toISOString(), level: 'info', component: 'Auth', message: 'User session restored' },
          { id: '2', timestamp: new Date(Date.now() - 60000).toISOString(), level: 'info', component: 'Wallet', message: 'Balance refreshed: KES 12,450.00' },
          { id: '3', timestamp: new Date(Date.now() - 120000).toISOString(), level: 'warn', component: 'Network', message: 'Latency spike detected: 450ms' },
          { id: '4', timestamp: new Date(Date.now() - 180000).toISOString(), level: 'info', component: 'Streets', message: 'Feed loaded: 24 posts' },
          { id: '5', timestamp: new Date(Date.now() - 300000).toISOString(), level: 'error', component: 'Sync', message: 'Failed to sync tribe data: timeout' },
          { id: '6', timestamp: new Date(Date.now() - 600000).toISOString(), level: 'info', component: 'App', message: 'App launched v1.0.0' },
        ];
        setLogs(sampleLogs);
        await AsyncStorage.setItem('mtaa_logs', JSON.stringify(sampleLogs));
      }
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleClear = async () => {
    await AsyncStorage.removeItem('mtaa_logs');
    setLogs([]);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'info': return '#3b82f6';
      case 'warn': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'debug': return '#888';
      default: return '#666';
    }
  };

  const filteredLogs = filter ? logs.filter(l => l.level === filter) : logs;

  const renderItem = ({ item }: { item: LogEntry }) => (
    <View style={styles.logRow}>
      <View style={[styles.levelDot, { backgroundColor: getLevelColor(item.level) }]} />
      <View style={styles.logContent}>
        <View style={styles.logHeader}>
          <Text style={styles.logComponent}>{item.component}</Text>
          <Text style={styles.logTime}>
            {new Date(item.timestamp).toLocaleTimeString()}
          </Text>
        </View>
        <Text style={styles.logMessage}>{item.message}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>System Logs</Text>

      <View style={styles.filterRow}>
        {['all', 'info', 'warn', 'error'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              (filter === f || (f === 'all' && !filter)) && styles.filterBtnActive
            ]}
            onPress={() => setFilter(f === 'all' ? null : f)}
          >
            <Text style={[
              styles.filterText,
              (filter === f || (f === 'all' && !filter)) && styles.filterTextActive
            ]}>
              {f.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredLogs}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No logs</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
        <Text style={styles.clearBtnText}>🗑️ Clear Logs</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  filterBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterText: { color: '#888', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  logRow: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 4,
  },
  levelDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10, marginTop: 4 },
  logContent: { flex: 1 },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  logComponent: { color: '#fff', fontSize: 12, fontWeight: '600' },
  logTime: { color: '#666', fontSize: 11 },
  logMessage: { color: '#aaa', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  clearBtn: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    backgroundColor: '#ef444420',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  clearBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  backButton: { position: 'absolute', bottom: 16, left: 16, right: 16, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
