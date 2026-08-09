import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator,
  RefreshControl, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEducation, type ParticipantRole } from '@/domains/education/hooks/useEducation';
import { Ionicons } from '@expo/vector-icons';

const ROLE_COLORS: Record<string, string> = {
  student: '#10b981',
  teacher: '#3b82f6',
  head_teacher: '#8b5cf6',
  staff: '#f59e0b',
  admin: '#ef4444',
  parent: '#ec4899',
  accountant: '#06b6d4',
};

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  teacher: 'Teacher',
  head_teacher: 'Head Teacher',
  staff: 'Staff',
  admin: 'Admin',
  parent: 'Parent',
  accountant: 'Accountant',
};

const ROLES: ParticipantRole[] = ['student', 'teacher', 'head_teacher', 'staff', 'admin', 'parent', 'accountant'];

export default function ParticipantsHub() {
  const router = useRouter();
  const {
    getAllParticipants,
    getAllParticipantCounts,
    removeParticipant,
  } = useEducation();

  const [participants, setParticipants] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState<ParticipantRole | 'all'>('all');

  const loadData = useCallback(async () => {
    try {
      const [all, c] = await Promise.all([
        getAllParticipants(activeRole === 'all' ? { search: search || undefined } : { role: activeRole, search: search || undefined }),
        getAllParticipantCounts(),
      ]);
      setParticipants(all);
      setCounts(c);
    } catch (e) {
      console.error('[ParticipantsHub] load error:', e);
    }
  }, [activeRole, search]);

  useEffect(() => { loadData().finally(() => setLoading(false)); }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDelete = (id: string, role: ParticipantRole, name: string) => {
    Alert.alert('Delete Participant', `Remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeParticipant(id, role);
            await loadData();
          } catch (e) {
            Alert.alert('Error', 'Failed to delete participant');
          }
        },
      },
    ]);
  };

  const renderParticipant = ({ item }: { item: any }) => (
    <View style={{
      backgroundColor: '#1e293b',
      borderRadius: 12,
      padding: 16,
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <View style={{
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: ROLE_COLORS[item.role] || '#64748b',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          {(item.full_name || '?').charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: '#fff', fontWeight: '600', fontSize: 15 }}>{item.full_name || 'Unnamed'}</Text>
        <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{item.email || item.phone || 'No contact'}</Text>
        <View style={{ flexDirection: 'row', marginTop: 6, gap: 6 }}>
          <View style={{
            backgroundColor: ROLE_COLORS[item.role] + '20',
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10,
          }}>
            <Text style={{ color: ROLE_COLORS[item.role], fontSize: 10, fontWeight: '600' }}>
              {ROLE_LABELS[item.role] || item.role}
            </Text>
          </View>
          {item.is_active === false && (
            <View style={{ backgroundColor: '#ef444420', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 }}>
              <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '600' }}>Inactive</Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity onPress={() => handleDelete(item.id, item.role, item.full_name)} style={{ padding: 8 }}>
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Header */}
      <View style={{ padding: 16, paddingTop: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Participants</Text>
          <TouchableOpacity
            onPress={() => router.push('/education/participants/create')}
            style={{ backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '600', marginLeft: 4 }}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={{
          backgroundColor: '#1e293b', borderRadius: 12, flexDirection: 'row', alignItems: 'center',
          paddingHorizontal: 12, marginBottom: 12,
        }}>
          <Ionicons name="search" size={18} color="#64748b" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search participants..."
            placeholderTextColor="#64748b"
            style={{ flex: 1, color: '#fff', paddingVertical: 12, paddingHorizontal: 8, fontSize: 14 }}
          />
        </View>

        {/* Role Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
          <TouchableOpacity
            onPress={() => setActiveRole('all')}
            style={{
              paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8,
              backgroundColor: activeRole === 'all' ? '#3b82f6' : '#1e293b',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>
              All ({Object.values(counts).reduce((a, b) => a + b, 0)})
            </Text>
          </TouchableOpacity>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              onPress={() => setActiveRole(role)}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8,
                backgroundColor: activeRole === role ? ROLE_COLORS[role] : '#1e293b',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>
                {ROLE_LABELS[role]} ({counts[role] || 0})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#3b82f6" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={participants}
          keyExtractor={(item) => `${item.role}-${item.id}`}
          renderItem={renderParticipant}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 60 }}>
              <Ionicons name="people-outline" size={48} color="#334155" />
              <Text style={{ color: '#64748b', marginTop: 12 }}>No participants found</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
