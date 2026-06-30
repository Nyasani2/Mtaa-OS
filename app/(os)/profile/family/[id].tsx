import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface FamilyMember { id: string; name: string; relationship: string; avatar_url: string | null; email: string | null; phone: string | null; date_of_birth: string | null; is_primary: boolean; created_at: string; }

export default function FamilyDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [member, setMember] = useState<FamilyMember | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchMember(); }, [id]);

  const fetchMember = async () => {
    try {
      const { data, error } = await supabase.from('family_members').select('*').eq('id', id).single();
      if (error) throw error;
      setMember(data);
    } catch (err) { Alert.alert('Error', 'Failed to load member details'); }
    finally { setLoading(false); }
  };

  const removeMember = () => {
    Alert.alert('Remove Member', `Remove ${member?.name} from your family?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        try { const { error } = await supabase.from('family_members').delete().eq('id', id); if (error) throw error; router.back(); }
        catch (err) { Alert.alert('Error', 'Failed to remove member'); }
      }}
    ]);
  };

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  if (!member) return <View style={styles.container}><Text style={styles.errorText}>Member not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Member Details</Text>
        <TouchableOpacity onPress={removeMember}><Ionicons name="trash-outline" size={22} color="#ef4444" /></TouchableOpacity>
      </View>
      <View style={styles.profileSection}>
        <View style={styles.avatarLarge}>
          {member.avatar_url ? <Image source={{ uri: member.avatar_url }} style={styles.avatarImgLarge} /> : <Ionicons name="person" size={40} color="#94a3b8" />}
        </View>
        <Text style={styles.name}>{member.name}</Text>
        <Text style={styles.relationship}>{member.relationship}</Text>
        {member.is_primary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary Account</Text></View>}
      </View>
      <View style={styles.infoSection}>
        {member.email && <View style={styles.infoRow}><Ionicons name="mail-outline" size={18} color="#64748b" /><Text style={styles.infoLabel}>Email</Text><Text style={styles.infoValue}>{member.email}</Text></View>}
        {member.phone && <View style={styles.infoRow}><Ionicons name="call-outline" size={18} color="#64748b" /><Text style={styles.infoLabel}>Phone</Text><Text style={styles.infoValue}>{member.phone}</Text></View>}
        {member.date_of_birth && <View style={styles.infoRow}><Ionicons name="calendar-outline" size={18} color="#64748b" /><Text style={styles.infoLabel}>Date of Birth</Text><Text style={styles.infoValue}>{new Date(member.date_of_birth).toLocaleDateString()}</Text></View>}
        <View style={styles.infoRow}><Ionicons name="time-outline" size={18} color="#64748b" /><Text style={styles.infoLabel}>Added</Text><Text style={styles.infoValue}>{new Date(member.created_at).toLocaleDateString()}</Text></View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  profileSection: { alignItems: 'center', paddingVertical: 32 },
  avatarLarge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  avatarImgLarge: { width: 80, height: 80, borderRadius: 40 },
  name: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  relationship: { fontSize: 15, color: '#94a3b8', marginTop: 4 },
  primaryBadge: { backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  primaryText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  infoSection: { paddingHorizontal: 16, paddingTop: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  infoLabel: { fontSize: 14, color: '#64748b', width: 100, marginLeft: 12 },
  infoValue: { flex: 1, fontSize: 14, color: '#f1f5f9', fontWeight: '500' },
  errorText: { color: '#ef4444', fontSize: 16, textAlign: 'center', marginTop: 40 },
});
