import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface ChildProfile {
  id: string;
  parent_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  blood_group: string;
  allergies: string[];
  created_at: string;
}

export default function ChildrenScreen() {
  const { user } = useAuthStore();
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    loadChildren();
  }, [user?.id]);

  async function loadChildren() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_children')
        .select('*')
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setChildren(data || []);
    } catch (e) {
      console.error('Failed to load children:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = (childId: string) => {
    Alert.alert('Remove Child', 'Are you sure you want to remove this child profile?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await supabase.from('health_children').delete().eq('id', childId);
        loadChildren();
      }},
    ]);
  };

  const getAge = (dob: string) => {
    const birth = new Date(dob);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    const months = now.getMonth() - birth.getMonth();
    if (months < 0) return `${years - 1} years`;
    if (years === 0) return `${months} months`;
    return `${years} years`;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Family Health</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </View>
    );
  }

  const safeChildren = children || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Family Health</Text>
        <TouchableOpacity onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {safeChildren.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No children added yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowAdd(true)}>
              <Text style={styles.emptyBtnText}>Add Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          safeChildren.map(child => (
            <TouchableOpacity key={child.id} style={styles.childCard} onPress={() => router.push(`/(os)/health/children/${child.id}`)}>
              <View style={styles.childHeader}>
                <View style={[styles.childAvatar, { backgroundColor: child.gender === 'male' ? '#4FC3F7' : '#F48FB1' }]}>
                  <Text style={styles.childAvatarText}>{child.full_name.charAt(0)}</Text>
                </View>
                <View style={styles.childInfo}>
                  <Text style={styles.childName}>{child.full_name}</Text>
                  <Text style={styles.childAge}>{getAge(child.date_of_birth)} · {child.gender}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(child.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
              <View style={styles.childDetails}>
                <Text style={styles.childDetail}>🩸 Blood: {child.blood_group || 'Unknown'}</Text>
                <Text style={styles.childDetail}>⚠️ Allergies: {child.allergies?.length ? child.allergies.join(', ') : 'None known'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 12 },
  emptyBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#007AFF', borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontWeight: '600' },
  childCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  childHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  childAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  childAvatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '600', color: '#333' },
  childAge: { fontSize: 13, color: '#666' },
  childDetails: { gap: 4 },
  childDetail: { fontSize: 14, color: '#666' },
});
