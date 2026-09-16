// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function InfectionControlScreen() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ infection_type: 'hai', patient_id: '', notes: '', status: 'active' });

  const fetch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_infection_control').select('*').order('reported_at', { ascending: false });
      if (error) throw error;
      setCases(data || []);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    if (!form.infection_type) return Alert.alert('Error', 'Infection type required');
    try {
      await supabase.from('health_infection_control').insert(form);
      Alert.alert('Success', 'Case recorded');
      setShowAdd(false);
      fetch();
    } catch (err) { Alert.alert('Error', err.message); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Infection Control</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#ef4444" /> : (
        <FlatList data={cases} keyExtractor={i => i.id} renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.infection_type.toUpperCase()}</Text>
            <Text style={styles.meta}>Patient: {item.patient_id || 'N/A'} • {item.status}</Text>
          </View>
        )} contentContainerStyle={styles.list} />
      )}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Record Infection Case</Text>
            <TextInput style={styles.input} placeholder="Infection Type (e.g. hai)" value={form.infection_type} onChangeText={t => setForm({...form, infection_type: t})} />
            <TextInput style={styles.input} placeholder="Patient ID" value={form.patient_id} onChangeText={t => setForm({...form, patient_id: t})} />
            <TextInput style={styles.input} placeholder="Notes" value={form.notes} onChangeText={t => setForm({...form, notes: t})} multiline numberOfLines={3} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}><Text style={styles.submitText}>Record Case</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1e293b' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  list: { padding: 16 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 },
  submitBtn: { backgroundColor: '#ef4444', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#94a3b8' },
});
