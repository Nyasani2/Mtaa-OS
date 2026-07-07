import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useHomeStore } from '@/lib/home/store/home.store';
import SmartDock from '@/lib/home/components/SmartDock';
import { WallpaperPicker } from '@/lib/home/components/WallpaperPicker';
import LongPressMenu from '@/lib/home/components/LongPressMenu';

const { width } = Dimensions.get('window');
const ICON_SIZE = 52;
const GRID_GAP = 14;
const COLS = 4;
const TILE_WIDTH = (width - 40 - (COLS - 1) * GRID_GAP) / COLS;

interface AppTile {
  id: string;
  name: string;
  icon: string;
  iconSet: 'Ionicons' | 'MaterialCommunityIcons';
  route: string;
  color: string;
  bgColor: string;
  ownerOnly: boolean;
}

// ─── APPS TO HIDE FROM HOME (Civic paused, nested sub-apps) ───
const HIDDEN_APP_IDS = new Set([
  // Civic apps — PAUSED until launch
  'civic', 'courts', 'prisons', 'police', 'immigration', 'land', 'transport',
  // Health sub-apps — nested inside Health OS
  'ambulance', 'doctor', 'find-care', 'hospital', 'lab', 'nurse', 'pharmacy',
  'radiology', 'telemedicine', 'emergency', 'records', 'insurance', 'dispatch',
  // Wallet sub-apps — nested inside Wallet
  'savings', 'topup', 'transfer', 'withdraw', 'scan', 'gofund', 'onboarding',
  // Other nested apps
  'portfolio', 'qr', 'documents',
  // Admin-only (already filtered by ownerOnly, but belt-and-suspenders)
  'central-bank', 'command-centre', 'regulatory', 'revenue', 'developer',
]);

// ─── ALL APPS — Complete Catalog (~60+ apps) — ALPHABETICAL ───

