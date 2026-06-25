import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const { width } = Dimensions.get('window');
const ICON_SIZE = 52;
const GRID_GAP = 14;
const COLS = 4;
const TILE_WIDTH = (width - 40 - (COLS - 1) * GRID_GAP) / COLS;

interface AppTile {
  name: string;
  icon: string;
  iconSet: 'Ionicons' | 'MaterialCommunityIcons';
  route: string;
  color: string;
  bgColor: string;
}

// ALL APPS — alphabetically sorted within sections
const ALL_APPS: AppTile[] = [
  // Owner Only (hidden from regular users)
  { name: 'Audit', icon: 'shield-checkmark', iconSet: 'Ionicons', route: '/kernel-audit', color: '#fff', bgColor: '#dc2626' },
  { name: 'Command', icon: 'command', iconSet: 'MaterialCommunityIcons', route: '/command/asis-simulator', color: '#fff', bgColor: '#8b5cf6' },
  { name: 'Dev', icon: 'code-slash', iconSet: 'Ionicons', route: '/developer', color: '#fff', bgColor: '#334155' },
  { name: 'Regulatory', icon: 'document-text', iconSet: 'Ionicons', route: '/regulatory', color: '#fff', bgColor: '#7c3aed' },
  { name: 'Treasury', icon: 'vault', iconSet: 'MaterialCommunityIcons', route: '/(civic)/treasury', color: '#fff', bgColor: '#b45309' },

  // MTAA Apps
  { name: 'Ads', icon: 'megaphone', iconSet: 'Ionicons', route: '/(business)/ads', color: '#fff', bgColor: '#f97316' },
  { name: 'Boda', icon: 'bicycle', iconSet: 'Ionicons', route: '/(boda)', color: '#fff', bgColor: '#22c55e' },
  { name: 'Central Bank', icon: 'bank', iconSet: 'MaterialCommunityIcons', route: '/(finance)/credit', color: '#fff', bgColor: '#1e40af' },
  { name: 'Civic', icon: 'shield-check', iconSet: 'MaterialCommunityIcons', route: '/(civic)', color: '#fff', bgColor: '#3b82f6' },
  { name: 'Edu', icon: 'school', iconSet: 'Ionicons', route: '/(education)', color: '#fff', bgColor: '#14b8a6' },
  { name: 'Health', icon: 'medical', iconSet: 'Ionicons', route: '/health', color: '#fff', bgColor: '#06b6d4' },
  { name: 'Hookup', icon: 'heart', iconSet: 'Ionicons', route: '/(social)/hookup', color: '#fff', bgColor: '#f43f5e' },
  { name: 'Jobs', icon: 'briefcase', iconSet: 'Ionicons', route: '/(work)/jobs', color: '#fff', bgColor: '#f59e0b' },
  { name: 'Market', icon: 'cart', iconSet: 'Ionicons', route: '/(commerce)/marketplace', color: '#fff', bgColor: '#84cc16' },
  { name: 'MTruck', icon: 'truck-delivery', iconSet: 'MaterialCommunityIcons', route: '/(mtruck)', color: '#fff', bgColor: '#a855f7' },
  { name: 'MTaxi', icon: 'car', iconSet: 'Ionicons', route: '/(boda)', color: '#fff', bgColor: '#10b981' },
  { name: 'Shop', icon: 'storefront', iconSet: 'Ionicons', route: '/(commerce)/shop', color: '#fff', bgColor: '#ec4899' },
  { name: 'Streets', icon: 'videocam', iconSet: 'Ionicons', route: '/streets', color: '#fff', bgColor: '#ef4444' },
  { name: 'Studio', icon: 'film', iconSet: 'Ionicons', route: '/studio', color: '#fff', bgColor: '#6366f1' },
  { name: 'Tribes', icon: 'people', iconSet: 'Ionicons', route: '/(social)/tribes', color: '#fff', bgColor: '#d946ef' },
  { name: 'Wallet', icon: 'wallet', iconSet: 'Ionicons', route: '/wallet', color: '#fff', bgColor: '#f97316' },

  // System Apps
  { name: 'ASIS', icon: 'hardware-chip', iconSet: 'Ionicons', route: '/asis', color: '#fff', bgColor: '#0ea5e9' },
  { name: 'Calendar', icon: 'calendar', iconSet: 'Ionicons', route: '/calendar', color: '#fff', bgColor: '#f59e0b' },
  { name: 'Network', icon: 'wifi', iconSet: 'Ionicons', route: '/network', color: '#fff', bgColor: '#3b82f6' },
  { name: 'Property', icon: 'home', iconSet: 'Ionicons', route: '/property', color: '#fff', bgColor: '#f59e0b' },
  { name: 'Reader', icon: 'book', iconSet: 'Ionicons', route: '/reader', color: '#fff', bgColor: '#059669' },
  { name: 'Restaurant', icon: 'restaurant', iconSet: 'Ionicons', route: '/restaurant', color: '#fff', bgColor: '#ef4444' },
  { name: 'Revenue', icon: 'cash', iconSet: 'Ionicons', route: '/(civic)/revenue', color: '#fff', bgColor: '#059669' },
  { name: 'Upload', icon: 'cloud-upload', iconSet: 'Ionicons', route: '/upload', color: '#fff', bgColor: '#0891b2' },

  // Android / Utility Apps
  { name: 'Binance', icon: 'logo-bitcoin', iconSet: 'Ionicons', route: '/(finance)/binance', color: '#fff', bgColor: '#f59e0b' },
  { name: 'Calculator', icon: 'calculator', iconSet: 'Ionicons', route: '/calculator', color: '#fff', bgColor: '#6366f1' },
  { name: 'Clock', icon: 'time', iconSet: 'Ionicons', route: '/clock', color: '#fff', bgColor: '#f97316' },
  { name: 'Contacts', icon: 'people', iconSet: 'Ionicons', route: '/phone/contacts', color: '#fff', bgColor: '#3b82f6' },
  { name: 'Credit', icon: 'card', iconSet: 'Ionicons', route: '/(finance)/credit', color: '#fff', bgColor: '#10b981' },
  { name: 'Documents', icon: 'document', iconSet: 'Ionicons', route: '/(productivity)/documents', color: '#fff', bgColor: '#f59e0b' },
  { name: 'Gallery', icon: 'images', iconSet: 'Ionicons', route: '/(media)/gallery', color: '#fff', bgColor: '#ec4899' },
  { name: 'Messages', icon: 'chatbubble', iconSet: 'Ionicons', route: '/(communication)/messages', color: '#fff', bgColor: '#3b82f6' },
  { name: 'Phone', icon: 'call', iconSet: 'Ionicons', route: '/phone', color: '#fff', bgColor: '#22c55e' },
  { name: 'Recents', icon: 'time', iconSet: 'Ionicons', route: '/(system)/recents', color: '#fff', bgColor: '#6b7280' },
  { name: 'Scheduler', icon: 'calendar', iconSet: 'Ionicons', route: '/(productivity)/scheduler', color: '#fff', bgColor: '#14b8a6' },
  { name: 'Settings', icon: 'settings', iconSet: 'Ionicons', route: '/settings', color: '#fff', bgColor: '#6b7280' },
  { name: 'SIM', icon: 'sim', iconSet: 'Ionicons', route: '/(utility)/sim', color: '#fff', bgColor: '#f97316' },
  { name: 'Weather', icon: 'cloud', iconSet: 'Ionicons', route: '/(utility)/weather', color: '#fff', bgColor: '#06b6d4' },
  { name: 'World Time', icon: 'globe', iconSet: 'Ionicons', route: '/(utility)/time', color: '#fff', bgColor: '#8b5cf6' },
];

