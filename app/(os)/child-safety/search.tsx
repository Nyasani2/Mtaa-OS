// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function SearchMissingChildren() {
  const router = useRouter();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    const { data, error } = await supabase.from('missing_children_reports').select('*').eq('status', 'missing').order('created_at', { ascending: false });
    if (!error) setReports(data || []);
    setLoading(false);
  };

  const renderCard = ({ item }) => (
    <View style={{ backgroundColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' }}>
      <View style={{ flexDirection: 'row' }}>
        {item.photo_url ? <Image source={{ uri: item.photo_url }} style={{ width: 100, height: 100, borderRadius: 12, marginRight: 16 }} /> : <View style={{ width: 100, height: 100, backgroundColor: '#334155', borderRadius: 12, marginRight: 16, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="person" size={40} color="#94A3B8" /></View>}
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800' }}>{item.child_name}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 13 }}>Age: {item.age || 'Unknown'} · {item.gender}</Text>
          <Text style={{ color: '#F59E0B', fontSize: 12, marginTop: 4, fontWeight: '600' }}> {item.last_seen_location || 'Location unknown'}</Text>
          <Text style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>Reported: {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      {item.description && <Text style={{ color: '#CBD5E1', fontSize: 13, marginTop: 12, lineHeight: 18 }}>{item.description}</Text>}
      
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.parent_contact_phone}`)} style={{ flex: 1, backgroundColor: '#10B981', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          <Ionicons name="call" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: '700' }}>Contact Parent</Text>
        </TouchableOpacity>
        {item.finder_contact_phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${item.finder_contact_phone}`)} style={{ flex: 1, backgroundColor: '#3B82F6', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
            <Ionicons name="location" size={16} color="#fff" style={{ marginRight: 6 }} />
            <Text style={{ color: '#fff', fontWeight: '700' }}>Contact Finder</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 16 }}>Missing Children Feed</Text>
      </View>
      {loading ? <ActivityIndicator size="large" color="#3B82F6" style={{ marginTop: 40 }} /> : (
        <FlatList data={reports} renderItem={renderCard} keyExtractor={item => item.id} contentContainerStyle={{ padding: 16 }} ListEmptyComponent={<Text style={{ color: '#94A3B8', textAlign: 'center', marginTop: 40 }}>No active missing children reports. 🎉</Text>} />
      )}
    </SafeAreaView>
  );
}