const ALL_APPS: AppTile[] = [
  { id: 'ads', name: 'Ads', icon: 'megaphone', iconSet: 'Ionicons', route: '/(business)/ads', color: '#fff', bgColor: '#f97316', ownerOnly: false },
  { id: 'ambulance', name: 'Ambulance', icon: 'medical', iconSet: 'Ionicons', route: '/(os)/health/ambulance', color: '#fff', bgColor: '#ef4444', ownerOnly: false },
  { id: 'appstore', name: 'App Store', icon: 'apps', iconSet: 'Ionicons', route: '/(os)/appstore', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false },
  { id: 'asis', name: 'ASIS', icon: 'hardware-chip', iconSet: 'Ionicons', route: '/(os)/asis', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false },
  { id: 'binance', name: 'Binance', icon: 'logo-bitcoin', iconSet: 'Ionicons', route: '/(finance)/binance', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'boda', name: 'Boda', icon: 'bicycle', iconSet: 'Ionicons', route: '/(boda)', color: '#fff', bgColor: '#22c55e', ownerOnly: false },
  { id: 'calculator', name: 'Calculator', icon: 'calculator', iconSet: 'Ionicons', route: '/(os)/calculator', color: '#fff', bgColor: '#6366f1', ownerOnly: false },
  { id: 'calendar', name: 'Calendar', icon: 'calendar', iconSet: 'Ionicons', route: '/(os)/calendar', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'camera', name: 'Camera', icon: 'camera', iconSet: 'Ionicons', route: '/(media)/camera', color: '#fff', bgColor: '#6b7280', ownerOnly: false },
  { id: 'central-bank', name: 'Central Bank', icon: 'bank', iconSet: 'MaterialCommunityIcons', route: '/(admin)/command-centre/treasury/central-bank', color: '#fff', bgColor: '#1e40af', ownerOnly: true },
  { id: 'civic', name: 'Civic', icon: 'shield-check', iconSet: 'MaterialCommunityIcons', route: '/(civic)', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'clock', name: 'Clock', icon: 'time', iconSet: 'Ionicons', route: '/(os)/clock', color: '#fff', bgColor: '#f97316', ownerOnly: false },
  { id: 'command-centre', name: 'Command Centre', icon: 'desktop-tower-monitor', iconSet: 'MaterialCommunityIcons', route: '/(admin)/command-centre', color: '#fff', bgColor: '#8b5cf6', ownerOnly: true },
  { id: 'contacts', name: 'Contacts', icon: 'people', iconSet: 'Ionicons', route: '/(os)/phone', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'courts', name: 'Courts', icon: 'scale', iconSet: 'MaterialCommunityIcons', route: '/(civic)/courts', color: '#fff', bgColor: '#7c3aed', ownerOnly: false },
  { id: 'credit', name: 'Credit', icon: 'card', iconSet: 'Ionicons', route: '/(finance)/credit', color: '#fff', bgColor: '#10b981', ownerOnly: false },
  { id: 'developer', name: 'Dev', icon: 'code-slash', iconSet: 'Ionicons', route: '/(os)/developer', color: '#fff', bgColor: '#334155', ownerOnly: true },
  { id: 'dispatch', name: 'Dispatch', icon: 'navigate', iconSet: 'Ionicons', route: '/(os)/health/ambulance/dispatch', color: '#fff', bgColor: '#dc2626', ownerOnly: false },
  { id: 'doctor', name: 'Doctor', icon: 'medkit', iconSet: 'Ionicons', route: '/(os)/health/doctor', color: '#fff', bgColor: '#06b6d4', ownerOnly: false },
  { id: 'documents', name: 'Documents', icon: 'document', iconSet: 'Ionicons', route: '/(os)/profile/documents', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'edu', name: 'Edu', icon: 'school', iconSet: 'Ionicons', route: '/(education)', color: '#fff', bgColor: '#14b8a6', ownerOnly: false },
  { id: 'emergency', name: 'Emergency', icon: 'warning', iconSet: 'Ionicons', route: '/(os)/health/emergency', color: '#fff', bgColor: '#dc2626', ownerOnly: false },
  { id: 'find-care', name: 'Find Care', icon: 'search', iconSet: 'Ionicons', route: '/(os)/health/find-care', color: '#fff', bgColor: '#0891b2', ownerOnly: false },
  { id: 'gallery', name: 'Gallery', icon: 'images', iconSet: 'Ionicons', route: '/(media)/gallery', color: '#fff', bgColor: '#ec4899', ownerOnly: false },
  { id: 'garage', name: 'Garage', icon: 'car-wrench', iconSet: 'MaterialCommunityIcons', route: '/(garage)', color: '#fff', bgColor: '#6b7280', ownerOnly: false },
  { id: 'gofund', name: 'GoFund', icon: 'heart-circle', iconSet: 'Ionicons', route: '/(os)/wallet/gofund', color: '#fff', bgColor: '#f43f5e', ownerOnly: false },
  { id: 'government', name: 'Government', icon: 'business', iconSet: 'Ionicons', route: '/(os)/health/government', color: '#fff', bgColor: '#1e40af', ownerOnly: false },
  { id: 'health', name: 'Health', icon: 'medical', iconSet: 'Ionicons', route: '/(os)/health', color: '#fff', bgColor: '#06b6d4', ownerOnly: false },
  { id: 'hookup', name: 'Hookup', icon: 'heart', iconSet: 'Ionicons', route: '/(social)/hookup', color: '#fff', bgColor: '#f43f5e', ownerOnly: false },
  { id: 'hospital', name: 'Hospital', icon: 'fitness', iconSet: 'Ionicons', route: '/(os)/health/hospital-admin', color: '#fff', bgColor: '#ef4444', ownerOnly: false },
  { id: 'immigration', name: 'Immigration', icon: 'airplane', iconSet: 'Ionicons', route: '/(civic)/immigration', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'insurance', name: 'Insurance', icon: 'shield', iconSet: 'Ionicons', route: '/(os)/health/insurance', color: '#fff', bgColor: '#059669', ownerOnly: false },
  { id: 'jobs', name: 'Jobs', icon: 'briefcase', iconSet: 'Ionicons', route: '/(work)/jobs', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'lab', name: 'Lab', icon: 'flask', iconSet: 'Ionicons', route: '/(os)/health/lab', color: '#fff', bgColor: '#a855f7', ownerOnly: false },
  { id: 'land', name: 'Land', icon: 'map', iconSet: 'Ionicons', route: '/(civic)/land', color: '#fff', bgColor: '#84cc16', ownerOnly: false },
  { id: 'marketplace', name: 'Market', icon: 'cart', iconSet: 'Ionicons', route: '/(commerce)/marketplace', color: '#fff', bgColor: '#84cc16', ownerOnly: false },
  { id: 'messages', name: 'Messages', icon: 'chatbubble', iconSet: 'Ionicons', route: '/(communication)/messages', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'mtaxi', name: 'MTaxi', icon: 'car', iconSet: 'Ionicons', route: '/(mtaxi)', color: '#fff', bgColor: '#10b981', ownerOnly: false },
  { id: 'mtruck', name: 'MTruck', icon: 'truck-delivery', iconSet: 'MaterialCommunityIcons', route: '/(mtruck)', color: '#fff', bgColor: '#a855f7', ownerOnly: false },
  { id: 'network', name: 'Network', icon: 'wifi', iconSet: 'Ionicons', route: '/(os)/network', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'nurse', name: 'Nurse', icon: 'pulse', iconSet: 'Ionicons', route: '/(os)/health/nurse', color: '#fff', bgColor: '#ec4899', ownerOnly: false },
  { id: 'onboarding', name: 'Onboarding', icon: 'person-add', iconSet: 'Ionicons', route: '/(os)/wallet/onboarding', color: '#fff', bgColor: '#6366f1', ownerOnly: false },
  { id: 'phone', name: 'Phone', icon: 'call', iconSet: 'Ionicons', route: '/(os)/phone', color: '#fff', bgColor: '#22c55e', ownerOnly: false },
  { id: 'pharmacy', name: 'Pharmacy', icon: 'medical', iconSet: 'Ionicons', route: '/(os)/health/pharmacy', color: '#fff', bgColor: '#14b8a6', ownerOnly: false },
  { id: 'police', name: 'Police', icon: 'shield', iconSet: 'Ionicons', route: '/(civic)/police', color: '#fff', bgColor: '#1e40af', ownerOnly: false },
  { id: 'portfolio', name: 'Portfolio', icon: 'briefcase', iconSet: 'Ionicons', route: '/(work)/jobs/portfolio', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'prisons', name: 'Prisons', icon: 'lock-closed', iconSet: 'Ionicons', route: '/(civic)/prisons', color: '#fff', bgColor: '#7c2d12', ownerOnly: false },
  { id: 'profile', name: 'Profile', icon: 'person', iconSet: 'Ionicons', route: '/(os)/profile', color: '#fff', bgColor: '#6366f1', ownerOnly: false },
  { id: 'property', name: 'Property', icon: 'home', iconSet: 'Ionicons', route: '/(os)/property', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'qr', name: 'QR', icon: 'qr-code', iconSet: 'Ionicons', route: '/(os)/profile/qr', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false },
  { id: 'radiology', name: 'Radiology', icon: 'scan', iconSet: 'Ionicons', route: '/(os)/health/radiology', color: '#fff', bgColor: '#8b5cf6', ownerOnly: false },
  { id: 'reader', name: 'Reader', icon: 'book', iconSet: 'Ionicons', route: '/(os)/reader', color: '#fff', bgColor: '#059669', ownerOnly: false },
  { id: 'records', name: 'Records', icon: 'folder', iconSet: 'Ionicons', route: '/(os)/health/records', color: '#fff', bgColor: '#6b7280', ownerOnly: false },
  { id: 'regulatory', name: 'Regulatory', icon: 'document-text', iconSet: 'Ionicons', route: '/(os)/regulatory', color: '#fff', bgColor: '#7c3aed', ownerOnly: true },
  { id: 'restaurant', name: 'Restaurant', icon: 'restaurant', iconSet: 'Ionicons', route: '/(os)/restaurant', color: '#fff', bgColor: '#ef4444', ownerOnly: false },
  { id: 'revenue', name: 'Revenue', icon: 'cash', iconSet: 'Ionicons', route: '/(admin)/command-centre/revenue', color: '#fff', bgColor: '#059669', ownerOnly: true },
  { id: 'savings', name: 'Savings', icon: 'wallet', iconSet: 'Ionicons', route: '/(os)/wallet/savings', color: '#fff', bgColor: '#22c55e', ownerOnly: false },
  { id: 'scan', name: 'Scan', icon: 'scan', iconSet: 'Ionicons', route: '/(os)/wallet/scan', color: '#fff', bgColor: '#0ea5e9', ownerOnly: false },
  { id: 'search', name: 'Search', icon: 'search', iconSet: 'Ionicons', route: '/(os)/search', color: '#fff', bgColor: '#6b7280', ownerOnly: false },
  { id: 'settings', name: 'Settings', icon: 'settings', iconSet: 'Ionicons', route: '/(os)/settings', color: '#fff', bgColor: '#6b7280', ownerOnly: false },
  { id: 'shop', name: 'Shop', icon: 'storefront', iconSet: 'Ionicons', route: '/(commerce)/shop', color: '#fff', bgColor: '#ec4899', ownerOnly: false },
  { id: 'streets', name: 'Streets', icon: 'videocam', iconSet: 'Ionicons', route: '/(os)/streets', color: '#fff', bgColor: '#ef4444', ownerOnly: false },
  { id: 'studio', name: 'Studio', icon: 'film', iconSet: 'Ionicons', route: '/(os)/studio', color: '#fff', bgColor: '#6366f1', ownerOnly: false },
  { id: 'telemedicine', name: 'Telemed', icon: 'videocam', iconSet: 'Ionicons', route: '/(os)/health/telemedicine', color: '#fff', bgColor: '#06b6d4', ownerOnly: false },
  { id: 'topup', name: 'Top Up', icon: 'add-circle', iconSet: 'Ionicons', route: '/(os)/wallet/top-up', color: '#fff', bgColor: '#22c55e', ownerOnly: false },
  { id: 'transfer', name: 'Transfer', icon: 'swap-horizontal', iconSet: 'Ionicons', route: '/(os)/wallet/transfer', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'transport', name: 'Transport', icon: 'bus', iconSet: 'Ionicons', route: '/(civic)/transport', color: '#fff', bgColor: '#f59e0b', ownerOnly: false },
  { id: 'tribes', name: 'Tribes', icon: 'people', iconSet: 'Ionicons', route: '/(os)/tribes', color: '#fff', bgColor: '#d946ef', ownerOnly: false },
  { id: 'upload', name: 'Upload', icon: 'cloud-upload', iconSet: 'Ionicons', route: '/(os)/upload', color: '#fff', bgColor: '#0891b2', ownerOnly: false },
  { id: 'wallet', name: 'Wallet', icon: 'wallet', iconSet: 'Ionicons', route: '/(os)/wallet', color: '#fff', bgColor: '#f97316', ownerOnly: false },
  { id: 'wifi', name: 'WiFi', icon: 'wifi', iconSet: 'Ionicons', route: '/(os)/wifi', color: '#fff', bgColor: '#3b82f6', ownerOnly: false },
  { id: 'withdraw', name: 'Withdraw', icon: 'arrow-down-circle', iconSet: 'Ionicons', route: '/(os)/wallet/withdraw', color: '#fff', bgColor: '#dc2626', ownerOnly: false },
];

