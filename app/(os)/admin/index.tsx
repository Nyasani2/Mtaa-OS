// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, 
  TouchableOpacity, TextInput, Alert 
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ADMIN_PIN = '0000'; // Change this to your preferred secure PIN

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const router = useRouter();
  
  // PIN State
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  
  // Dashboard State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('system_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isUnlocked) fetchLogs();
  }, [isUnlocked]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs();
  };

  const handlePinPress = (num: string) => {
    if (pinInput.length < 4) {
      const newPin = pinInput + num;
      setPinInput(newPin);
      if (newPin.length === 4) {
        if (newPin === ADMIN_PIN) {
          setIsUnlocked(true);
          setPinInput('');
        } else {
          Alert.alert('Access Denied', 'Incorrect PIN. Please try again.');
          setPinInput('');
        }
      }
    }
  };

  const handlePinDelete = () => {
    setPinInput(pinInput.slice(0, -1));
  };

  const lockAdmin = () => {
    setIsUnlocked(false);
    setPinInput('');
  };

  // ─── PIN LOCK SCREEN ───────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <View style={styles.lockContainer}>
        <View style={styles.lockIcon}>
          <Ionicons name="shield-checkmark" size={48} color="#8b5cf6" />
        </View>
        <Text style={styles.lockTitle}>Admin Access Required</Text>
        <Text style={styles.lockSubtitle}>Enter your 4-digit admin PIN</Text>
        
        <View style={styles.pinDots}>
          {[0, 1, 2, 3].map((i) => (
            <View 
              key={i} 
              style={[styles.pinDot, i < pinInput.length && styles.pinDotActive]} 
            />
          ))}
        </View>

        <View style={styles.keypad}>
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key) => (
            <TouchableOpacity 
              key={key} 
              style={[styles.key, key === '' && styles.keyEmpty]}
              onPress={() => {
                if (key === '⌫') handlePinDelete();
                else if (key !== '') handlePinPress(key);
              }}
              disabled={key === ''}
            >
              <Text style={styles.keyText}>{key}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  // ─── UNLOCKED ADMIN DASHBOARD ──────────────────────────────────
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Initializing ASIS Admin Core...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>OS Command Center</Text>
          <Text style={styles.headerSub}>Welcome, {user?.email?.split('@')[0] || 'Admin'}</Text>
        </View>
        <TouchableOpacity onPress={lockAdmin} style={styles.lockButton}>
          <Ionicons name="lock-closed" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" />}
      >
        {/* ASIS Health Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="sparkles" size={20} color="#8b5cf6" />
            <Text style={styles.cardTitle}>ASIS Core Status</Text>
          </View>
          <View style={styles.statusRow}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Engine</Text>
              <Text style={styles.statusValue}>Local Qwen v3.6</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Health Score</Text>
              <Text style={[styles.statusValue, { color: '#00ff88' }]}>98.5%</Text>
            </View>
          </View>
        </View>

        {/* Module Administration Grid */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="grid" size={20} color="#60a5fa" />
            <Text style={styles.cardTitle}>Module Administration</Text>
          </View>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(os)/wallet/merchant-dashboard')}>
              <Ionicons name="wallet" size={28} color="#fbbf24" />
              <Text style={styles.gridText}>Wallet</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(education)/admin-dashboard')}>
              <Ionicons name="school" size={28} color="#34d399" />
              <Text style={styles.gridText}>Education</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(os)/health/facility-admin')}>
              <Ionicons name="medical" size={28} color="#f87171" />
              <Text style={styles.gridText}>Health</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.gridItem} onPress={() => router.push('/(mtaxi)/driver/dashboard')}>
              <Ionicons name="car" size={28} color="#60a5fa" />
              <Text style={styles.gridText}>Transport</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Event Logs Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="document-text" size={20} color="#60a5fa" />
            <Text style={styles.cardTitle}>Recent System Audit Logs</Text>
          </View>
          {logs.length === 0 ? (
            <Text style={styles.emptyText}>No recent events logged.</Text>
          ) : (
            logs.map((log) => (
              <View key={log.id} style={styles.logItem}>
                <View style={styles.logIcon}>
                  <Ionicons 
                    name={log.event_type?.includes('error') ? 'warning' : 'checkmark-circle'} 
                    size={18} 
                    color={log.event_type?.includes('error') ? '#ef4444' : '#00ff88'} 
                  />
                </View>
                <View style={styles.logContent}>
                  <Text style={styles.logType}>{log.event_type || 'System Event'}</Text>
                  <Text style={styles.logDetails} numberOfLines={2}>
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </Text>
                  <Text style={styles.logTime}>
                    {new Date(log.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Lock Screen Styles
  lockContainer: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  lockIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(139, 92, 246, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  lockTitle: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8 },
  lockSubtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 32 },
  pinDots: { flexDirection: 'row', gap: 16, marginBottom: 48 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: '#475569' },
  pinDotActive: { backgroundColor: '#8b5cf6', borderColor: '#8b5cf6' },
  keypad: { flexDirection: 'row', flexWrap: 'wrap', width: 280, justifyContent: 'space-between' },
  key: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  keyEmpty: { backgroundColor: 'transparent' },
  keyText: { color: '#fff', fontSize: 24, fontWeight: '600' },

  // Dashboard Styles
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: '#60a5fa', marginTop: 4 },
  lockButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ef4444', justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statusItem: { alignItems: 'center' },
  statusLabel: { fontSize: 12, color: '#64748b', marginBottom: 4 },
  statusValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { flex: 1, minWidth: '45%', backgroundColor: '#0f172a', borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#334155' },
  gridText: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
  emptyText: { color: '#64748b', textAlign: 'center', paddingVertical: 20 },
  logItem: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  logIcon: { marginTop: 2 },
  logContent: { flex: 1 },
  logType: { fontSize: 14, fontWeight: '600', color: '#e2e8f0', marginBottom: 4 },
  logDetails: { fontSize: 12, color: '#94a3b8', marginBottom: 4 },
  logTime: { fontSize: 10, color: '#64748b' },
});
