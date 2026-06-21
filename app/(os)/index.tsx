import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth/useAuth';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();
  const { isAuthenticated, displayName, initialize } = useAuth();
  const [greeting, setGreeting] = useState('Good evening');

  useEffect(() => {
    initialize();
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const systemApps = [
    { name: 'Clock', icon: 'time', route: '/clock', color: '#6366f1' },
    { name: 'Calc', icon: 'calculator', route: '/calc', color: '#8b5cf6' },
    { name: 'Calendar', icon: 'calendar', route: '/calendar', color: '#ec4899' },
    { name: 'Network', icon: 'wifi', route: '/network', color: '#10b981' },
    { name: 'Wi-Fi', icon: 'wifi-outline', route: '/wifi', color: '#06b6d4' },
    { name: 'Reader', icon: 'book', route: '/reader', color: '#f59e0b' },
    { name: 'Settings', icon: 'settings', route: '/settings', color: '#6b7280' },
    { name: 'ASIS', icon: 'sparkles', route: '/asis', color: '#f97316' },
    { name: 'Profile', icon: 'person', route: '/profile', color: '#3b82f6' },
  ];

  const coreApps = [
    { name: 'Wallet', icon: 'wallet', route: '/wallet', color: '#10b981', badge: 'NEW' },
    { name: 'Messages', icon: 'chatbubble', route: '/messages', color: '#6366f1' },
    { name: 'Phone', icon: 'call', route: '/phone', color: '#22c55e' },
    { name: 'Gallery', icon: 'images', route: '/gallery', color: '#ec4899' },
    { name: 'Camera', icon: 'camera', route: '/camera', color: '#6b7280' },
    { name: 'AppStore', icon: 'apps', route: '/appstore', color: '#8b5cf6' },
    { name: 'Command', icon: 'terminal', route: '/command', color: '#f59e0b' },
  ];

  const apps = [
    { name: 'MTaxi', icon: 'car', route: '/mtaxi', color: '#f59e0b' },
    { name: 'MTruck', icon: 'truck', route: '/mtruck', color: '#f97316' },
    { name: 'Boda', icon: 'bicycle', route: '/boda', color: '#ef4444' },
    { name: 'Tribes', icon: 'people', route: '/tribes', color: '#8b5cf6' },
    { name: 'Shop', icon: 'cart', route: '/shop', color: '#ec4899' },
    { name: 'Jobs', icon: 'briefcase', route: '/jobs', color: '#3b82f6' },
    { name: 'Wallet', icon: 'wallet', route: '/wallet', color: '#10b981' },
    { name: 'Streets', icon: 'map', route: '/streets', color: '#06b6d4' },
  ];

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800' }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting},</Text>
            <Text style={styles.name}>{isAuthenticated ? displayName : 'Guest'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.avatarBtn}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {isAuthenticated ? displayName?.charAt(0)?.toUpperCase() || 'U' : 'G'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Wallet Card */}
        <TouchableOpacity style={styles.walletCard} onPress={() => router.push('/wallet')}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletLabel}>WALLET BALANCE</Text>
            <Ionicons name="eye-off" size={18} color="#fff" />
          </View>
          <Text style={styles.walletAmount}>KSh ******</Text>
          <View style={styles.walletActions}>
            <WalletAction icon="scan" label="Scan" />
            <WalletAction icon="send" label="Send" />
            <WalletAction icon="download" label="Deposit" />
            <WalletAction icon="upload" label="Withdraw" />
          </View>
        </TouchableOpacity>

        {/* System Apps */}
        <Text style={styles.sectionTitle}>SYSTEM</Text>
        <View style={styles.grid}>
          {systemApps.map((app) => (
            <AppIcon key={app.name} app={app} router={router} />
          ))}
        </View>

        {/* Core Apps */}
        <Text style={styles.sectionTitle}>CORE</Text>
        <View style={styles.grid}>
          {coreApps.map((app) => (
            <AppIcon key={app.name} app={app} router={router} />
          ))}
        </View>

        {/* Apps */}
        <Text style={styles.sectionTitle}>APPS</Text>
        <View style={styles.grid}>
          {apps.map((app) => (
            <AppIcon key={app.name} app={app} router={router} />
          ))}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function WalletAction({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.walletAction}>
      <View style={styles.walletActionIcon}>
        <Ionicons name={icon as any} size={20} color="#fff" />
      </View>
      <Text style={styles.walletActionLabel}>{label}</Text>
    </View>
  );
}

function AppIcon({ app, router }: { app: any; router: any }) {
  return (
    <TouchableOpacity style={styles.appIcon} onPress={() => router.push(app.route)}>
      <View style={[styles.appIconCircle, { backgroundColor: app.color + '20' }]}>
        <Ionicons name={app.icon as any} size={24} color={app.color} />
        {app.badge && (
          <View style={[styles.badge, { backgroundColor: app.color }]}>
            <Text style={styles.badgeText}>{app.badge}</Text>
          </View>
        )}
      </View>
      <Text style={styles.appIconLabel}>{app.name}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: '#9ca3af' },
  name: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  walletCard: { backgroundColor: 'rgba(30,30,40,0.9)', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  walletHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  walletLabel: { fontSize: 12, color: '#9ca3af', letterSpacing: 1 },
  walletAmount: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  walletActions: { flexDirection: 'row', justifyContent: 'space-around' },
  walletAction: { alignItems: 'center' },
  walletActionIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  walletActionLabel: { fontSize: 12, color: '#9ca3af' },
  sectionTitle: { fontSize: 12, color: '#6b7280', letterSpacing: 2, marginBottom: 12, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 },
  appIcon: { width: '25%', alignItems: 'center', marginBottom: 16 },
  appIconCircle: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  appIconLabel: { fontSize: 11, color: '#d1d5db', textAlign: 'center' },
  badge: { position: 'absolute', top: -4, right: -4, borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontSize: 8, color: '#fff', fontWeight: 'bold' },
});
