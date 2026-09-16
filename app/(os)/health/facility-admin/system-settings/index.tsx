// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function SystemSettingsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ auto_backup: true, offline_mode: false, audit_logging: true });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_facility_settings').select('settings').maybeSingle();
      if (error) throw error;
      if (data?.settings) setSettings({ ...settings, ...data.settings });
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSettings(); }, []);

  const updateSetting = async (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await supabase.from('health_facility_settings').upsert({ id: 'global', settings: newSettings });
    } catch (err) { Alert.alert('Error', err.message); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>System Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Auto Backup</Text>
            <Text style={styles.rowDesc}>Backup health data daily</Text>
          </View>
          <Switch value={settings.auto_backup} onValueChange={(v) => updateSetting('auto_backup', v)} trackColor={{ false: "#767577", true: "#3b82f6" }} />
        </View>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Offline Mode</Text>
            <Text style={styles.rowDesc}>Allow offline data entry</Text>
          </View>
          <Switch value={settings.offline_mode} onValueChange={(v) => updateSetting('offline_mode', v)} trackColor={{ false: "#767577", true: "#3b82f6" }} />
        </View>
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowTitle}>Audit Logging</Text>
            <Text style={styles.rowDesc}>Log all data access</Text>
          </View>
          <Switch value={settings.audit_logging} onValueChange={(v) => updateSetting('audit_logging', v)} trackColor={{ false: "#767577", true: "#3b82f6" }} />
        </View>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1e293b' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  section: { padding: 16 },
  sectionTitle: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 10 },
  rowInfo: { flex: 1 },
  rowTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  rowDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
});
