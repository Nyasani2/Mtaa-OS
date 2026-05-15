import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ScrollView, 
  Switch, ActivityIndicator, Alert, Linking 
} from 'react-native';
import { router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as Location from 'expo-location';
import * as Camera from 'expo-camera';
import * as Contacts from 'expo-contacts';
import * as MediaLibrary from 'expo-media-library';

interface PermissionStatus {
  notifications: boolean;
  location: boolean;
  camera: boolean;
  contacts: boolean;
  media: boolean;
  microphone: boolean;
}

export default function PermissionsScreen() {
  const [loading, setLoading] = useState(true);
  const [perms, setPerms] = useState<PermissionStatus>({
    notifications: false,
    location: false,
    camera: false,
    contacts: false,
    media: false,
    microphone: false,
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    setLoading(true);
    
    const notif = await Notifications.getPermissionsAsync();
    const loc = await Location.getForegroundPermissionsAsync();
    const cam = await Camera.getCameraPermissionsAsync();
    const cont = await Contacts.getPermissionsAsync();
    const med = await MediaLibrary.getPermissionsAsync();

    setPerms({
      notifications: notif.status === 'granted',
      location: loc.status === 'granted',
      camera: cam.status === 'granted',
      contacts: cont.status === 'granted',
      media: med.status === 'granted',
      microphone: false, // Check separately
    });
    setLoading(false);
  };

  const handleRequest = async (type: string) => {
    let result;
    switch (type) {
      case 'notifications':
        result = await Notifications.requestPermissionsAsync();
        setPerms(p => ({ ...p, notifications: result.status === 'granted' }));
        break;
      case 'location':
        result = await Location.requestForegroundPermissionsAsync();
        setPerms(p => ({ ...p, location: result.status === 'granted' }));
        break;
      case 'camera':
        result = await Camera.requestCameraPermissionsAsync();
        setPerms(p => ({ ...p, camera: result.status === 'granted' }));
        break;
      case 'contacts':
        result = await Contacts.requestPermissionsAsync();
        setPerms(p => ({ ...p, contacts: result.status === 'granted' }));
        break;
      case 'media':
        result = await MediaLibrary.requestPermissionsAsync();
        setPerms(p => ({ ...p, media: result.status === 'granted' }));
        break;
      case 'microphone':
        Alert.alert('Microphone', 'Please enable microphone in system settings');
        break;
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  const permissions = [
    { key: 'notifications' as const, label: 'Notifications', desc: 'Receive alerts and updates', icon: '🔔' },
    { key: 'location' as const, label: 'Location', desc: 'Find nearby services and people', icon: '📍' },
    { key: 'camera' as const, label: 'Camera', desc: 'Take photos and scan QR codes', icon: '📷' },
    { key: 'contacts' as const, label: 'Contacts', desc: 'Find friends on MTAA', icon: '👥' },
    { key: 'media' as const, label: 'Photos & Media', desc: 'Upload and share media', icon: '🖼️' },
    { key: 'microphone' as const, label: 'Microphone', desc: 'Voice messages and calls', icon: '🎤' },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Permissions</Text>
      <Text style={styles.subtitle}>Manage app access to device features</Text>

      {permissions.map((perm) => (
        <View key={perm.key} style={styles.permRow}>
          <Text style={styles.permIcon}>{perm.icon}</Text>
          <View style={styles.permInfo}>
            <Text style={styles.permLabel}>{perm.label}</Text>
            <Text style={styles.permDesc}>{perm.desc}</Text>
          </View>
          {perms[perm.key] ? (
            <TouchableOpacity style={styles.manageBtn} onPress={handleOpenSettings}>
              <Text style={styles.manageText}>Manage</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.allowBtn} onPress={() => handleRequest(perm.key)}>
              <Text style={styles.allowText}>Allow</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      <TouchableOpacity style={styles.settingsBtn} onPress={handleOpenSettings}>
        <Text style={styles.settingsBtnText}>⚙️ Open System Settings</Text>
      </TouchableOpacity>

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
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 1,
    borderRadius: 8,
  },
  permIcon: { fontSize: 20, marginRight: 12, width: 28 },
  permInfo: { flex: 1 },
  permLabel: { color: '#fff', fontSize: 15 },
  permDesc: { color: '#888', fontSize: 12, marginTop: 2 },
  manageBtn: {
    backgroundColor: '#333',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  manageText: { color: '#888', fontSize: 12 },
  allowBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  allowText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  settingsBtn: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingsBtnText: { color: '#fff', fontSize: 14 },
  backButton: { marginTop: 16, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
