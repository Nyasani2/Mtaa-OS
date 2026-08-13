// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, TextInput,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/hooks/useUser';

interface StaffMember { id: string; user_id: string; role: string; status: string; joined_at: string; profile?: { full_name?: string; email?: string; phone?: string; avatar_url?: string; }; }

export default function ShopStaffScreen() {
  const { id: shopId } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('cashier');

  const roles = [
    { id: 'store_manager', label: 'Store Manager' },
    { id: 'cashier', label: 'Cashier' },
    { id: 'inventory_manager', label: 'Inventory Manager' },
    { id: 'accountant', label: 'Accountant' },
    { id: 'delivery_agent', label: 'Delivery Agent' },
  ];

  async function fetchStaff() {
    if (!shopId) return;
    const { data } = await supabase.from('shop_staff').select('*, profiles:user_id(full_name, email, phone, avatar_url)').eq('shop_id', shopId).order('joined_at', { ascending: false });
    if (data) setStaff(data as any);
  }

  useEffect(() => { fetchStaff(); }, [shopId]);
  const onRefresh = async () => { setRefreshing(true); await fetchStaff(); setRefreshing(false); };

  async function handleInvite() {
    if (!inviteEmail.trim()) { Alert.alert('Required', 'Enter an email or phone number'); return; }
    Alert.alert('Invite Sent', `Invitation sent to ${inviteEmail} as ${inviteRole}`);
    setInviteEmail('');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Team</Text>
        <Text style={styles.headerSub}>{staff.length} members</Text>
      </View>
      <View style={styles.inviteCard}>
        <Text style={styles.inviteTitle}>Invite Member</Text>
        <TextInput style={styles.inviteInput} placeholder="Email or phone number" value={inviteEmail} onChangeText={setInviteEmail} keyboardType="email-address" autoCapitalize="none" />
        <View style={styles.roleRow}>
          {roles.map((r) => (
            <TouchableOpacity key={r.id} style={[styles.roleChip, inviteRole === r.id && styles.roleChipActive]} onPress={() => setInviteRole(r.id)}>
              <Text style={[styles.roleText, inviteRole === r.id && styles.roleTextActive]}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
          <Text style={styles.inviteBtnText}>Send Invite</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={staff}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.staffCard}>
            <View style={styles.staffAvatar}>
              <Text style={styles.staffAvatarText}>{(item.profile?.full_name || 'U').charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={styles.staffName}>{item.profile?.full_name || 'Unknown User'}</Text>
              <Text style={styles.staffMeta}>{item.profile?.email || item.profile?.phone || 'No contact'}</Text>
              <View style={styles.staffTags}>
                <View style={[styles.roleTag, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.roleTagText, { color: '#1D4ED8' }]}>{item.role}</Text>
                </View>
                <View style={[styles.statusTag, { backgroundColor: item.status === 'active' ? '#D1FAE5' : '#F3F4F6' }]}>
                  <Text style={[styles.statusTagText, { color: item.status === 'active' ? '#065F46' : '#6B7280' }]}>{item.status}</Text>
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No team members yet</Text>
            <Text style={styles.emptySub}>Invite staff to help run your business</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 24 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  inviteCard: { backgroundColor: '#fff', margin: 20, marginTop: 0, padding: 16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  inviteTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  inviteInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 12, fontSize: 15, marginBottom: 12 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  roleChipActive: { backgroundColor: '#2196F3', borderColor: '#2196F3' },
  roleText: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  roleTextActive: { color: '#fff', fontWeight: '600' },
  inviteBtn: { backgroundColor: '#2196F3', padding: 14, borderRadius: 10, alignItems: 'center' },
  inviteBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  staffCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 20, marginBottom: 8, padding: 14, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  staffAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
  staffAvatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  staffInfo: { flex: 1, marginLeft: 12 },
  staffName: { fontSize: 15, fontWeight: '600', color: '#0F172A' },
  staffMeta: { fontSize: 13, color: '#64748B', marginTop: 2 },
  staffTags: { flexDirection: 'row', gap: 8, marginTop: 6 },
  roleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  roleTagText: { fontSize: 11, fontWeight: '600' },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusTagText: { fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748B' },
  emptySub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
});
