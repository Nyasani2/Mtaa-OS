// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function RoomsScreen() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'ward', floor: '1', capacity: '4' });

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_rooms').select('*').order('name');
      if (error) throw error;
      setRooms(data || []);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRooms(); }, []);

  const handleAdd = async () => {
    if (!form.name) return Alert.alert('Error', 'Room name required');
    try {
      await supabase.from('health_rooms').insert({ ...form, capacity: parseInt(form.capacity), floor: parseInt(form.floor) });
      Alert.alert('Success', 'Room added');
      setShowAdd(false);
      fetchRooms();
    } catch (err) { Alert.alert('Error', err.message); }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Room Configuration</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" /> : (
        <FlatList data={rooms} keyExtractor={i => i.id} renderItem={({item}) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>Floor {item.floor} • {item.type} • Cap: {item.capacity}</Text>
          </View>
        )} contentContainerStyle={styles.list} />
      )}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Room</Text>
            <TextInput style={styles.input} placeholder="Room Name" value={form.name} onChangeText={t => setForm({...form, name: t})} />
            <TextInput style={styles.input} placeholder="Floor" value={form.floor} onChangeText={t => setForm({...form, floor: t})} keyboardType="number-pad" />
            <TextInput style={styles.input} placeholder="Capacity" value={form.capacity} onChangeText={t => setForm({...form, capacity: t})} keyboardType="number-pad" />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}><Text style={styles.submitText}>Add Room</Text></TouchableOpacity>
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
  submitBtn: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#94a3b8' },
});
