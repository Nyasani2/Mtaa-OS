// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
export default function NewPolicyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const handleSave = async () => {
    if (!title.trim() || !body.trim()) {
      Alert.alert('Error', 'Title and body are required');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.from('education_policies').insert({
        title: title.trim(),
        body: body.trim(),
        created_by: user?.id,
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      Alert.alert('Success', 'Policy published', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ paddingTop: 48, paddingHorizontal: 16, paddingBottom: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={20} color="#94a3b8" />
          <Text style={{ color: '#94a3b8', marginLeft: 4, fontSize: 14 }}>Back</Text>
        </TouchableOpacity>
        <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: '800' }}>New Policy</Text>
        <Text style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>Publish a school policy</Text>
      </View>
      <View style={{ paddingHorizontal: 16 }}>
        <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 12 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Title *</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="Policy title" placeholderTextColor="#475569" style={{ backgroundColor: '#0f172a', borderRadius: 8, padding: 12, color: '#f8fafc', fontSize: 15, borderWidth: 1, borderColor: '#334155' }} />
        </View>
        <View style={{ backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <Text style={{ color: '#94a3b8', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' }}>Policy Body *</Text>
          <TextInput value={body} onChangeText={setBody} placeholder="Write the full policy..." placeholderTextColor="#475569" multiline numberOfLines={8} style={{ backgroundColor: '#0f172a', borderRadius: 8, padding: 12, color: '#f8fafc', fontSize: 15, borderWidth: 1, borderColor: '#334155', minHeight: 160, textAlignVertical: 'top' }} />
        </View>
        <TouchableOpacity onPress={handleSave} disabled={loading} style={{ backgroundColor: loading ? '#1e3a5f' : '#0ea5e9', borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginBottom: 32 }}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Ionicons name="checkmark-circle" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700', marginLeft: 8 }}>Publish Policy</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
