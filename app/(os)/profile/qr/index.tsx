// app/(os)/profile/qr/index.tsx — QR Identity

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QRScreen() {
  const router = useRouter();
  const { user, isAuthenticated, initialize } = useAuth();
  const [qrData, setQrData] = useState('');

  useEffect(() => { initialize(); }, []);
  useEffect(() => {
    if (user) {
      setQrData(JSON.stringify({
        type: 'mtaa_identity',
        user_id: user.id,
        username: user.username,
        full_name: user.full_name,
        action: 'profile',
      }));
    }
  }, [user]);

  async function handleShare() {
    const url = `mtaa://user/${user?.username || user?.id}`;
    await Share.share({
      message: `Connect with me on MTAA: ${url}`,
      url,
    });
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Ionicons name="qr-code-outline" size={64} color="#ccc" />
        <Text style={styles.emptyTitle}>Sign in to view QR Identity</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/sign-in')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Identity</Text>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-outline" size={22} color="#06b6d4" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* QR Placeholder */}
        <View style={styles.qrCard}>
          <View style={styles.qrPlaceholder}>
            <Ionicons name="qr-code" size={120} color="#06b6d4" />
          </View>
          <Text style={styles.qrLabel}>Scan to connect</Text>
          <Text style={styles.qrUrl}>mtaa://user/{user?.username || user?.id}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
            <Ionicons name="download-outline" size={20} color="#06b6d4" />
            <Text style={styles.actionText}>Save QR</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
            <Ionicons name="share-outline" size={20} color="#06b6d4" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => {}}>
            <Ionicons name="copy-outline" size={20} color="#06b6d4" />
            <Text style={styles.actionText}>Copy Link</Text>
          </TouchableOpacity>
        </View>

        {/* Permissions */}
        <View style={styles.permCard}>
          <Text style={styles.permTitle}>What others can see</Text>
          {[
            { icon: 'person-outline', label: 'Profile', active: true },
            { icon: 'wallet-outline', label: 'Pay', active: true },
            { icon: 'briefcase-outline', label: 'Hire', active: true },
            { icon: 'chatbubble-outline', label: 'Message', active: true },
            { icon: 'heart-outline', label: 'Follow', active: true },
            { icon: 'storefront-outline', label: 'Business', active: false },
          ].map((perm) => (
            <View key={perm.label} style={styles.permRow}>
              <Ionicons name={perm.icon as any} size={18} color={perm.active ? '#06b6d4' : '#ccc'} />
              <Text style={[styles.permLabel, { color: perm.active ? '#333' : '#aaa' }]}>{perm.label}</Text>
              <Ionicons name={perm.active ? "checkmark-circle" : "close-circle"}
                size={18} color={perm.active ? '#10b981' : '#ccc'} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1a1a1a' },
  content: { padding: 16 },
  qrCard: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', marginBottom: 16 },
  qrPlaceholder: { width: 200, height: 200, backgroundColor: '#f1f5f9', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  qrLabel: { fontSize: 16, fontWeight: '600', color: '#333' },
  qrUrl: { fontSize: 12, color: '#888', marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  actionBtn: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#06b6d4', marginTop: 6 },
  permCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  permTitle: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 12 },
  permRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  permLabel: { flex: 1, fontSize: 14, marginLeft: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginTop: 16, marginBottom: 16, textAlign: 'center' },
  button: { backgroundColor: '#06b6d4', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
