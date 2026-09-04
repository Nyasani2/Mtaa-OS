import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Alert, Ionicons } from '@expo/vector-icons';

interface FamilyMember {
  id: string;
  user_id: string;
  name: string;
  relationship: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  emergency_contact: boolean;
  created_at: string;
}

export default function FamilyMemberDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => { fetchMember(); }, [id, user?.id]);

  const fetchMember = async () => {
    if (!id || !user?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)  // SECURITY: only fetch if owned by current user
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Not found or not authorized
          setIsOwner(false);
          setMember(null);
        } else {
          console.error('Family member error:', error);
        }
      } else {
        setMember(data);
        setIsOwner(true);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const deleteMember = () => {
    Alert.alert(
      'Remove Family Member',
      `Are you sure you want to remove ${member?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            if (!user?.id || !member) return;
            try {
              const { error } = await supabase
                .from('family_members')
                .delete()
                .eq('id', member.id)
                .eq('user_id', user.id);  // SECURITY: ensure ownership

              if (error) throw error;
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Family Member</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
    </View>
  );

  if (!isOwner || !member) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Family Member</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}>
        <Ionicons name="lock-closed" size={48} color="#334155" />
        <Text style={styles.unauthorizedText}>Not Authorized</Text>
        <Text style={styles.unauthorizedSub}>You do not have access to this family member.</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{member.name}</Text>
        <TouchableOpacity onPress={() => router.push(`/(os)/profile/family/edit/${member.id}` as any)}>
          <Ionicons name="create-outline" size={22} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}><Ionicons name="person" size={40} color="#94a3b8" /></View>
        <Text style={styles.name}>{member.name}</Text>
        <View style={styles.badge}><Text style={styles.badgeText}>{member.relationship}</Text></View>
        {member.emergency_contact && (
          <View style={[styles.badge, { backgroundColor: '#ef4444', marginTop: 8 }]}>
            <Text style={styles.badgeText}>Emergency Contact</Text>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Details</Text>
        {member.date_of_birth && (
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color="#64748b" />
            <Text style={styles.detailText}>{member.date_of_birth}</Text>
          </View>
        )}
        {member.phone && (
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={18} color="#64748b" />
            <Text style={styles.detailText}>{member.phone}</Text>
          </View>
        )}
        {member.email && (
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={18} color="#64748b" />
            <Text style={styles.detailText}>{member.email}</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={deleteMember}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
        <Text style={styles.deleteText}>Remove Family Member</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unauthorizedText: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginTop: 16 },
  unauthorizedSub: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, margin: 16, marginBottom: 0, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  badge: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12, alignSelf: 'flex-start' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#334155', width: '100%' },
  detailText: { fontSize: 15, color: '#f1f5f9', marginLeft: 12 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, padding: 14, backgroundColor: '#1e293b', borderRadius: 8, borderWidth: 1, borderColor: '#ef4444' },
  deleteText: { color: '#ef4444', fontWeight: '600', marginLeft: 8 },
});
