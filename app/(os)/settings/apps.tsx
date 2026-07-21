import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface AppInfo {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  size: string;
  version: string;
  notifications: boolean;
  backgroundRefresh: boolean;
}

export default function AppsSettingsScreen() {
  const router = useRouter();
  const [apps, setApps] = useState<AppInfo[]>([
    { id: 'wallet', name: 'Wallet', icon: 'wallet-outline', iconColor: '#10B981', size: '45 MB', version: '2.5.0', notifications: true, backgroundRefresh: true },
    { id: 'health', name: 'Health', icon: 'medical-outline', iconColor: '#EF4444', size: '38 MB', version: '2.5.0', notifications: true, backgroundRefresh: true },
    { id: 'streets', name: 'Streets', icon: 'newspaper-outline', iconColor: '#3B82F6', size: '32 MB', version: '1.8.2', notifications: true, backgroundRefresh: false },
    { id: 'mtaxi', name: 'MTaxi', icon: 'car-outline', iconColor: '#06B6D4', size: '28 MB', version: '1.5.0', notifications: true, backgroundRefresh: true },
    { id: 'marketplace', name: 'Marketplace', icon: 'cart-outline', iconColor: '#F59E0B', size: '25 MB', version: '1.3.0', notifications: false, backgroundRefresh: false },
    { id: 'messages', name: 'Messages', icon: 'chatbubble-outline', iconColor: '#06B6D4', size: '22 MB', version: '1.2.0', notifications: true, backgroundRefresh: true },
    { id: 'education', name: 'Education', icon: 'school-outline', iconColor: '#8B5CF6', size: '55 MB', version: '1.0.0', notifications: true, backgroundRefresh: true },
    { id: 'studio', name: 'Studio', icon: 'videocam-outline', iconColor: '#EF4444', size: '42 MB', version: '1.1.0', notifications: false, backgroundRefresh: false },
  ]);

  const [selectedApp, setSelectedApp] = useState<string | null>(null);

  const handleUninstall = (appId: string) => {
    Alert.alert('Uninstall App', 'Are you sure? This will remove all app data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Uninstall', style: 'destructive', onPress: () => {
        setApps(prev => prev.filter(a => a.id !== appId));
        setSelectedApp(null);
      }},
    ]);
  };

  const toggleNotification = (appId: string) => {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, notifications: !a.notifications } : a));
  };

  const toggleBackground = (appId: string) => {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, backgroundRefresh: !a.backgroundRefresh } : a));
  };

  const totalSize = apps.reduce((sum, a) => sum + parseFloat(a.size), 0);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Apps</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.summaryCard}>
          <Text style={{ color: '#fff', fontSize: 32, fontWeight: '700' }}>{apps.length}</Text>
          <Text style={{ color: '#94A3B8', fontSize: 14 }}>Installed apps · {totalSize.toFixed(0)} MB total</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>INSTALLED APPS</Text>
          <View style={s.card}>
            {apps.map((app, i) => (
              <View key={app.id}>
                <TouchableOpacity
                  style={[s.row, i === apps.length - 1 && !selectedApp && { borderBottomWidth: 0 }]}
                  onPress={() => setSelectedApp(selectedApp === app.id ? null : app.id)}
                >
                  <View style={[s.iconWrap, { backgroundColor: app.iconColor + '20' }]}>
                    <Ionicons name={app.icon as any} size={20} color={app.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowText}>{app.name}</Text>
                    <Text style={{ color: '#64748B', fontSize: 12 }}>{app.size} · v{app.version}</Text>
                  </View>
                  <Ionicons name={selectedApp === app.id ? 'chevron-up' : 'chevron-down'} size={18} color="#475569" />
                </TouchableOpacity>

                {selectedApp === app.id && (
                  <View style={{ backgroundColor: '#0F172A', paddingHorizontal: 16, paddingVertical: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ color: '#fff', fontSize: 14 }}>Notifications</Text>
                      <TouchableOpacity
                        style={[s.toggleBtn, app.notifications && s.toggleBtnActive]}
                        onPress={() => toggleNotification(app.id)}
                      >
                        <Text style={{ color: app.notifications ? '#fff' : '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                          {app.notifications ? 'ON' : 'OFF'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <Text style={{ color: '#fff', fontSize: 14 }}>Background Refresh</Text>
                      <TouchableOpacity
                        style={[s.toggleBtn, app.backgroundRefresh && s.toggleBtnActive]}
                        onPress={() => toggleBackground(app.id)}
                      >
                        <Text style={{ color: app.backgroundRefresh ? '#fff' : '#94A3B8', fontSize: 12, fontWeight: '600' }}>
                          {app.backgroundRefresh ? 'ON' : 'OFF'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={{ backgroundColor: '#EF444420', paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#EF444440' }}
                      onPress={() => handleUninstall(app.id)}
                    >
                      <Text style={{ color: '#EF4444', fontSize: 14, fontWeight: '600' }}>Uninstall App</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  summaryCard: { marginHorizontal: 16, marginTop: 8, padding: 24, backgroundColor: '#1E293B', borderRadius: 16, alignItems: 'center' },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  rowText: { fontSize: 16, color: '#fff', fontWeight: '500' },
  toggleBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: '#334155' },
  toggleBtnActive: { backgroundColor: '#6366f1' },
});
