// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl, ImageBackground, Platform, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const MTAA_HOME_BG = require('@/assets/images/mtaa_home.jpg');

import {
  ALL_APPS,
  PUBLIC_APPS,
  OWNER_APPS,
  AppTile,
  getAppsByCategory,
} from '@/lib/catalog/app-catalog';

const { width } = Dimensions.get('window');
const TILE_SIZE = (width - 48) / 4;

const CATEGORIES = [
  { id: 'all', name: 'All' },
  { id: 'os', name: 'OS' },
  { id: 'finance', name: 'Finance' },
  { id: 'health', name: 'Health' },
  { id: 'commerce', name: 'Commerce' },
  { id: 'transport', name: 'Transport' },
  { id: 'social', name: 'Social' },
  { id: 'media', name: 'Media' },
  { id: 'work', name: 'Work' },
  { id: 'edu', name: 'Education' },
  { id: 'admin', name: 'Admin' },
  { id: 'utility', name: 'Utility' },
];

const CATEGORY_EXPLAINERS: Record<string, { title: string; text: string; icon: string; image: string }> = {
  'all': { 
    title: "Africa's Connected Digital Operating System", 
    icon: 'globe',
    image: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=400&fit=crop',
    text: "MTAA OS unifies people, governments, hospitals, businesses, transport, education, and creators into one ecosystem. Every entity has an account. Every application works together. Built for Africa, by Africa." 
  },
  'os': { 
    title: "The Foundation of African Digital Sovereignty", 
    icon: 'hardware-chip',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&h=400&fit=crop',
    text: "Powered by the 22-engine ASIS Cognitive Kernel. On upcoming Kamo Phones, MTAA will be the sole, deeply integrated OS with hardware-level security, zero-latency AI, and offline-first architecture designed for African connectivity realities." 
  },
  'finance': { 
    title: "Financial Infrastructure for African Nations", 
    icon: 'wallet',
    image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=400&fit=crop',
    text: "MTAA Wallet collects taxes for every African country where transactions occur. Governments automatically receive accounts and real-time compliance dashboards. Quantum-encrypted wallets, decentralized credit, and country-specific tax rules built-in. Every transaction strengthens national revenue." 
  },
  'health': { 
    title: "Healthcare Infrastructure for Every Level", 
    icon: 'heart',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800&h=400&fit=crop',
    text: "Built for private hospitals with infinite scalable beds, county hospitals (Level 5), and national referral hospitals (Level 6). Patient data stays local - doctors must scan your phone to access records with your permission. Hosts pharmacies, chemists, and herbal medicine shops. Available in any country." 
  },
  'commerce': { 
    title: "Frictionless Trade Across Africa", 
    icon: 'cart',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
    text: "MTAA's KAMOS math ensures fair pricing algorithms. Kamo Phones support NFC tap-to-pay and mesh-network transactions without third-party apps. Shops, marketplace, inventory, restaurant POS, payroll - small businesses grow without disconnected systems." 
  },
  'transport': { 
    title: "Unified Mobility for People and Goods", 
    icon: 'car',
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=400&fit=crop',
    text: "Seamless Boda, MTaxi, and MTruck integration. Kamo Phones feature dedicated RTK hardware for centimeter-accurate fleet tracking and autonomous routing. Vehicle registration, garage inspections, and regulator access in one connected system." 
  },
  'social': { 
    title: "True Privacy for African Communities", 
    icon: 'shield-checkmark',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=400&fit=crop',
    text: "End-to-end encrypted Tribes and Streets. Kamo Phones have physical privacy shutters and hardware kill-switches for microphones and cameras. African stories, multilingual communities, creator monetization - your data never leaves your control." 
  },
  'media': { 
    title: "Creator Studio for African Voices", 
    icon: 'videocam',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=400&fit=crop',
    text: "Local-first rendering. Kamo Phones have dedicated NPUs for 8K video editing and ASIS-driven content generation directly on-device. Music, live streams, audience engagement - African creators build audiences and earn without platform exploitation." 
  },
  'work': { 
    title: "Enterprise Workspace for African Professionals", 
    icon: 'briefcase',
    image: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=400&fit=crop',
    text: "Desktop-mode via USB-C turns your Kamo Phone into a full MTAA workstation. Jobs, CVs, professional profiles, cognitive task routing. Skills connect to opportunities. Maximum productivity with African work culture built-in." 
  },
  'edu': { 
    title: "Adaptive Learning for African Students", 
    icon: 'school',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=400&fit=crop',
    text: "Powered by ASIS Understanding Engine. Kamo Phones feature e-ink secondary displays for distraction-free, eye-safe reading. Schools, libraries, portals, results - learning pathways connect skills to employers across Africa." 
  },
  'admin': { 
    title: "Command Center for African Governance", 
    icon: 'terminal',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop',
    text: "Full kernel audit, treasury oversight, and cognitive engine routing. Exclusive to Kamo Admin-tier hardware and verified MTAA operators. Public services, compliance, country-specific deployments - governments operate with transparency and efficiency." 
  },
  'utility': { 
    title: "Core Infrastructure Without Borders", 
    icon: 'wifi',
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&h=400&fit=crop',
    text: "Built-in mesh-networking allows Kamo Phones to communicate without cell towers or internet. Reader, Upload, WiFi management - essential services work offline, peer-to-peer, designed for African infrastructure challenges." 
  },
};

