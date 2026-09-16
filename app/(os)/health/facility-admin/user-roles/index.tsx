// @ts-nocheck
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function UserRolesScreen() {
  const router = useRouter();
  const roles = [
    { id: '1', name: 'Super Admin', permissions: 12, users: 2 },
    { id: '2', name: 'Facility Admin', permissions: 10, users: 5 },
    { id: '3', name: 'Doctor', permissions: 8, users: 15 },
    { id: '4', name: 'Nurse', permissions: 6, users: 25 },
    { id: '5', name: 'Receptionist', permissions: 4, users: 8 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.title}>User Roles</Text>
        <TouchableOpacity><Ionicons name="add" size={24} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList data={roles} keyExtractor={i => i.id} renderItem={({item}) => (
        <View style={styles.card}>
          <View style={styles.iconBox}><Ionicons name="shield-checkmark" size={20} color="#8b5cf6" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>{item.permissions} permissions • {item.users} users</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
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
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(139,92,246,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  name: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
});
