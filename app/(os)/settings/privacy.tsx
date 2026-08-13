import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const VISIBILITY_OPTIONS = ['public', 'followers', 'friends', 'private'];
const MESSAGE_OPTIONS = ['everyone', 'followers', 'friends', 'nobody'];

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single().then(({ data }) => {
      if (data) setSettings(data);
      else setSettings({ is_profile_public: true, is_portfolio_public: true, is_achievements_public: true, is_skills_public: true, allow_messages_from: 'all', allow_calls_from: 'none', show_email: false, show_phone: false, show_location: true });
      setLoading(false);
    });
  }, [user?.id]);

  const save = async () => { if (!user?.id) return; setSaving(true); await supabase.from('user_profiles').upsert({ ...settings, user_id: user.id, updated_at: new Date().toISOString() }); setSaving(false); };
  if (loading) return <View style={[styles.container, styles.center]}><ActivityIndicator size="large" color="#00d4ff" /></View>;

  const toggle = (key: string) => setSettings((prev: any) => ({ ...prev, [key]: !prev[key] }));
  const ToggleRow = ({ label, key }: { label: string; key: string }) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch value={!!settings?.[key]} onValueChange={() => toggle(key)} trackColor={{ false: '#333', true: '#00d4ff' }} thumbColor="#fff" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy</Text>
        <TouchableOpacity onPress={save} disabled={saving}><Text style={styles.saveBtn}>{saving ? 'Saving...' : 'Save'}</Text></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Visibility</Text>
          <ToggleRow label="Public Profile" key="is_profile_public" />
          <ToggleRow label="Portfolio Visible" key="is_portfolio_public" />
          <ToggleRow label="Achievements Visible" key="is_achievements_public" />
          <ToggleRow label="Skills Visible" key="is_skills_public" />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          <ToggleRow label="Show Email" key="show_email" />
          <ToggleRow label="Show Phone" key="show_phone" />
          <ToggleRow label="Show Location" key="show_location" />
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Messaging</Text>
          <Text style={styles.subLabel}>Allow messages from:</Text>
          {MESSAGE_OPTIONS.map((opt: any) => (
            <TouchableOpacity key={opt} style={[styles.optionBtn, settings?.allow_messages_from === opt && styles.optionBtnActive]} onPress={() => setSettings((prev: any) => ({ ...prev, allow_messages_from: opt }))}>
              <Text style={[styles.optionText, settings?.allow_messages_from === opt && styles.optionTextActive]}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blocked Users</Text>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/settings/blocked' as any)}>
            <Ionicons name="ban-outline" size={20} color="#ff4444" />
            <Text style={styles.rowText}>Manage Blocked Users</Text>
            <Ionicons name="chevron-forward" size={16} color="#444" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  saveBtn: { color: '#00d4ff', fontWeight: '700', fontSize: 14 },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  toggleLabel: { color: '#fff', fontSize: 14 },
  subLabel: { color: '#888', fontSize: 12, marginBottom: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#111', marginBottom: 6, borderWidth: 1, borderColor: '#222' },
  optionBtnActive: { backgroundColor: '#00d4ff22', borderColor: '#00d4ff' },
  optionText: { color: '#888', fontSize: 13 },
  optionTextActive: { color: '#00d4ff', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  rowText: { color: '#fff', fontSize: 14, flex: 1, marginLeft: 12 },
});
