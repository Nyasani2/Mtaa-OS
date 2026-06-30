import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  route: string;
  color: string;
  category: 'os' | 'commerce' | 'transport' | 'work' | 'social' | 'civic' | 'finance' | 'tools';
  devOnly?: boolean;
}

const apps: AppItem[] = [
  // OS Core
  { id: 'wallet', name: 'Wallet', description: 'Manage your MTAA balance, top up, withdraw, and transfer funds.', icon: 'cash-outline', route: '/(os)/wallet', color: '#10B981', category: 'os' },
  { id: 'health', name: 'Health', description: 'Access health records, book appointments, and find providers.', icon: 'medical-outline', route: '/(os)/health', color: '#EF4444', category: 'os' },
  { id: 'education', name: 'Education', description: 'School management, classes, assignments, and grades.', icon: 'school-outline', route: '/(education)', color: '#8B5CF6', category: 'os' },
  { id: 'settings', name: 'Settings', description: 'App preferences, security, and account settings.', icon: 'settings-outline', route: '/(os)/settings', color: '#6B7280', category: 'os' },
  { id: 'phone', name: 'Phone', description: 'Calls, contacts, and messaging.', icon: 'call-outline', route: '/(os)/phone', color: '#3B82F6', category: 'os' },
  { id: 'profile', name: 'Profile', description: 'Your profile, achievements, and analytics.', icon: 'person-outline', route: '/(os)/profile', color: '#F59E0B', category: 'os' },

  // Social
  { id: 'streets', name: 'Streets', description: 'Share posts, photos, videos, and articles with your community.', icon: 'newspaper-outline', route: '/(os)/streets', color: '#3B82F6', category: 'social' },
  { id: 'tribes', name: 'Tribes', description: 'Join and manage community groups.', icon: 'people-outline', route: '/(os)/tribes', color: '#14B8A6', category: 'social' },
  { id: 'messages', name: 'Messages', description: 'Chat with friends and groups.', icon: 'chatbubble-outline', route: '/(communication)/messages', color: '#06B6D4', category: 'social' },
  { id: 'gallery', name: 'Gallery', description: 'Photos and videos.', icon: 'images-outline', route: '/(media)/gallery', color: '#EC4899', category: 'social' },
  { id: 'camera', name: 'Camera', description: 'Take photos and videos.', icon: 'camera-outline', route: '/(media)/camera', color: '#6366F1', category: 'social' },

  // Commerce
  { id: 'marketplace', name: 'Marketplace', description: 'Buy and sell products in your local community.', icon: 'cart-outline', route: '/(commerce)/marketplace', color: '#F59E0B', category: 'commerce' },
  { id: 'shop', name: 'Shop', description: 'Manage your store, inventory, and sales.', icon: 'storefront-outline', route: '/(commerce)/shop', color: '#EC4899', category: 'commerce' },
  { id: 'restaurant', name: 'Restaurant', description: 'POS, inventory, staff, and analytics for restaurants.', icon: 'restaurant-outline', route: '/(os)/restaurant', color: '#F97316', category: 'commerce' },
  { id: 'property', name: 'Property', description: 'List, book, and manage properties.', icon: 'home-outline', route: '/(os)/property', color: '#84CC16', category: 'commerce' },

  // Transport
  { id: 'mtaxi', name: 'MTaxi', description: 'Book rides and manage transportation.', icon: 'car-outline', route: '/(mtaxi)', color: '#06B6D4', category: 'transport' },
  { id: 'mtruck', name: 'MTruck', description: 'Logistics and freight management.', icon: 'bus-outline', route: '/(mtruck)', color: '#84CC16', category: 'transport' },
  { id: 'boda', name: 'Boda', description: 'Motorcycle taxi booking.', icon: 'bicycle-outline', route: '/(boda)', color: '#8B5CF6', category: 'transport' },

  // Work
  { id: 'jobs', name: 'Jobs', description: 'Find and post job opportunities.', icon: 'briefcase-outline', route: '/(work)/jobs', color: '#6366F1', category: 'work' },
  { id: 'studio', name: 'Studio', description: 'Creator tools, live streaming, and monetization.', icon: 'videocam-outline', route: '/(os)/studio', color: '#EF4444', category: 'work' },

  // Civic
  { id: 'civic', name: 'Civic', description: 'Government services: police, courts, revenue, and more.', icon: 'shield-outline', route: '/(civic)', color: '#1E3A5F', category: 'civic' },

  // Finance
  { id: 'binance', name: 'Binance', description: 'Crypto trading and wallet.', icon: 'trending-up-outline', route: '/(finance)/binance', color: '#F0B90B', category: 'finance' },
  { id: 'credit', name: 'Credit', description: 'Loans and credit services.', icon: 'card-outline', route: '/(finance)/credit', color: '#10B981', category: 'finance' },

  // Tools
  { id: 'calculator', name: 'Calculator', description: 'Basic calculator.', icon: 'calculator-outline', route: '/(os)/calculator', color: '#6B7280', category: 'tools' },
  { id: 'calendar', name: 'Calendar', description: 'Events and scheduling.', icon: 'calendar-outline', route: '/(os)/calendar', color: '#3B82F6', category: 'tools' },
  { id: 'clock', name: 'Clock', description: 'Alarm, timer, and stopwatch.', icon: 'time-outline', route: '/(os)/clock', color: '#F59E0B', category: 'tools' },
  { id: 'reader', name: 'Reader', description: 'Read documents and books.', icon: 'book-outline', route: '/(os)/reader', color: '#8B5CF6', category: 'tools' },

  // Developer (dev only)
  { id: 'developer', name: 'Developer', description: 'Submit apps, view earnings, manage ASIS submissions.', icon: 'code-outline', route: '/(os)/developer', color: '#6366F1', category: 'tools', devOnly: true },
];

export default function AppStoreScreen() {
  const router = useRouter();
  const { user, profile } = useAuthStore();
  const isDeveloper = profile?.is_developer || user?.user_metadata?.is_developer || false;

  const handleOpenApp = (route: string) => {
    router.push(route);
  };

  const categories = ['os', 'commerce', 'transport', 'work', 'social', 'civic', 'finance', 'tools'] as const;
  const categoryNames: Record<string, string> = {
    os: 'OS Core', commerce: 'Commerce', transport: 'Transport',
    work: 'Work', social: 'Social', civic: 'Civic', finance: 'Finance', tools: 'Tools'
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AppStore</Text>
        <Text style={styles.headerSub}>Discover MTAA apps</Text>
      </View>

      <ScrollView style={styles.content}>
        {categories.map((cat) => {
          const catApps = apps.filter(a => a.category === cat && (!a.devOnly || isDeveloper));
          if (catApps.length === 0) return null;

          return (
            <View key={cat} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{categoryNames[cat]}</Text>
              {catApps.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.appCard}
                  onPress={() => handleOpenApp(item.route)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon as any} size={24} color={item.color} />
                  </View>
                  <View style={styles.appInfo}>
                    <Text style={styles.appName}>{item.name}</Text>
                    <Text style={styles.appDesc}>{item.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  content: { padding: 16 },
  categorySection: { marginBottom: 24 },
  categoryTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  appCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8 },
  iconContainer: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  appInfo: { flex: 1 },
  appName: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  appDesc: { fontSize: 13, color: '#64748b', marginTop: 2 },
});
