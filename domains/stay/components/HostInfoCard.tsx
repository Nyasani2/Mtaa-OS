import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, MessageCircle, Award } from 'lucide-react-native';

interface Props { host?: any; }

export default function HostInfoCard({ host }: Props) {
  if (!host) return null;
  const isVerified = host?.government_id_verified || host?.phone_verified;
  const isSuperhost = host?.superhost_status;
  const responseRate = host?.response_rate || 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.initial}>{host?.name?.[0] || 'H'}</Text></View>
        <View style={styles.meta}>
          <Text style={styles.name}>{host?.name || 'Host'}</Text>
          <Text style={styles.sub}>{isSuperhost ? 'Superhost' : 'Host'} · Joined 2024</Text>
        </View>
      </View>
      <View style={styles.badges}>
        {isVerified && (
          <View style={styles.badge}><ShieldCheck size={14} color="#1a5c4b" /><Text style={styles.badgeText}>Identity verified</Text></View>
        )}
        {isSuperhost && (
          <View style={styles.badge}><Award size={14} color="#1a5c4b" /><Text style={styles.badgeText}>Superhost</Text></View>
        )}
        <View style={styles.badge}><MessageCircle size={14} color="#1a5c4b" /><Text style={styles.badgeText}>Response rate {responseRate}%</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 16, backgroundColor: '#fff', borderRadius: 16, marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1a5c4b', alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#fff', fontSize: 20, fontWeight: '700' },
  meta: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: '#1a1a1a' },
  sub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  badgeText: { fontSize: 12, color: '#1a5c4b', fontWeight: '500' },
});
