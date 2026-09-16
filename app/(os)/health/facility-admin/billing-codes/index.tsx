// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function BillingCodesScreen() {
  const router = useRouter();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: '', description: '', type: 'cpt', amount: '0' });

  const fetch = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_billing_codes').select('*').order('code');
      if (error) throw error;
      setCodes(data || []);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleAdd = async () => {
    if (!form.code) return Alert.alert('Error', 'Code required');
    try {
      await supabase.from('health_billing_codes').insert({ ...form, amount: parseFloat(form.amount) });
      Alert.alert('Success', 'Code added');
      setShowAdd(false);
      fetch();
    } catch (err) { Alert.alert('Error', err.message); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Billing Codes</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#06b6d4" /> : (
        <FlatList data={codes} keyExtractor={i => i.id} renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.code}</Text>
            <Text style={styles.meta}>{item.description} • {item.type}</Text>
          </View>
        )} contentContainerStyle={styles.list} />
      )}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Billing Code</Text>
            <TextInput style={styles.input} placeholder="Code (e.g. CPT-99213)" value={form.code} onChangeText={t => setForm({...form, code: t})} />
            <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={t => setForm({...form, description: t})} />
            <TextInput style={styles.input} placeholder="Type (cpt, icd10, drg)" value={form.type} onChangeText={t => setForm({...form, type: t})} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}><Text style={styles.submitText}>Add Code</Text></TouchableOpacity>
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
  submitBtn: { backgroundColor: '#06b6d4', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#94a3b8' },
});
