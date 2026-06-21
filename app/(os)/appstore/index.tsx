import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const apps = [
  { id: 'wallet', name: 'Wallet', description: 'Manage your MTAA balance, top up, withdraw, and transfer funds.', icon: '💰', route: '/(os)/wallet', color: '#10B981' },
  { id: 'streets', name: 'Streets', description: 'Share posts, photos, videos, and articles with your community.', icon: '📰', route: '/streets', color: '#3B82F6' },
  { id: 'health', name: 'Health', description: 'Access health records, book appointments, and find providers.', icon: '🏥', route: '/(os)/health', color: '#EF4444' },
  { id: 'education', name: 'Education', description: 'School management, classes, assignments, and grades.', icon: '🎓', route: '/(os)/education', color: '#8B5CF6' },
  { id: 'marketplace', name: 'Marketplace', description: 'Buy and sell products in your local community.', icon: '🛒', route: '/(marketplace)', color: '#F59E0B' },
  { id: 'mtaxi', name: 'MTaxi', description: 'Book rides and manage transportation.', icon: '🚕', route: '/(os)/mtaxi', color: '#06B6D4' },
  { id: 'mtruck', name: 'MTruck', description: 'Logistics and freight management.', icon: '🚛', route: '/(os)/mtruck', color: '#84CC16' },
  { id: 'shop', name: 'Shop', description: 'Manage your store, inventory, and sales.', icon: '🏪', route: '/(commerce)/shop', color: '#EC4899' },
  { id: 'jobs', name: 'Jobs', description: 'Find and post job opportunities.', icon: '💼', route: '/(os)/jobs', color: '#6366F1' },
  { id: 'tribes', name: 'Tribes', description: 'Join and manage community groups.', icon: '👥', route: '/(os)/tribes', color: '#14B8A6' },
  { id: 'settings', name: 'Settings', description: 'App preferences, security, and account settings.', icon: '⚙️', route: '/(os)/settings', color: '#6B7280' },
];

export default function AppStoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleOpenApp = (route: string) => {
    // @ts-ignore
    router.push(route);
  };

  const renderAppItem = ({ item }: { item: typeof apps[0] }) => (
    <TouchableOpacity
      style={[styles.appCard, { borderLeftColor: item.color }]}
      onPress={() => handleOpenApp(item.route)}
      activeOpacity={0.7}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
        <Text style={styles.iconText}>{item.icon}</Text>
      </View>
      <View style={styles.appInfo}>
        <Text style={styles.appName}>{item.name}</Text>
        <Text style={styles.appDescription} numberOfLines={2}>{item.description}</Text>
      </View>
      <View style={styles.openButton}>
        <Text style={styles.openButtonText}>Open</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App Store</Text>
        <Text style={styles.headerSubtitle}>Discover MTAA apps</Text>
      </View>
      <FlatList
        data={apps}
        keyExtractor={(item) => item.id}
        renderItem={renderAppItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  listContent: { padding: 16, gap: 12 },
  appCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderLeftWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  iconText: { fontSize: 24 },
  appInfo: { flex: 1 },
  appName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  appDescription: { fontSize: 13, color: '#6B7280', marginTop: 2, lineHeight: 18 },
  openButton: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  openButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});
