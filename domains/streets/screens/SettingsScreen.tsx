// domains/streets/screens/SettingsScreen.tsx
// Streets settings screen
// Imported by: app/(os)/streets/settings.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

export interface StreetsSettings {
  notificationsEnabled: boolean;
  mentionsEnabled: boolean;
  dmEnabled: boolean;
  profileVisible: boolean;
  contentDownloadable: boolean;
  autoPlayVideos: boolean;
  dataSaver: boolean;
}

export default function SettingsScreen() {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [settings, setSettings] = useState<StreetsSettings>({
    notificationsEnabled: true,
    mentionsEnabled: true,
    dmEnabled: true,
    profileVisible: true,
    contentDownloadable: false,
    autoPlayVideos: true,
    dataSaver: false,
  });
  const [saving, setSaving] = useState(false);

  const updateSetting = async <K extends keyof StreetsSettings>(
    key: K,
    value: StreetsSettings[K]
  ) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);

    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('streets_user_settings')
        .upsert({ user_id: user.id, ...updated, updated_at: new Date().toISOString() });
      if (error) throw error;
    } catch (e: any) {
      Alert.alert('Error', e.message);
      setSettings(settings); // revert
    } finally {
      setSaving(false);
    }
  };

  const renderToggle = (
    label: string,
    description: string,
    key: keyof StreetsSettings,
    icon: string
  ) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={22} color="#2563eb" />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={(v) => updateSetting(key, v as any)}
        trackColor={{ false: '#d1d5db', true: '#2563eb' }}
        thumbColor="#fff"
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#0a0a0a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streets Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scroll}>
        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          {renderToggle(
            'Push Notifications',
            'Receive alerts for likes, comments, and follows',
            'notificationsEnabled',
            'notifications-outline'
          )}
          {renderToggle(
            'Mentions',
            'Get notified when someone mentions you',
            'mentionsEnabled',
            'at-outline'
          )}
          {renderToggle(
            'Direct Messages',
            'Allow others to message you',
            'dmEnabled',
            'mail-outline'
          )}
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          {renderToggle(
            'Public Profile',
            'Make your profile visible to everyone',
            'profileVisible',
            'eye-outline'
          )}
          {renderToggle(
            'Allow Downloads',
            'Let others download your content',
            'contentDownloadable',
            'download-outline'
          )}
        </View>

        {/* Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Media</Text>
          {renderToggle(
            'Auto-play Videos',
            'Play videos automatically in feed',
            'autoPlayVideos',
            'play-circle-outline'
          )}
          {renderToggle(
            'Data Saver',
            'Reduce data usage with lower quality media',
            'dataSaver',
            'cellular-outline'
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, styles.dangerTitle]}>Danger Zone</Text>
          <TouchableOpacity
            style={styles.dangerBtn}
            onPress={() =>
              Alert.alert('Delete Account Data', 'This will remove all your Streets content. Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: async () => {
                    if (!user?.id) return;
                    await supabase.from('streets_posts').delete().eq('creator_id', user.id);
                    Alert.alert('Deleted', 'Your Streets content has been removed.');
                  },
                },
              ])
            }
          >
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={styles.dangerText}>Delete All My Content</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0a0a0a' },
  placeholder: { width: 32 },
  scroll: { flex: 1 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', marginBottom: 8 },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: '#0a0a0a' },
  settingDesc: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  dangerTitle: { color: '#ef4444' },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dangerText: { fontSize: 15, color: '#ef4444', marginLeft: 12, fontWeight: '500' },
});
