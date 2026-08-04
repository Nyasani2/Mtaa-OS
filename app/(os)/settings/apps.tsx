import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface AppItem {
  id: string;
  name: string;
  icon: string;
  color: string;
  route: string;
  description: string;
}

const INSTALLED_APPS: AppItem[] = [
  { id: 'wallet', name: 'Wallet', icon: 'cash-outline', color: '#10B981', route: '/(os)/wallet', description: 'Manage balance, top up, withdraw' },
  { id: 'health', name: 'Health', icon: 'medical-outline', color: '#EF4444', route: '/(os)/health', description: 'Health records and appointments' },
  { id: 'education', name: 'Education', icon: 'school-outline', color: '#8B5CF6', route: '/(education)', description: 'School management and classes' },
  { id: 'streets', name: 'Streets', icon: 'newspaper-outline', color: '#3B82F6', route: '/(os)/streets', description: 'Share posts and discover content' },
  { id: 'tribes', name: 'Tribes', icon: 'people-outline', color: '#14B8A6', route: '/(os)/tribes', description: 'Community groups and events' },
  { id: 'messages', name: 'Messages', icon: 'chatbubble-outline', color: '#06B6D4', route: '/(communication)/messages', description: 'Chat and messaging' },
  { id: 'gallery', name: 'Gallery', icon: 'images-outline', color: '#EC4899', route: '/(media)/gallery', description: 'Photos and videos' },
  { id: 'camera', name: 'Camera', icon: 'camera-outline', color: '#6366F1', route: '/(media)/camera', description: 'Take photos and videos' },
  { id: 'marketplace', name: 'Marketplace', icon: 'cart-outline', color: '#F59E0B', route: '/(commerce)/marketplace', description: 'Buy and sell products' },
  { id: 'shop', name: 'Shop', icon: 'storefront-outline', color: '#EC4899', route: '/(commerce)/shop', description: 'Manage your store' },
  { id: 'restaurant', name: 'Restaurant', icon: 'restaurant-outline', color: '#F97316', route: '/(os)/restaurant', description: 'POS and restaurant management' },
  { id: 'stay', name: 'Stay', icon: 'bed-outline', color: '#84CC16', route: '/(os)/stay', description: 'Find and book accommodations' },
  { id: 'mtaxi', name: 'MTaxi', icon: 'car-outline', color: '#06B6D4', route: '/(mtaxi)', description: 'Book rides and manage transport' },
  { id: 'mtruck', name: 'MTruck', icon: 'bus-outline', color: '#84CC16', route: '/(mtruck)', description: 'Logistics and freight' },
  { id: 'jobs', name: 'Jobs', icon: 'briefcase-outline', color: '#6366F1', route: '/(work)/jobs', description: 'Find and post jobs' },
  { id: 'studio', name: 'Studio', icon: 'videocam-outline', color: '#EF4444', route: '/(os)/studio', description: 'Live streaming and creator tools' },
  { id: 'civic', name: 'Civic', icon: 'shield-outline', color: '#1E3A5F', route: '/(civic)', description: 'Government services' },
  { id: 'binance', name: 'Binance', icon: 'trending-up-outline', color: '#F0B90B', route: '/(finance)/binance', description: 'Crypto trading' },
  { id: 'credit', name: 'Credit', icon: 'card-outline', color: '#10B981', route: '/(finance)/credit', description: 'Loans and credit' },
  { id: 'calculator', name: 'Calculator', icon: 'calculator-outline', color: '#6B7280', route: '/(os)/calculator', description: 'Calculator' },
  { id: 'calendar', name: 'Calendar', icon: 'calendar-outline', color: '#3B82F6', route: '/(os)/calendar', description: 'Events and scheduling' },
  { id: 'clock', name: 'Clock', icon: 'time-outline', color: '#F59E0B', route: '/(os)/clock', description: 'Alarm and timer' },
  { id: 'reader', name: 'Reader', icon: 'book-outline', color: '#8B5CF6', route: '/(os)/reader', description: 'Read documents and books' },
  { id: 'developer', name: 'Developer', icon: 'code-outline', color: '#6366F1', route: '/(os)/developer', description: 'App submission and ASIS' },
];

export default function SettingsAppsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const handleAppPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Apps</Text>
        <Text style={styles.subtitle}>Manage your installed applications</Text>
      </View>

      <View style={styles.grid}>
        {INSTALLED_APPS.map((app) => (
          <TouchableOpacity
            key={app.id}
            style={styles.appCard}
            onPress={() => handleAppPress(app.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: app.color + '15' }]}>
              <Ionicons name={app.icon as any} size={28} color={app.color} />
            </View>
            <Text style={styles.appName}>{app.name}</Text>
            <Text style={styles.appDescription} numberOfLines={2}>{app.description}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {INSTALLED_APPS.length} apps installed
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  appCard: {
    width: '30%',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 10,
    marginHorizontal: '1.5%',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  appDescription: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
});
