import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator 
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VisibilitySettings {
  show_profile_photo: boolean;
  show_last_seen: boolean;
  allow_tagging: boolean;
  show_in_search: boolean;
  show_activity: boolean;
  allow_mentions: boolean;
}

export default function VisibilityScreen() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<VisibilitySettings>({
    show_profile_photo: true,
    show_last_seen: true,
    allow_tagging: true,
    show_in_search: true,
    show_activity: true,
    allow_mentions: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('mtaa_visibility');
      if (saved) setSettings(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
    setLoading(false);
  };

  const handleToggle = async (key: keyof VisibilitySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    try {
      await AsyncStorage.setItem('mtaa_visibility', JSON.stringify(newSettings));
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
      <Text style={styles.title}>Visibility</Text>
      <Text style={styles.subtitle}>Control who can see what</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile</Text>
        
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Profile Photo</Text>
            <Text style={styles.rowSub}>Show your photo to others</Text>
          </View>
          <Switch
            value={settings.show_profile_photo}
            onValueChange={() => handleToggle('show_profile_photo')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.show_profile_photo ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Last Seen</Text>
            <Text style={styles.rowSub}>Show when you were last active</Text>
          </View>
          <Switch
            value={settings.show_last_seen}
            onValueChange={() => handleToggle('show_last_seen')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.show_last_seen ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Wallet Balance</Text>
            <Text style={styles.rowSub}>Show balance on your profile</Text>
          </View>
          <Switch
            trackColor={{ false: '#333', true: '#6366f1' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Interactions</Text>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Allow Tagging</Text>
            <Text style={styles.rowSub}>Others can tag you in posts</Text>
          </View>
          <Switch
            value={settings.allow_tagging}
            onValueChange={() => handleToggle('allow_tagging')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.allow_tagging ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Allow Mentions</Text>
            <Text style={styles.rowSub}>Others can @mention you</Text>
          </View>
          <Switch
            value={settings.allow_mentions}
            onValueChange={() => handleToggle('allow_mentions')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.allow_mentions ? '#fff' : '#888'}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Show Activity</Text>
            <Text style={styles.rowSub}>Others see your posts and likes</Text>
          </View>
          <Switch
            value={settings.show_activity}
            onValueChange={() => handleToggle('show_activity')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.show_activity ? '#fff' : '#888'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Discovery</Text>

        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowLabel}>Appear in Search</Text>
            <Text style={styles.rowSub}>Users can find you by name</Text>
          </View>
          <Switch
            value={settings.show_in_search}
            onValueChange={() => handleToggle('show_in_search')}
            trackColor={{ false: '#333', true: '#6366f1' }}
            thumbColor={settings.show_in_search ? '#fff' : '#888'}
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