// Sort alphabetically
ALL_APPS.sort((a, b) => a.name.localeCompare(b.name));

const OWNER_APP_NAMES = ['Audit', 'Command', 'Dev', 'Regulatory', 'Treasury'];

function AppIcon({ app }: { app: AppTile }) {
  const IconComponent = app.iconSet === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.iconContainer, { backgroundColor: app.bgColor }]}>
      <IconComponent name={app.icon as any} size={24} color={app.color} />
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [greeting, setGreeting] = useState('Good evening');
  const [currentDate, setCurrentDate] = useState('');

  // Replace with your actual email
  const isOwner = user?.email === 'your-email@example.com';

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    setCurrentDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
  }, []);

  const launchApp = (route: string) => {
    try { router.push(route as any); } catch (e) { router.push('/coming-soon'); }
  };

  // Filter apps based on ownership
  const visibleApps = isOwner 
    ? ALL_APPS 
    : ALL_APPS.filter(app => !OWNER_APP_NAMES.includes(app.name));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={require('@/assets/images/mtaa_home.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Light overlay for text readability — NOT dark/blurred */}
        <View style={styles.overlay} />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.username}>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => router.push('/notifications')}>
                <Ionicons name="notifications" size={26} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/profile')}>
                <Ionicons name="person-circle" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Date */}
          <View style={styles.dateSection}>
            <Text style={styles.dayNumber}>{new Date().getDate()}</Text>
            <Text style={styles.monthYear}>{currentDate}</Text>
          </View>

          {/* Alphabetical App Grid */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {isOwner ? 'All Apps' : 'Apps'}
              </Text>
              <TouchableOpacity onPress={() => router.push('/appstore')}>
                <Text style={styles.appStoreLink}>App Store ›</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {visibleApps.map(app => (
                <TouchableOpacity
                  key={app.name}
                  style={styles.tile}
                  onPress={() => launchApp(app.route)}
                  activeOpacity={0.7}
                >
                  <AppIcon app={app} />
                  <Text style={styles.tileLabel}>{app.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Spacer for dock */}
          <View style={{ height: 80 }} />
        </ScrollView>

        {/* Smart Dock */}
        <View style={styles.dock}>
          <TouchableOpacity style={styles.dockItem} onPress={() => launchApp('/phone')}>
            <View style={[styles.dockIcon, { backgroundColor: '#22c55e' }]}>
              <Ionicons name="call" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dockItem} onPress={() => launchApp('/(communication)/messages')}>
            <View style={[styles.dockIcon, { backgroundColor: '#3b82f6' }]}>
              <Ionicons name="chatbubble" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dockItem} onPress={() => launchApp('/wallet')}>
            <View style={[styles.dockIcon, { backgroundColor: '#f97316' }]}>
              <Ionicons name="wallet" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dockItem} onPress={() => launchApp('/profile')}>
            <View style={[styles.dockIcon, { backgroundColor: '#8b5cf6' }]}>
              <Ionicons name="person" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dockItem} onPress={() => launchApp('/search')}>
            <View style={[styles.dockIcon, { backgroundColor: '#6b7280' }]}>
              <Ionicons name="search" size={22} color="#fff" />
            </View>
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: '100%', height: '100%' },
  // Very light overlay so warrior is FULLY VISIBLE
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)', // Was 0.4 — now warrior is CLEAR
  },
  scroll: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 13, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  username: { color: '#fff', fontSize: 17, fontWeight: '700', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  dateSection: { alignItems: 'center', marginBottom: 20 },
  dayNumber: { color: '#fff', fontSize: 56, fontWeight: '200', lineHeight: 62, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 },
  monthYear: { color: 'rgba(255,255,255,0.9)', fontSize: 13, marginTop: 2, textShadowColor: 'rgba(0,0,0,0.4)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 15, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  appStoreLink: { color: '#0ea5e9', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  tile: { width: TILE_WIDTH, alignItems: 'center', marginBottom: 8 },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  tileLabel: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    fontWeight: '500',
  },
  dock: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backdropFilter: 'blur(10px)',
  },
  dockItem: { alignItems: 'center' },
  dockIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
