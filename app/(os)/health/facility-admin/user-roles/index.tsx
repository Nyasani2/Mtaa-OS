// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function UserRolesScreen() {
  const router = useRouter();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      // Fetch roles and count users for each
      const { data: rolesData, error } = await supabase
        .from('user_roles')
        .select('role, user_id');
      
      if (error) throw error;

      // Group by role and count
      const grouped = rolesData.reduce((acc, curr) => {
        if (!acc[curr.role]) acc[curr.role] = { permissions: 0, users: 0 };
        acc[curr.role].users += 1;
        return acc;
      }, {});

      const formattedRoles = Object.keys(grouped).map((role, index) => ({
        id: index.toString(),
        name: role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        permissions: 8, // Placeholder, fetch from permissions table if available
        users: grouped[role].users
      }));

      setRoles(formattedRoles);
    } catch (err) {
      console.error('Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#8b5cf6" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>User Roles</Text>
        <TouchableOpacity onPress={() => router.push('/health/facility-admin/user-roles/add')}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList 
        data={roles} 
        keyExtractor={i => i.id} 
        renderItem={({item}) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/health/facility-admin/user-roles/${item.name}`)}>
            <View style={styles.iconBox}>
              <Ionicons name="shield-checkmark" size={20} color="#8b5cf6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.permissions} permissions • {item.users} users</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        )} 
        contentContainerStyle={styles.list} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1e293b' },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  list: { padding: 16 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: '#8b5cf620', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  name: { color: '#fff', fontSize: 16, fontWeight: '600' },
  meta: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
});
