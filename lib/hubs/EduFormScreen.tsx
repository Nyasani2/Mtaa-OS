// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function makeEduForm(config: any) {
  const {
    table, title, subtitle, accent = '#10b981', icon = 'create',
    fields, successMessage = 'Saved successfully.',
  } = config;

  return function EduFormScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [form, setForm] = useState<any>(fields.reduce((acc: any, f: any) => ({ ...acc, [f.key]: f.default ?? '' }), {}));
    const [loading, setLoading] = useState(false);

    const setField = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

    const submit = async () => {
      const required = fields.filter((f: any) => f.required).find((f: any) => !form[f.key] || String(form[f.key]).trim() === '');
      if (required) { Alert.alert('Validation', `${required.label} is required`); return; }

      setLoading(true);
      try {
        const payload: any = {};
        for (const f of fields) {
          let val = form[f.key];
          if (f.type === 'number') val = Number(val) || 0;
          if (f.type === 'boolean') val = Boolean(val);
          if (f.nullable && (!val || String(val).trim() === '')) val = null;
          if (val !== undefined) payload[f.key] = val;
        }
        if (config.userScoped) payload.user_id = user?.id;
        if (config.userIdField) payload[config.userIdField] = user?.id;

        const { error } = await supabase.from(table).insert(payload);
        if (error) throw error;
        Alert.alert('Success', successMessage, [{ text: 'OK', onPress: () => router.back() }]);
      } catch (err: any) {
        Alert.alert('Error', err?.message || 'Failed to save');
      } finally {
        setLoading(false);
      }
    };

    return (
      <ScrollView style={st.container} contentContainerStyle={st.content}>
        <View style={[st.header, { backgroundColor: accent }]}>
          <Ionicons name={icon} size={28} color="#fff" />
          <View>
            <Text style={st.title}>{title}</Text>
            {subtitle && <Text style={st.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        {fields.map((f: any) => (
          <View key={f.key} style={st.field}>
            <Text style={st.label}>{f.label}{f.required ? ' *' : ''}</Text>
            {f.type === 'textarea' ? (
              <TextInput style={[st.input, st.textarea]} multiline numberOfLines={4} placeholder={f.placeholder} value={form[f.key]} onChangeText={(v) => setField(f.key, v)} />
            ) : (
              <TextInput style={st.input} placeholder={f.placeholder} value={form[f.key]} onChangeText={(v) => setField(f.key, v)} keyboardType={f.type === 'number' ? 'numeric' : 'default'} />
            )}
          </View>
        ))}
        <TouchableOpacity style={[st.submitBtn, { backgroundColor: accent }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={st.submitText}>Save</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  };
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 52 },
  title: { color: '#fff', fontSize: 20, fontWeight: '800' },
  subtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginTop: 2 },
  field: { marginTop: 16, paddingHorizontal: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#475569', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15 },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  submitBtn: { margin: 16, borderRadius: 10, padding: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
