// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function BackupScreen() {
  const router = useRouter();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_backups').select('*').order('created_at', { ascending: false }).limit(20);
      if (error) throw error;
      setBackups(data || []);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBackups(); }, []);

  const triggerBackup = async () => {
    setRunning(true);
    try {
      await supabase.from('health_backups').insert({ status: 'in_progress', backup_type: 'manual', created_at: new Date().toISOString() });
      Alert.alert('Success', 'Backup initiated successfully');
      fetchBackups();
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setRunning(false); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Backup & Recovery</Text>
        <View style={{ width: 24 }} />
      </View>
      <TouchableOpacity style={styles.actionBtn} onPress={triggerBackup} disabled={running}>
        <Ionicons name="cloud-upload" size={20} color="#fff" />
        <Text style={styles.actionText}>{running ? 'Running Backup...' : 'Run Manual Backup Now'}</Text>
      </TouchableOpacity>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" /> : (
        <FlatList data={backups} keyExtractor={i => i.id} renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name={item.status === 'completed' ? 'checkmark-circle' : 'time'} size={24} color={item.status === 'completed' ? '#10b981' : '#f59e0b'} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{item.backup_type.toUpperCase()} Backup</Text>
                <Text style={styles.meta}>{new Date(item.created_at).toLocaleString()} • {item.status}</Text>
              </View>
            </View>
          </View>
        )} contentContainerStyle={styles.list} />
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1e293b' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  actionBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#10b981', margin: 16, padding: 16, borderRadius: 12, gap: 8 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  list: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
});
