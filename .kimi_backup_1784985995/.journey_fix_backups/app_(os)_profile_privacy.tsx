import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Shield, Eye, EyeOff, Lock, Smartphone, Globe, Trash2, ChevronRight } from 'lucide-react-native';

interface PrivacySettings {
  profile_visible: boolean;
  show_email: boolean;
  show_phone: boolean;
  allow_tagging: boolean;
  allow_mentions: boolean;
  two_factor_enabled: boolean;
}

export default function PrivacySecurity() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visible: true,
    show_email: false,
    show_phone: false,
    allow_tagging: true,
    allow_mentions: true,
    two_factor_enabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    supabase.from('user_profiles').select('*').eq('user_id', user.id).single()
      .then(({ data }) => {
        if (data) setSettings(prev => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  const toggle = async (key: keyof PrivacySettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    if (user?.id) {
      await supabase.from('user_profiles').upsert({ user_id: user.id, ...updated, updated_at: new Date().toISOString() });
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete Account', 'This action cannot be undone. Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Coming Soon', 'Account deletion will be available in the next update.') }
    ]);
  };

  const items = [
    { key: 'profile_visible' as const, label: 'Public Profile', desc: 'Allow others to find and view your profile', icon: Globe },
    { key: 'show_email' as const, label: 'Show Email', desc: 'Display email on your public profile', icon: Eye },
    { key: 'show_phone' as const, label: 'Show Phone', desc: 'Display phone number on your public profile', icon: EyeOff },
    { key: 'allow_tagging' as const, label: 'Allow Tagging', desc: 'Others can tag you in posts and photos', icon: Globe },
    { key: 'allow_mentions' as const, label: 'Allow Mentions', desc: 'Others can mention you in comments', icon: Globe },
    { key: 'two_factor_enabled' as const, label: 'Two-Factor Auth', desc: 'Require PIN + device verification', icon: Lock },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy & Security</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          {items.map((item) => (
            <View key={item.key} style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={styles.iconBox}>
                  <item.icon size={18} color="#38bdf8" />
                </View>
                <View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Text style={styles.rowDesc}>{item.desc}</Text>
                </View>
              </View>
              <Switch
                value={settings[item.key]}
                onValueChange={() => toggle(item.key)}
                trackColor={{ false: '#334155', true: '#38bdf8' }}
                thumbColor="#f8fafc"
              />
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/wallet/pin') }>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#fbbf2420' }]}>
                <Lock size={18} color="#fbbf24" />
              </View>
              <Text style={styles.rowLabel}>Change PIN</Text>
            </View>
            <ChevronRight size={18} color="#475569" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/settings') }>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#34d39920' }]}>
                <Smartphone size={18} color="#34d399" />
              </View>
              <Text style={styles.rowLabel}>Biometric Login</Text>
            </View>
            <ChevronRight size={18} color="#475569" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <TouchableOpacity style={[styles.actionRow, styles.dangerRow]} onPress={handleDeleteAccount}>
            <View style={styles.rowLeft}>
              <View style={[styles.iconBox, { backgroundColor: '#ef444420' }]}>
                <Trash2 size={18} color="#ef4444" />
              </View>
              <Text style={[styles.rowLabel, { color: '#ef4444' }]}>Delete Account</Text>
            </View>
            <ChevronRight size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  scroll: { flex: 1 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#38bdf820', justifyContent: 'center', alignItems: 'center' },
  rowLabel: { fontSize: 15, color: '#e2e8f0', fontWeight: '500' },
  rowDesc: { fontSize: 12, color: '#64748b', marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  dangerRow: { borderBottomColor: '#ef444440' },
});