const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Morning';
  if (hour < 18) return 'Afternoon';
  return 'Evening';
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, getDisplayName, refreshProfile, profile } = useAuthStore();
  React.useEffect(() => {
    if (user && !profile) refreshProfile();
  }, [user, profile]);

  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const isOwner = (user as any)?.role === 'owner' || (user as any)?.role === 'admin';

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const navigateToApp = useCallback(
    (route: string) => {
      router.push(route as any);
    },
    [router]
  );

  const visibleApps = isOwner ? ALL_APPS : PUBLIC_APPS;
  const displayedApps = activeCategory && activeCategory !== 'all'
    ? getAppsByCategory(activeCategory.toUpperCase()).filter((a) =>
        isOwner ? true : !a.ownerOnly
      )
    : visibleApps;

  const currentExplainer = activeCategory && CATEGORY_EXPLAINERS[activeCategory] 
    ? CATEGORY_EXPLAINERS[activeCategory] 
    : CATEGORY_EXPLAINERS['all'];

  const renderIcon = (app: AppTile, size: number = 24) => {
    if (!app || !app.icon) return null;
    return <Ionicons name={app.icon as any} size={size} color={app.color || '#fff'} />;
  };

  const renderAppTile = (app: AppTile, index: number) => {
    if (!app || !app.id) return null;
    return (
      <Animated.View
        key={app.id}
        entering={FadeInUp.delay(index * 30).duration(400)}
        style={styles.tileContainer}
      >
        <TouchableOpacity
          style={styles.tileTouchable}
          onPress={() => navigateToApp(app.route)}
          activeOpacity={0.7}
        >
          <View style={[styles.tileIcon, { backgroundColor: app.bgColor || (app.color + '20') }]}>
            {renderIcon(app)}
            {app.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{app.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.tileLabel}>{app.name}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ImageBackground source={MTAA_HOME_BG} style={styles.backgroundImage}>
      <>
        {Platform.OS === 'web' ? (
          <View style={[styles.gradientOverlay, { backgroundColor: 'rgba(15,23,42,0.85)' }]} />
        ) : (
          <LinearGradient colors={['rgba(15,23,42,0.8)', 'rgba(15,23,42,0.95)']} style={styles.gradientOverlay} />
        )}
        <View style={styles.container}>
          <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
            {Platform.OS === 'web' ? (
              <View style={styles.blurHeader}>
                <View style={styles.headerContent}>
                  <View>
                    <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
                    <Text style={styles.userName}>{getDisplayName(user)}</Text>
                  </View>
                  <TouchableOpacity style={styles.settingsBtn} onPress={() => navigateToApp('/(os)/settings')}>
                    <Ionicons name="settings-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <BlurView intensity={40} tint="dark" style={styles.blurHeader}>
                <View style={styles.headerContent}>
                  <View>
                    <Text style={styles.greeting}>Good {getTimeOfDay()},</Text>
                    <Text style={styles.userName}>{getDisplayName(user)}</Text>
                  </View>
                  <TouchableOpacity style={styles.settingsBtn} onPress={() => navigateToApp('/(os)/settings')}>
                    <Ionicons name="settings-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </BlurView>
            )}
          </View>

          {CATEGORIES.length > 0 && (
            <View style={styles.categoryBar}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, activeCategory === cat.id && styles.categoryChipActive]}
                    onPress={() => setActiveCategory(cat.id === 'all' ? null : cat.id)}
                  >
                    <Text style={[styles.categoryChipText, activeCategory === cat.id && styles.categoryChipTextActive]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
            }
          >
            <View style={styles.grid}>
              {displayedApps.filter(app => app && app.id).map((app, index) => renderAppTile(app, index))}
            </View>

            {isOwner && OWNER_APPS.length > 0 && activeCategory === null && (
              <View style={styles.ownerSection}>
                <Text style={styles.ownerTitle}>Owner Tools</Text>
                <View style={styles.grid}>
                  {OWNER_APPS.filter(app => app && app.id).map((app, index) =>
                    renderAppTile(app, displayedApps.length + index)
                  )}
                </View>
              </View>
            )}

            <View style={styles.explainerCard}>
              {currentExplainer.image && (
                <View style={styles.explainerImageContainer}>
                  <Image 
                    source={{ uri: currentExplainer.image }} 
                    style={styles.explainerImage}
                    resizeMode="cover"
                  />
                  <View style={styles.explainerImageOverlay} />
                </View>
              )}
              <View style={styles.explainerHeader}>
                <View style={[styles.explainerIcon, { backgroundColor: '#3b82f620' }]}>
                  {currentExplainer && <Ionicons name={currentExplainer.icon as any} size={20} color="#3b82f6" />}
                </View>
                <Text style={styles.explainerTitle}>{currentExplainer.title}</Text>
              </View>
              <Text style={styles.explainerText}>{currentExplainer.text}</Text>
            </View>

            <View style={styles.footer} />
          </ScrollView>
        </View>
      </>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: { flex: 1, width: '100%', height: '100%' },
  gradientOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  container: { flex: 1 },
  header: { width: '100%', paddingHorizontal: 16, paddingTop: 8 },
  blurHeader: { borderRadius: 16, overflow: 'hidden', backgroundColor: 'rgba(30,41,59,0.6)' },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  greeting: { fontSize: 13, color: '#cbd5e1', fontWeight: '500' },
  userName: { fontSize: 20, color: '#fff', fontWeight: '700', marginTop: 2 },
  settingsBtn: { padding: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)' },
  categoryBar: { maxHeight: 52, marginTop: 12 },
  categoryScroll: { paddingHorizontal: 12, gap: 8, alignItems: 'center' },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(30,41,59,0.7)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', marginRight: 8 },
  categoryChipActive: { backgroundColor: 'rgba(59,130,246,0.2)', borderColor: '#3b82f6' },
  categoryChipText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  categoryChipTextActive: { color: '#3b82f6' },
  scrollContent: { paddingHorizontal: 12, paddingTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' },
  tileContainer: { width: TILE_SIZE, alignItems: 'center', marginBottom: 16 },
  tileTouchable: { alignItems: 'center' },
  tileIcon: { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6, position: 'relative', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  tileLabel: { color: '#fff', fontSize: 11, fontWeight: '600', textAlign: 'center', width: TILE_SIZE - 8, textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 },
  badge: { position: 'absolute', top: -4, right: -4, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#0f172a' },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  ownerSection: { marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' },
  ownerTitle: { color: '#fbbf24', fontSize: 16, fontWeight: '700', marginBottom: 12, paddingHorizontal: 4 },
  explainerCard: {
    marginTop: 16,
    marginBottom: 16,
    marginHorizontal: 12,
    padding: 0,
    borderRadius: 16,
    backgroundColor: 'rgba(30,41,59,0.95)',
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  explainerImageContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  explainerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  explainerImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(15,23,42,0.7)',
  },
  explainerContent: {
    padding: 16,
    paddingTop: 12,
  },
  explainerHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  explainerIcon: { 
    width: 36, 
    height: 36, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  explainerTitle: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700',
    flex: 1,
  },
  explainerText: { 
    color: '#94a3b8', 
    fontSize: 13, 
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  footer: { height: 40 },
});
