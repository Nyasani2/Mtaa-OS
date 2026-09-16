// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function StaffSchedulesScreen() {
  const router = useRouter();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ 
    staff_name: '', 
    role: 'Nurse', 
    shift_date: '', 
    start_time: '08:00', 
    end_time: '16:00', 
    shift_type: 'Morning' 
  });

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_staff_schedules').select('*').order('shift_date', { ascending: false });
      if (error) throw error;
      setSchedules(data || []);
    } catch (err) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSchedules(); }, []);

  const handleAdd = async () => {
    if (!form.staff_name || !form.shift_date) return Alert.alert('Error', 'Staff name and date required');
    try {
      await supabase.from('health_staff_schedules').insert(form);
      Alert.alert('Success', 'Shift added to roster');
      setShowAdd(false);
      fetchSchedules();
    } catch (err) { Alert.alert('Error', err.message); }
  };

  const getRoleColor = (role) => {
    if (role === 'Doctor') return '#3b82f6';
    if (role === 'Nurse') return '#10b981';
    if (role === 'Kitchen') return '#f59e0b';
    return '#8b5cf6';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Staff Schedules</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} color="#3b82f6" /> : (
        <FlatList data={schedules} keyExtractor={i => i.id} renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) + '20' }]}>
                <Text style={[styles.roleText, { color: getRoleColor(item.role) }]}>{item.role}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.name}>{item.staff_name}</Text>
                <Text style={styles.meta}>{item.shift_date} • {item.start_time} to {item.end_time}</Text>
              </View>
            </View>
            <Text style={styles.shiftType}>{item.shift_type} Shift</Text>
          </View>
        )} contentContainerStyle={styles.list} />
      )}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Shift to Roster</Text>
            <TextInput style={styles.input} placeholder="Staff Name" value={form.staff_name} onChangeText={t => setForm({...form, staff_name: t})} />
            <TextInput style={styles.input} placeholder="Role (Doctor, Nurse, Kitchen, etc.)" value={form.role} onChangeText={t => setForm({...form, role: t})} />
            <TextInput style={styles.input} placeholder="Shift Date (YYYY-MM-DD)" value={form.shift_date} onChangeText={t => setForm({...form, shift_date: t})} />
            <View style={styles.rowInputs}>
              <TextInput style={[styles.input, {flex: 1, marginRight: 8}]} placeholder="Start (08:00)" value={form.start_time} onChangeText={t => setForm({...form, start_time: t})} />
              <TextInput style={[styles.input, {flex: 1}]} placeholder="End (16:00)" value={form.end_time} onChangeText={t => setForm({...form, end_time: t})} />
            </View>
            <TextInput style={styles.input} placeholder="Shift Type (Morning, Night, etc.)" value={form.shift_type} onChangeText={t => setForm({...form, shift_type: t})} />
            <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}><Text style={styles.submitText}>Add Shift</Text></TouchableOpacity>
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
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleText: { fontSize: 11, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  shiftType: { color: '#64748b', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#0f172a', color: '#fff', padding: 12, borderRadius: 8, marginBottom: 12 },
  rowInputs: { flexDirection: 'row' },
  submitBtn: { backgroundColor: '#3b82f6', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#fff', fontWeight: 'bold' },
  cancelBtn: { padding: 14, alignItems: 'center', marginTop: 10 },
  cancelText: { color: '#94a3b8' },
});