// Sort alphabetically
ALL_APPS.sort((a, b) => a.name.localeCompare(b.name));

function AppIcon({ app }: { app: AppTile }) {
  const IconComponent = app.iconSet === 'MaterialCommunityIcons' ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={[styles.iconContainer, { backgroundColor: app.bgColor }]}>
      <IconComponent name={app.icon as any} size={22} color={app.color} />
    </View>
  );
}

// ─── Status Bar Component ───
function StatusBarInfo() {
  const [time, setTime] = useState('');
  const [battery, setBattery] = useState(85);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`);
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.statusBar}>
      <View style={styles.statusLeft}>
        <Ionicons name="cellular" size={14} color="#fff" />
        <Ionicons name="wifi" size={14} color="#fff" style={{ marginLeft: 4 }} />
      </View>
      <Text style={styles.statusTime}>{time}</Text>
      <View style={styles.statusRight}>
        <Ionicons name="bluetooth" size={14} color="#fff" />
        <Text style={styles.statusBattery}>{battery}%</Text>
        <Ionicons name="battery-half" size={14} color="#fff" style={{ marginLeft: 2 }} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    settings, loadSettings, loadLayouts,
    isEditMode, setEditMode,
    setSelectedApp, setShowMenu,
    setShowWallpaperPicker,
    trackAppOpen,
  } = useHomeStore();

  const [greeting, setGreeting] = useState('Good evening');
  const [currentDate, setCurrentDate] = useState('');
  const [pressTimer, setPressTimer] = useState<NodeJS.Timeout | null>(null);

  // Owner check
  const isOwner = user?.email === 'OWNER_EMAIL_HERE';

  useEffect(() => {
    loadSettings();
    loadLayouts();
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    setCurrentDate(`${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}`);
  }, []);

  const handlePressIn = useCallback((app: AppTile) => {
    const timer = setTimeout(() => {
      setSelectedApp({
        id: app.id, appId: app.id, appName: app.name, appIcon: app.icon,
        appRoute: app.route, positionX: 0, positionY: 0, pageNumber: 0,
        folderId: null, isHidden: false, isPinned: false,
      });
      setShowMenu(true);
    }, 500);
    setPressTimer(timer);
  }, []);

  const handlePressOut = useCallback(() => {
    if (pressTimer) { clearTimeout(pressTimer); setPressTimer(null); }
  }, [pressTimer]);

  const launchApp = (app: AppTile) => {
    if (pressTimer) { clearTimeout(pressTimer); setPressTimer(null); }
    trackAppOpen(app.id);
    router.push(app.route as any);
  };

  const handleEmptySpaceLongPress = () => {
    setShowWallpaperPicker(true);
  };

  // ─── FILTER: Hide civic apps and nested sub-apps ───
  const visibleApps = ALL_APPS.filter((app) => {
    // Always hide apps in HIDDEN_APP_IDS
    if (HIDDEN_APP_IDS.has(app.id)) return false;
    // Hide owner-only apps for non-owners
    if (app.ownerOnly && !isOwner) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ImageBackground
        source={settings.wallpaperType === 'default'
          ? require('@/assets/images/mtaa_home.png')
          : { uri: settings.wallpaperUrl }
        }
        style={styles.background}
        resizeMode="cover"
      >
        {/* Status Bar */}
        <StatusBarInfo />

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.username}>{user?.user_metadata?.full_name || 'User'}</Text>
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

          {/* Edit Mode Banner */}
          {isEditMode && (
            <View style={styles.editBanner}>
              <Text style={styles.editText}>Edit Mode — Drag apps to rearrange</Text>
              <TouchableOpacity onPress={() => setEditMode(false)}>
                <Text style={styles.doneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* App Count */}
          <Text style={styles.appCount}>{visibleApps.length} Apps</Text>

          {/* All Apps — Single Alphabetical Grid */}
          <View style={styles.grid}>
            {visibleApps.map((app) => (
              <Pressable
                key={app.id}
                style={styles.tile}
                onPress={() => launchApp(app)}
                onPressIn={() => handlePressIn(app)}
                onPressOut={handlePressOut}
                delayLongPress={500}
              >
                <AppIcon app={app} />
                <Text style={styles.tileLabel}>{app.name}</Text>
                {isEditMode && (
                  <View style={styles.editBadge}>
                    <Ionicons name="remove-circle" size={18} color="#f44" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* Empty space for long-press wallpaper */}
          <Pressable
            style={{ height: 120 }}
            onLongPress={handleEmptySpaceLongPress}
            delayLongPress={600}
          />
        </ScrollView>

        {/* Smart Dock */}
        <SmartDock />
      </ImageBackground>

      {/* Overlays */}
      <WallpaperPicker />
      <LongPressMenu />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: '100%', height: '100%' },

  // Status Bar
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    zIndex: 10,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center' },
  statusTime: { color: '#fff', fontSize: 13, fontWeight: '600' },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusBattery: { color: '#fff', fontSize: 11, marginLeft: 4 },

  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13 },
  username: { color: '#fff', fontSize: 17, fontWeight: '700' },
  dateSection: { alignItems: 'center', marginBottom: 20 },
  dayNumber: { color: '#fff', fontSize: 52, fontWeight: '200', lineHeight: 58 },
  monthYear: { color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 },
  editBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0,170,255,0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  editText: { color: '#0af', fontSize: 13, fontWeight: '600' },
  doneText: { color: '#0af', fontSize: 13, fontWeight: '600' },
  appCount: { color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 12, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_GAP },
  tile: { width: TILE_WIDTH, alignItems: 'center', marginBottom: 4 },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  tileLabel: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  editBadge: {
    position: 'absolute',
    top: -4,
    right: 4,
  },
});
