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
import { ALL_APPS, HIDDEN_APP_IDS, AppTile } from '@/lib/kernel/app-catalog';

const { width } = Dimensions.get('window');
const ICON_SIZE = 52;
const GRID_GAP = 14;
const COLS = 4;
const TILE_WIDTH = (width - 40 - (COLS - 1) * GRID_GAP) / COLS;

// ─── ALL APPS — Complete Catalog (~60+ apps) — ALPHABETICAL ───

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
