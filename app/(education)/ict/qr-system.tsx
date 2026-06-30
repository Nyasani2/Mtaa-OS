import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function QRSystemScreen() {
  const router = useRouter();
  const [sessions] = useState([
    { id: '1', name: 'Morning Assembly', type: 'attendance', active: true, scanned: 842, total: 1200, started: '07:30 AM' },
    { id: '2', name: 'Class Block A', type: 'check-in', active: true, scanned: 445, total: 450, started: '08:00 AM' },
    { id: '3', name: 'Library Access', type: 'access', active: false, scanned: 120, total: 800, started: '08:00 AM' },
    { id: '4', name: 'Dining Hall', type: 'meal', active: true, scanned: 890, total: 1200, started: '10:30 AM' },
  ]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>QR System</Text>
        <TouchableOpacity><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#10b98115' }]}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>3</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#3b82f615' }]}>
          <Text style={[styles.statValue, { color: '#3b82f6' }]}>2,297</Text>
          <Text style={styles.statLabel}>Scanned Today</Text>
        </View>
      </View>
      <ScrollView style={styles.content}>
        {sessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sessionName}>{session.name}</Text>
                <Text style={styles.sessionType}>{session.type} · Started {session.started}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: session.active ? '#10b98120' : '#94a3b820' }]}>
                <Text style={[styles.statusText, { color: session.active ? '#10b981' : '#94a3b8' }]}>{session.active ? 'Active' : 'Ended'}</Text>
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${(session.scanned / session.total) * 100}%`, backgroundColor: session.active ? '#3b82f6' : '#94a3b8' }]} />
            </View>
            <View style={styles.sessionFooter}>
              <Text style={styles.sessionCount}>{session.scanned} / {session.total} scanned</Text>
              <Text style={styles.sessionPercent}>{Math.round((session.scanned / session.total) * 100)}%</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  content: { paddingHorizontal: 16 },
  sessionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  sessionName: { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  sessionType: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '600' },
  progressBar: { height: 6, backgroundColor: '#f1f5f9', borderRadius: 3, marginBottom: 8 },
  progressFill: { height: 6, borderRadius: 3 },
  sessionFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  sessionCount: { fontSize: 12, color: '#64748b' },
  sessionPercent: { fontSize: 12, fontWeight: '600', color: '#3b82f6' },
});
