import React, { useState, useCallback } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const RELATIONSHIPS = [
  'Parent', 'Sibling', 'Child', 'Spouse', 'Grandparent', 'Grandchild', 'Cousin', 'Other'
];

export default function AddFamilyMemberScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: '',
    relationship: '',
    email: '',
    phone: '',
    date_of_birth: '',
  });

  const updateField = useCallback((field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const validate = useCallback(() => {
    if (!form.full_name.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return false;
    }
    if (!form.relationship) {
      Alert.alert('Validation Error', 'Relationship is required');
      return false;
    }
    if (form.email && !form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    if (form.phone && !form.phone.match(/^\+?[\d\s\-()]+$/)) {
      Alert.alert('Validation Error', 'Please enter a valid phone number');
      return false;
    }
    if (form.date_of_birth && !form.date_of_birth.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Validation Error', 'Date of birth must be in YYYY-MM-DD format');
      return false;
    }
    return true;
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('family_members').insert({
        user_id: user.id,
        full_name: form.full_name.trim(),
        relationship: form.relationship,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        if (error.message?.includes('does not exist') || error.code === '42P01') {
          Alert.alert('Error', 'family_members table does not exist. Run the SQL migration first.');
        } else {
          Alert.alert('Save Failed', error.message);
        }
        setSaving(false);
        return;
      }

      router.back();
    } catch (err: any) {
      console.error('Save error:', err);
      Alert.alert('Error', err.message || 'Failed to add family member');
    } finally {
      setSaving(false);
    }
  }, [form, user?.id, validate, router]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', flex: 1 }}>Add Family Member</Text>
        </View>

        {/* Full Name */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Full Name *
          </Text>
          <TextInput
            value={form.full_name}
            onChangeText={(text) => updateField('full_name', text)}
            placeholder="Enter full name"
            placeholderTextColor="#444"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}
          />
        </View>

        {/* Relationship */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Relationship *
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {RELATIONSHIPS.map((rel) => (
              <TouchableOpacity
                key={rel}
                onPress={() => updateField('relationship', rel)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 20,
                  backgroundColor: form.relationship === rel ? '#3b82f6' : '#1a1a1a',
                  borderWidth: 1,
                  borderColor: form.relationship === rel ? '#3b82f6' : '#333',
                }}
              >
                <Text style={{ color: form.relationship === rel ? '#fff' : '#888', fontSize: 12 }}>{rel}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Email */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Email
          </Text>
          <TextInput
            value={form.email}
            onChangeText={(text) => updateField('email', text)}
            placeholder="email@example.com"
            placeholderTextColor="#444"
            keyboardType="email-address"
            autoCapitalize="none"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}
          />
        </View>

        {/* Phone */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Phone
          </Text>
          <TextInput
            value={form.phone}
            onChangeText={(text) => updateField('phone', text)}
            placeholder="+254 7XX XXX XXX"
            placeholderTextColor="#444"
            keyboardType="phone-pad"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}
          />
        </View>

        {/* Date of Birth */}
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, textTransform: 'uppercase' }}>
            Date of Birth
          </Text>
          <TextInput
            value={form.date_of_birth}
            onChangeText={(text) => updateField('date_of_birth', text)}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#444"
            style={{ backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, fontSize: 14 }}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          disabled={saving}
          style={{
            backgroundColor: '#3b82f6',
            padding: 16,
            borderRadius: 12,
            alignItems: 'center',
            opacity: saving ? 0.6 : 1,
          }}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Add Member</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
