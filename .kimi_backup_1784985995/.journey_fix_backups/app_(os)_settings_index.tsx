// app/(os)/settings/index.tsx — FIXED
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/profile')}>
            <Ionicons name="person-outline" size={22} color="#333" />
            <Text style={styles.rowText}>Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/wallet')}>
            <Ionicons name="wallet-outline" size={22} color="#333" />
            <Text style={styles.rowText}>Wallet</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.row}>
            <Ionicons name="notifications-outline" size={22} color="#333" />
            <Text style={styles.rowText}>Notifications</Text>
            <Switch value={notifications} onValueChange={setNotifications} />
          </View>
          <View style={styles.row}>
            <Ionicons name="moon-outline" size={22} color="#333" />
            <Text style={styles.rowText}>Dark Mode</Text>
            <Switch value={darkMode} onValueChange={setDarkMode} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/settings/pin')}>
            <Ionicons name="lock-closed-outline" size={22} color="#333" />
            <Text style={styles.rowText}>Change PIN</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.button, styles.logout]} onPress={signOut}>
          <Text style={[styles.buttonText, styles.logoutText]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { padding: 20, backgroundColor: '#fff', marginBottom: 12 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1a1a1a' },
  section: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 12, marginBottom: 12, overflow: 'hidden' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#999', textTransform: 'uppercase', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowText: { flex: 1, fontSize: 16, marginLeft: 12, color: '#333' },
  button: { backgroundColor: '#007AFF', margin: 16, padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logout: { backgroundColor: '#FF3B30', marginTop: 8 },
  logoutText: { color: '#fff' },
});
