import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function ChildDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [child, setChild] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChild();
  }, [id]);

  async function loadChild() {
    if (!id) return;
    const { data } = await supabase.from('family_profiles').select('*').eq('id', id).single();
    setChild(data);
    setLoading(false);
  }

  const handleDelete = async () => {
    Alert.alert('Remove Child', `Remove ${child?.child_name} from your family profile?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('family_profiles').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  };

  if (!child) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{child.child_name}</Text>
        <TouchableOpacity onPress={handleDelete}>
          <Ionicons name="trash-outline" size={22} color="#ff4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{child.child_name?.charAt(0) || '?'}</Text>
        </View>

        <View style={styles.card}>
          <DetailRow icon="school-outline" label="School" value={child.school || 'Not set'} />
          <DetailRow icon="book-outline" label="Grade" value={child.grade || 'Not set'} />
          <DetailRow icon="cash-outline" label="Allowance" value={`KSh ${child.allowance_balance || 0}`} />
          <DetailRow icon="bus-outline" label="Transport" value={child.transport_allowed ? 'Allowed' : 'Not allowed'} />
        </View>

        <TouchableOpacity style={styles.editBtn} onPress={() => router.push(`/(os)/profile/family/edit/${id}` as any)}>
          <Text style={styles.editText}>Edit Details</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon as any} size={20} color="#00d4ff" />
      <View style={styles.rowText}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { padding: 16 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#00d4ff', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginVertical: 24 },
  avatarText: { color: '#000', fontSize: 32, fontWeight: '700' },
  card: { backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  rowText: { marginLeft: 12, flex: 1 },
  label: { color: '#888', fontSize: 12 },
  value: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
  editBtn: { backgroundColor: '#00d4ff', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 24 },
  editText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
