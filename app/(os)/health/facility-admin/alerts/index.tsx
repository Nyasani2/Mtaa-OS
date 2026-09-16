// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function AlertConfigScreen() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([
    { id: 'email', title: 'Email Reminders', desc: '24 hours before appointment', enabled: true },
    { id: 'sms', title: 'SMS Reminders', desc: '1 hour before appointment', enabled: true },
    { id: 'meds', title: 'Medication Reminders', desc: 'When it is time to take meds', enabled: true },
    { id: 'lab', title: 'Lab Results Ready', desc: 'When new results are available', enabled: true },
    { id: 'emergency', title: 'Emergency Alerts', desc: 'Critical health notifications', enabled: true },
    { id: 'quiet', title: 'Quiet Hours', desc: 'Silence non-urgent alerts 10PM-7AM', enabled: false },
  ]);

  const toggleAlert = async (id, value) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, enabled: value } : a));
    try {
      await supabase.from('health_alert_config').upsert({ user_id: 'global', alert_type: id, enabled: value });
    } catch (err) { /* Silently fail if table missing */ }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Alert Configuration</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appointments</Text>
        {alerts.slice(0, 2).map(item => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDesc}>{item.desc}</Text>
            </View>
            <Switch value={item.enabled} onValueChange={(v) => toggleAlert(item.id, v)} trackColor={{ false: "#767577", true: "#10b981" }} />
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Alerts</Text>
        {alerts.slice(2, 5).map(item => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDesc}>{item.desc}</Text>
            </View>
            <Switch value={item.enabled} onValueChange={(v) => toggleAlert(item.id, v)} trackColor={{ false: "#767577", true: "#10b981" }} />
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        {alerts.slice(5).map(item => (
          <View key={item.id} style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowDesc}>{item.desc}</Text>
            </View>
            <Switch value={item.enabled} onValueChange={(v) => toggleAlert(item.id, v)} trackColor={{ false: "#767577", true: "#10b981" }} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1e293b' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  section: { padding: 16, paddingBottom: 0 },
  sectionTitle: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginBottom: 12, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 10 },
  rowInfo: { flex: 1 },
  rowTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  rowDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
});
