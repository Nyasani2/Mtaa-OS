import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TribeSettings {
  auto_join_invites: boolean;
  show_tribe_activity: boolean;
  tribe_notifications: boolean;
  allow_tribe_messages: boolean;
  public_tribe_membership: boolean;
  tribe_discovery: boolean;
}

export default function TribesSettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<TribeSettings>({
    auto_join_invites: true,
    show_tribe_activity: true,
    tribe_notifications: true,
    allow_tribe_messages: true,
    public_tribe_membership: false,
    tribe_discovery: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('mtaa_tribe_settings');
      if (saved) setSettings(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof TribeSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('mtaa_tribe_settings', JSON.stringify(newSettings));
    } catch (e) {
      // ignore
    }
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
      <Text style={styles.title}>Tribes</Text>
      <Text style={styles.subtitle}>Manage your tribe preferences</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Membership</Text>
        
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Auto-Accept Invites</Text>
            <Text style={styles.rowSub}>Automatically join tribes you're invited to</Text>
          </View>
          <Switch
            value={settings.auto_join_invites}
            onValueChange={() => handleToggle('auto_join_invites')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.auto_join_invites ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Public Membership</Text>
            <Text style={styles.rowSub}>Show tribe membership on your profile</Text>
          </View>
          <Switch
            value={settings.public_tribe_membership}
            onValueChange={() => handleToggle('public_tribe_membership')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.public_tribe_membership ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Activity</Text>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Show Tribe Activity</Text>
            <Text style={styles.rowSub}>Display tribe posts in your feed</Text>
          </View>
          <Switch
            value={settings.show_tribe_activity}
            onValueChange={() => handleToggle('show_tribe_activity')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.show_tribe_activity ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Tribe Notifications</Text>
            <Text style={styles.rowSub}>Get alerts for tribe events</Text>
          </View>
          <Switch
            value={settings.tribe_notifications}
            onValueChange={() => handleToggle('tribe_notifications')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.tribe_notifications ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Allow Tribe Messages</Text>
            <Text style={styles.rowSub}>Receive DMs from tribe members</Text>
          </View>
          <Switch
            value={settings.allow_tribe_messages}
            onValueChange={() => handleToggle('allow_tribe_messages')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.allow_tribe_messages ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discovery</Text>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Tribe Discovery</Text>
            <Text style={styles.rowSub}>Show tribe suggestions</Text>
          </View>
          <Switch
            value={settings.tribe_discovery}
            onValueChange={() => handleToggle('tribe_discovery')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.tribe_discovery ? '#fff' : '#888'}
          />
        </View>
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
  subtitle: { fontSize: 14, color: '#888', paddingHorizontal: 16, marginBottom: 24 },
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
  backButton: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
