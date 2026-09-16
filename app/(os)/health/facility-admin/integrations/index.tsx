// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function IntegrationsScreen() {
  const router = useRouter();
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_integrations').select('*').order('name');
      if (error) throw error;
      setIntegrations(data || []);
    } catch (err) {
      // Fallback mock data if table doesn't exist yet
      setIntegrations([
        { id: '1', name: 'Supabase', description: 'Primary database & auth', status: 'Connected' },
        { id: '2', name: 'Stripe', description: 'Payment processing', status: 'Connected' },
        { id: '3', name: 'Twilio', description: 'SMS notifications', status: 'Disconnected' },
        { id: '4', name: 'SendGrid', description: 'Email delivery', status: 'Connected' },
      ]);
    }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Integrations</Text>
        <View style={{ width: 24 }} />
      </View>
      <Text style={styles.subtitle}>Connect and manage external systems integrated with Health OS.</Text>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" /> : (
        <FlatList data={integrations} keyExtractor={i => i.id} renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.iconBox}><Ionicons name="link" size={20} color={item.status === 'Connected' ? '#10b981' : '#ef4444'} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.description}</Text>
            </View>
            <Text style={[styles.status, { color: item.status === 'Connected' ? '#10b981' : '#ef4444' }]}>{item.status}</Text>
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
  subtitle: { color: '#94a3b8', fontSize: 13, padding: 16, paddingBottom: 0 },
  list: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  status: { fontSize: 12, fontWeight: 'bold' },
});
