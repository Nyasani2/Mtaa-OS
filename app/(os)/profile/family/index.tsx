import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';
import { Ionicons } from '@expo/vector-icons';

interface FamilyMember {
  id: string;
  user_id: string;
  full_name: string;
  relationship: string;
  email: string;
  phone: string;
  date_of_birth: string;
  created_at: string;
}

export default function FamilyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          setTableExists(false);
          setMembers([]);
        } else {
          console.error('Family members fetch error:', error);
        }
        setLoading(false);
        return;
      }

      setMembers(data || []);
      setTableExists(true);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleDelete = useCallback(async (memberId: string) => {
    Alert.alert(
      'Remove Family Member',
      'Are you sure you want to remove this family member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('family_members')
                .delete()
                .eq('id', memberId)
                .eq('user_id', user?.id); // Security: ensure ownership

              if (error) {
                Alert.alert('Error', error.message);
                return;
              }

              setMembers(prev => prev.filter(m => m.id !== memberId));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to remove');
            }
          },
        },
      ]
    );
  }, [user?.id]);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#3b82f6" />
      </SafeAreaView>
    );
  }

  if (!tableExists) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Family</Text>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Ionicons name="people-outline" size={64} color="#333" />
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 }}>
            Family Members Not Available
          </Text>
          <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8 }}>
            The family_members table has not been created in your database yet.{'\n'}
            Run the SQL migration to enable this feature.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', flex: 1 }}>Family</Text>
          <TouchableOpacity
            onPress={() => router.push('/profile/family/add' as any)}
            style={{ backgroundColor: '#3b82f6', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {members.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 }}>
            <Ionicons name="people-outline" size={64} color="#333" />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 }}>
              No Family Members
            </Text>
            <Text style={{ color: '#666', fontSize: 14, textAlign: 'center', marginTop: 8, marginBottom: 24 }}>
              Add family members to your family tree
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/profile/family/add' as any)}
              style={{
                backgroundColor: '#3b82f6',
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Add Member</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ padding: 16 }}>
            {members.map((member) => (
              <View
                key={member.id}
                style={{
                  backgroundColor: '#1a1a1a',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: '#252525',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="person" size={24} color="#666" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{member.full_name}</Text>
                  <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{member.relationship}</Text>
                  {member.email ? (
                    <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{member.email}</Text>
                  ) : null}
                </View>
                <TouchableOpacity onPress={() => handleDelete(member.id)} style={{ padding: 8 }}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
