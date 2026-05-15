import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacySettings {
  profile_visible: boolean;
  show_online_status: boolean;
  allow_search: boolean;
  share_activity: boolean;
  data_collection: boolean;
  third_party_sharing: boolean;
}

export default function PrivacyScreen() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<PrivacySettings>({
    profile_visible: true,
    show_online_status: true,
    allow_search: true,
    share_activity: false,
    data_collection: true,
    third_party_sharing: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('mtaa_privacy');
      if (saved) setSettings(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof PrivacySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('mtaa_privacy', JSON.stringify(newSettings));
    } catch (e) {
      // ignore
    }
  };

  const handleExportData = () => {
    router.push('/(os)/settings/export-data');
  };

  const handleDeleteAccount = () => {
    router.push('/(os)/settings/delete-account');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Visibility</Text>
        
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Public Profile</Text>
            <Text style={styles.rowSub}>Allow others to view your profile</Text>
          </View>
          <Switch
            value={settings.profile_visible}
            onValueChange={() => handleToggle('profile_visible')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.profile_visible ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Online Status</Text>
            <Text style={styles.rowSub}>Show when you're active</Text>
          </View>
          <Switch
            value={settings.show_online_status}
            onValueChange={() => handleToggle('show_online_status')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.show_online_status ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Searchable</Text>
            <Text style={styles.rowSub}>Allow users to find you by name or email</Text>
          </View>
          <Switch
            value={settings.allow_search}
            onValueChange={() => handleToggle('allow_search')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.allow_search ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data & Sharing</Text>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Activity Sharing</Text>
            <Text style={styles.rowSub}>Share posts and interactions</Text>
          </View>
          <Switch
            value={settings.share_activity}
            onValueChange={() => handleToggle('share_activity')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.share_activity ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Analytics Collection</Text>
            <Text style={styles.rowSub}>Help improve MTAA with usage data</Text>
          </View>
          <Switch
            value={settings.data_collection}
            onValueChange={() => handleToggle('data_collection')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.data_collection ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Third-Party Sharing</Text>
            <Text style={styles.rowSub}>Share data with partner services</Text>
          </View>
          <Switch
            value={settings.third_party_sharing}
            onValueChange={() => handleToggle('third_party_sharing')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.third_party_sharing ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Data</Text>
        
        <TouchableOpacity style={styles.actionRow} onPress={handleExportData}>
          <Text style={styles.actionLabel}>📥 Export My Data</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionRow, styles.dangerRow]} onPress={handleDeleteAccount}>
          <Text style={[styles.actionLabel, styles.dangerText]}>🗑️ Delete Account</Text>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#888', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  rowInfo: { flex: 1, marginRight: 12 },
  rowLabel: { color: '#fff', fontSize: 15 },
  rowSub: { color: '#888', fontSize: 12, marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a1a1a',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  dangerRow: { backgroundColor: '#ef444410' },
  actionLabel: { color: '#fff', fontSize: 15 },
  dangerText: { color: '#ef4444' },
  chevron: { color: '#666', fontSize: 18 },
  backButton: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
