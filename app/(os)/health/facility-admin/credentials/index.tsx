// @ts-nocheck
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CredentialsScreen() {
  const router = useRouter();
  const credentials = [
    { id: '1', staff: 'Dr. John Doe', type: 'Medical License', expiry: '2025-12-31', status: 'Valid' },
    { id: '2', staff: 'Nurse Jane Smith', type: 'Nursing Certificate', expiry: '2024-06-15', status: 'Expiring Soon' },
    { id: '3', staff: 'Dr. Alice Brown', type: 'Board Certification', expiry: '2026-01-01', status: 'Valid' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>Credentials</Text>
        <TouchableOpacity><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList data={credentials} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={styles.card}>
          <View style={styles.iconBox}><Ionicons name="document-text" size={20} color="#0ea5e9" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.staff}</Text>
            <Text style={styles.meta}>{item.type} • Expires: {item.expiry}</Text>
          </View>
          <Text style={[styles.status, { color: item.status === 'Valid' ? '#10b981' : '#f59e0b' }]}>{item.status}</Text>
        </View>
      )} contentContainerStyle={styles.list} />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1e293b' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  list: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(14,165,233,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  status: { fontSize: 12, fontWeight: 'bold' },
});
