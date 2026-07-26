import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function BusinessPublicScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('user_profiles').select('*').eq('user_id', id).single().then(({ data }) => {
      setBusiness(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="business-outline" size={48} color="#444" />
        <Text style={styles.emptyText}>Loading business profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{business?.display_name || 'Business'}</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.bio}>{business?.bio || 'No business description'}</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/profile/${id}`)}>
          <Text style={styles.actionBtnText}>View Full Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#888', fontSize: 14, marginTop: 12 },
  content: { padding: 16 },
  bio: { color: '#aaa', fontSize: 14, lineHeight: 20 },
  actionBtn: { marginTop: 20, backgroundColor: '#00d4ff', paddingVertical: 12, borderRadius: 20, alignItems: 'center' },
  actionBtnText: { color: '#000', fontWeight: '700' },
});
