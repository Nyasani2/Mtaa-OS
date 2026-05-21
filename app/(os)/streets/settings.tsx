import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, Switch
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [creatorMode, setCreatorMode] = useState(false);
  const [adsEnabled, setAdsEnabled] = useState(true);

  const settingsSections = [
    {
      title: 'Account',
      items: [
        { label: 'Edit Profile', icon: 'create-outline', action: () => router.push('/profile/edit') },
        { label: 'Privacy', icon: 'lock-closed-outline', action: () => router.push('/settings/privacy') },
        { label: 'Security', icon: 'shield-checkmark-outline', action: () => router.push('/settings/security') },
        { label: 'Blocked Users', icon: 'ban-outline', action: () => router.push('/settings/blocked') },
      ],
    },
    {
      title: 'Creator',
      items: [
        { label: 'Creator Settings', icon: 'videocam-outline', action: () => router.push('/studio/settings') },
        { label: 'Monetization', icon: 'cash-outline', action: () => router.push('/studio/monetization') },
        { label: 'Ad Settings', icon: 'megaphone-outline', action: () => router.push('/ads/settings') },
        { label: 'Analytics', icon: 'stats-chart-outline', action: () => router.push('/studio/analytics') },
      ],
    },
    {
      title: 'Wallet',
      items: [
        { label: 'Wallet Settings', icon: 'wallet-outline', action: () => router.push('/wallet/settings') },
        { label: 'Payment Methods', icon: 'card-outline', action: () => router.push('/wallet/payments') },
        { label: 'Transaction History', icon: 'receipt-outline', action: () => router.push('/wallet/history') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Notifications', icon: 'notifications-outline', toggle: true, value: notifications, onToggle: setNotifications },
        { label: 'Private Account', icon: 'eye-off-outline', toggle: true, value: privateAccount, onToggle: setPrivateAccount },
        { label: 'Creator Mode', icon: 'star-outline', toggle: true, value: creatorMode, onToggle: setCreatorMode },
        { label: 'Show Ads', icon: 'megaphone-outline', toggle: true, value: adsEnabled, onToggle: setAdsEnabled },
      ],
    },
  ];

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await supabase.rpc('delete_user_account', { user_id: user?.id });
            signOut();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {settingsSections.map((section, idx) => (
          <View key={idx} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={styles.settingRow}
                onPress={item.action}
                disabled={!!item.toggle}
              >
                <View style={styles.settingLeft}>
                  <Ionicons name={item.icon as any} size={20} color="#94a3b8" />
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                {item.toggle ? (
                  <Switch
                    value={item.value}
                    onValueChange={item.onToggle}
                    trackColor={{ false: '#334155', true: '#3b82f6' }}
                    thumbColor="#f8fafc"
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color="#64748b" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.dangerRow} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text style={styles.dangerText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dangerRow} onPress={handleDeleteAccount}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
            <Text style={styles.dangerText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontSize: 15, color: '#f8fafc' },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#0f172a',
  },
  dangerText: { fontSize: 15, color: '#ef4444', fontWeight: '600' },
});
