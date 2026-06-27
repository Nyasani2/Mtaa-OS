import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { railRegistry } from '@/lib/integrations/rails/railRegistry';

interface CommandModule {
  title: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  badge?: number;
}

const modules: CommandModule[] = [
  {
    title: 'Treasury',
    description: 'Central revenue, expenditures & cashflow',
    icon: 'wallet-outline',
    route: '/command-centre/treasury',
    color: '#00d4ff',
  },
  {
    title: 'Central Bank',
    description: 'African government treasury oversight',
    icon: 'business-outline',
    route: '/command-centre/treasury/central-bank',
    color: '#00cc66',
  },
  {
    title: 'Credit & Regulatory',
    description: 'Loan oversight, compliance & credit scores',
    icon: 'shield-checkmark-outline',
    route: '/command-centre/treasury/credit-regulatory',
    color: '#ffaa00',
  },
  {
    title: 'Revenue',
    description: 'Tax collection & revenue administration',
    icon: 'cash-outline',
    route: '/command-centre/revenue',
    color: '#8855ff',
  },
  {
    title: 'Connections',
    description: 'System connections & integrations',
    icon: 'git-network-outline',
    route: '/command-centre/connections',
    color: '#ff4444',
    badge: railRegistry.list().length,
  },
];

export default function CommandCentreIndex() {
  const router = useRouter();
  const rails = railRegistry.list();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MTAA Financial Command Centre</Text>
        <Text style={styles.headerSub}>Central Administration Hub</Text>
      </View>

      {/* Module Grid */}
      <View style={styles.grid}>
        {modules.map((mod, idx) => (
          <TouchableOpacity
            key={idx}
            style={styles.card}
            onPress={() => router.push(mod.route as any)}
          >
            <View style={[styles.iconBox, { backgroundColor: mod.color + '22' }]}>
              <Ionicons name={mod.icon as any} size={28} color={mod.color} />
              {mod.badge !== undefined && mod.badge > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{mod.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardTitle}>{mod.title}</Text>
            <Text style={styles.cardDesc}>{mod.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Active Rails Section */}
      <View style={styles.railsSection}>
        <Text style={styles.sectionTitle}>Active Rails</Text>
        {rails.length === 0 ? (
          <Text style={styles.empty}>No rails registered yet</Text>
        ) : (
          rails.map((r, i) => (
            <View key={i} style={styles.railCard}>
              <Ionicons name="link-outline" size={18} color="#00D26A" />
              <Text style={styles.railName}>{r}</Text>
              <View style={styles.railStatus}>
                <Text style={styles.railStatusText}>● Active</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 14, marginTop: 4 },
  grid: { padding: 16, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { 
    width: '48%', 
    backgroundColor: '#1a1a1a', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  iconBox: { 
    width: 56, 
    height: 56, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  badge: { 
    position: 'absolute', 
    top: -4, 
    right: -4, 
    backgroundColor: '#ff4444', 
    borderRadius: 10, 
    minWidth: 20, 
    height: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 4 },
  cardDesc: { color: '#888', fontSize: 12, lineHeight: 16 },
  railsSection: { padding: 16 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  empty: { color: '#666', textAlign: 'center', marginTop: 20 },
  railCard: {
    backgroundColor: '#1A1A1A',
    padding: 16,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  railName: { color: '#fff', fontSize: 15, fontWeight: '600', marginLeft: 12, flex: 1 },
  railStatus: { marginLeft: 'auto' },
  railStatusText: { color: '#00D26A', fontSize: 12 },
});
