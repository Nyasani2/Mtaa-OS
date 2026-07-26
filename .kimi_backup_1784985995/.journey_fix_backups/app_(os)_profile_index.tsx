// app/(os)/profile/index.tsx — FIXED
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, profile, isLoading, signOut, updateProfile } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.title}>Not Signed In</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/sign-in')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Image
            source={{ uri: user.avatar_url || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{user.display_name || user.email || 'User'}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.section}>
          <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/profile/edit')}>
            <Ionicons name="person-outline" size={22} color="#333" />
            <Text style={styles.rowText}>Edit Profile</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/wallet')}>
            <Ionicons name="wallet-outline" size={22} color="#333" />
            <Text style={styles.rowText}>Wallet</Text>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => router.push('/(os)/settings')}>
            <Ionicons name="settings-outline" size={22} color="#333" />
            <Text style={styles.rowText}>Settings</Text>
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
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { alignItems: 'center', padding: 24, backgroundColor: '#fff', marginBottom: 12 },
  avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 12 },
  name: { fontSize: 22, fontWeight: '700', color: '#1a1a1a' },
  email: { fontSize: 14, color: '#666', marginTop: 4 },
  section: { backgroundColor: '#fff', marginHorizontal: 12, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  rowText: { flex: 1, fontSize: 16, marginLeft: 12, color: '#333' },
  button: { backgroundColor: '#007AFF', margin: 16, padding: 14, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  logout: { backgroundColor: '#FF3B30', marginTop: 24 },
  logoutText: { color: '#fff' },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
});
