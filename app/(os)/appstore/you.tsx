// @ts-nocheck
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppStore } from '@/lib/appstore';
import { useIdentity } from "@/lib/auth";

export default function AppStoreYou() {
  const router = useRouter();
  const { installedApps, apps, interests, toggleInterest } = useAppStore();
  const { user } = useIdentity();

  const [autoUpdate, setAutoUpdate] = useState(true);
  const [wifiOnly, setWifiOnly] = useState(true);
  const [notifications, setNotifications] = useState(true);

  const installedCount = installedApps.length;
  const totalApps = apps.length;
  const updateCount = apps.filter((a: any) => installedApps.includes(a.id) && !a.is_system_app).length;

  const menuItems = [
    { icon: 'download', label: 'Manage downloads', color: '#4ECDC4', onPress: () => {} },
    { icon: 'bell', label: 'Notifications', color: '#FFD700', onPress: () => {} },
    { icon: 'shield', label: 'App permissions', color: '#FF6B6B', onPress: () => {} },
    { icon: 'trash-2', label: 'Clear cache', color: '#888', onPress: () => {} },
    { icon: 'help-circle', label: 'Help & support', color: '#85C1E9', onPress: () => {} },
    { icon: 'info', label: 'About AppStore', color: '#96CEB4', onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>You</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Feather name="settings" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Feather name="user" size={32} color="#4ECDC4" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.user_metadata?.full_name || 'MTAA User'}</Text>
            <Text style={styles.profileEmail}>{user?.email || 'user@mtaa.africa'}</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Feather name="edit-2" size={16} color="#4ECDC4" />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{installedCount}</Text>
            <Text style={styles.statLabel}>Installed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{updateCount}</Text>
            <Text style={styles.statLabel}>Updates</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalApps}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
        </View>

        {/* Interests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Interests</Text>
          <View style={styles.interestsGrid}>
            {interests.map((interest: any) => (
              <TouchableOpacity
                key={interest.id}
                style={[styles.interestChip, interest.selected && styles.interestChipActive]}
                onPress={() => toggleInterest(interest.id)}
              >
                <Text style={[styles.interestText, interest.selected && styles.interestTextActive]}>
                  {interest.label}
                </Text>
                {interest.selected && <Feather name="check" size={12} color="#121212" style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#4ECDC420' }]}>
                  <Feather name="refresh-cw" size={16} color="#4ECDC4" />
                </View>
                <Text style={styles.settingLabel}>Auto-update apps</Text>
              </View>
              <Switch value={autoUpdate} onValueChange={setAutoUpdate} trackColor={{ false: '#333', true: '#4ECDC4' }} thumbColor="#fff" />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#FFD70020' }]}>
                  <Feather name="wifi" size={16} color="#FFD700" />
                </View>
                <Text style={styles.settingLabel}>Wi-Fi only downloads</Text>
              </View>
              <Switch value={wifiOnly} onValueChange={setWifiOnly} trackColor={{ false: '#333', true: '#4ECDC4' }} thumbColor="#fff" />
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.settingIcon, { backgroundColor: '#FF6B6B20' }]}>
                  <Feather name="bell" size={16} color="#FF6B6B" />
                </View>
                <Text style={styles.settingLabel}>App notifications</Text>
              </View>
              <Switch value={notifications} onValueChange={setNotifications} trackColor={{ false: '#333', true: '#4ECDC4' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>More</Text>
          <View style={styles.menuCard}>
            {menuItems.map((item, idx) => (
              <TouchableOpacity key={item.label} style={[styles.menuRow, idx < menuItems.length - 1 && styles.menuRowBorder]} onPress={item.onPress}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                    <Feather name={item.icon as any} size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#666" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Version */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>AppStore v4.0.0</Text>
          <Text style={styles.versionSub}>MTAA OS Build 2026.06.03</Text>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1C1C1C' },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  settingsButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1C1C1C', justifyContent: 'center', alignItems: 'center' },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1C', margin: 16, padding: 16, borderRadius: 16 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(78,205,196,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(78,205,196,0.3)' },
  profileInfo: { flex: 1, marginLeft: 14 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  profileEmail: { color: '#888', fontSize: 13, marginTop: 2 },
  editButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  statsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginHorizontal: 16, marginBottom: 24, backgroundColor: '#1C1C1C', borderRadius: 16, paddingVertical: 16 },
  statCard: { alignItems: 'center', flex: 1 },
  statDivider: { width: 1, height: 40, backgroundColor: '#333' },
  statNumber: { color: '#fff', fontSize: 24, fontWeight: '800' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 4 },
  section: { marginTop: 8, paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1C', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  interestChipActive: { backgroundColor: '#4ECDC4', borderColor: '#4ECDC4' },
  interestText: { color: '#ccc', fontSize: 14, fontWeight: '600' },
  interestTextActive: { color: '#121212', fontWeight: '700' },
  settingsCard: { backgroundColor: '#1C1C1C', borderRadius: 16, overflow: 'hidden' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  menuCard: { backgroundColor: '#1C1C1C', borderRadius: 16, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  versionSection: { alignItems: 'center', marginTop: 8, marginBottom: 16 },
  versionText: { color: '#666', fontSize: 13 },
  versionSub: { color: '#444', fontSize: 11, marginTop: 2 },
  bottomSpacer: { height: 100 },
});

