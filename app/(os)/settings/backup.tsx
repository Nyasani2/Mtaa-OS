import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function BackupSettingsScreen() {
  const router = useRouter();
  const [autoBackup, setAutoBackup] = useState(true);
  const [backupWifiOnly, setBackupWifiOnly] = useState(true);
  const [includePhotos, setIncludePhotos] = useState(true);
  const [includeContacts, setIncludeContacts] = useState(true);
  const [lastBackup] = useState('Today, 3:45 AM');
  const [nextBackup] = useState('Tomorrow, 3:00 AM');
  const [backupSize] = useState('2.4 GB');

  const backups = [
    { date: 'Jul 21, 2026', size: '2.4 GB', status: 'Complete', type: 'Automatic' },
    { date: 'Jul 20, 2026', size: '2.3 GB', status: 'Complete', type: 'Automatic' },
    { date: 'Jul 19, 2026', size: '2.3 GB', status: 'Complete', type: 'Automatic' },
    { date: 'Jul 15, 2026', size: '2.1 GB', status: 'Complete', type: 'Manual' },
  ];

  const handleBackupNow = () => {
    Alert.alert('Backup Started', 'Your data is being backed up to the cloud.');
  };

  const handleRestore = (date: string) => {
    Alert.alert('Restore Backup', `Restore from ${date}? This will overwrite current data.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Restore', style: 'destructive', onPress: () => Alert.alert('Restoring', 'Please wait...') },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Backup & Restore</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={s.statusCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={[s.iconWrap, { backgroundColor: '#10B98120' }]}>
              <Ionicons name="cloud-done" size={28} color="#10B981" />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600' }}>Backed Up</Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 2 }}>{lastBackup} · {backupSize}</Text>
            </View>
          </View>
          <TouchableOpacity style={s.backupBtn} onPress={handleBackupNow}>
            <Ionicons name="cloud-upload-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Backup Now</Text>
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>BACKUP SETTINGS</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Text style={s.rowText}>Auto Backup</Text>
              <Switch value={autoBackup} onValueChange={setAutoBackup}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={s.row}>
              <Text style={s.rowText}>Wi-Fi Only</Text>
              <Switch value={backupWifiOnly} onValueChange={setBackupWifiOnly}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={s.row}>
              <Text style={s.rowText}>Include Photos</Text>
              <Switch value={includePhotos} onValueChange={setIncludePhotos}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.rowText}>Include Contacts</Text>
              <Switch value={includeContacts} onValueChange={setIncludeContacts}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        {/* Backup History */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>BACKUP HISTORY</Text>
          <View style={s.card}>
            {backups.map((b, i) => (
              <TouchableOpacity key={b.date} style={[s.row, i === backups.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => handleRestore(b.date)}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowText}>{b.date}</Text>
                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>{b.type} · {b.size}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 }} />
                  <Text style={{ color: '#10B981', fontSize: 13 }}>{b.status}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#475569" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
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
  statusCard: { marginHorizontal: 16, marginTop: 8, padding: 24, backgroundColor: '#1E293B', borderRadius: 16 },
  iconWrap: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  backupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#6366f1', paddingVertical: 14, borderRadius: 12, marginTop: 20 },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  rowText: { flex: 1, fontSize: 16, color: '#fff' },
});
