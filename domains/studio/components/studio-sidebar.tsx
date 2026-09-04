import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const SIDEBAR_W = 240;

interface NavItem {
  label: string;
  route: string;
  icon: any;
  section?: string;
}

const NAV: NavItem[] = [
  { label: 'Home', route: '/(os)/studio', icon: 'home' },
  { label: 'Trending', route: '/(os)/studio/trending', icon: 'trending-up' },
  { label: 'Subscriptions', route: '/(os)/studio/subscriptions', icon: 'users' },
  { label: 'Library', route: '/(os)/studio/feed', icon: 'film' },
  { section: 'CREATE', label: 'Go Live', route: '/(os)/studio/live', icon: 'radio' },
  { label: 'Upload', route: '/(os)/studio/upload-center', icon: 'upload-cloud' },
  { label: 'Creator Hub', route: '/(os)/studio/creator-profile', icon: 'user' },
  { label: 'Analytics', route: '/(os)/studio/analytics', icon: 'bar-chart-2' },
  { section: 'MORE', label: 'Live Streams', route: '/(os)/studio/live', icon: 'video' },
  { label: 'Music', route: '/(os)/studio/music-feed', icon: 'music' },
  { label: 'Education', route: '/(os)/studio/learning-feed', icon: 'book-open' },
  { label: 'Settings', route: '/(os)/studio/safety', icon: 'settings' },
];

export default function StudioSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = Platform.OS === 'web' && width >= 1024;

  const press = (route: string) => { onClose(); router.push(route as any); };

  const render = (item: NavItem, idx: number) => {
    const active = pathname === item.route || (item.route !== '/(os)/studio' && pathname?.startsWith(item.route));
    if (item.section) return <Text key={`s${idx}`} style={s.section}>{item.section}</Text>;
    return (
      <TouchableOpacity key={`n${idx}`} style={[s.item, active && s.itemA]} onPress={() => press(item.route)} activeOpacity={0.7}>
        <Feather name={item.icon} size={20} color={active ? '#fff' : '#8E8E93'} />
        <Text style={[s.label, active && s.labelA]}>{item.label}</Text>
      </TouchableOpacity>
    );
  };

  if (isDesktop) {
    return (
      <View style={s.desk}>
        <View style={s.head}>
          <View style={s.logoWrap}><Feather name="play-circle" size={28} color="#FF2D55" /></View>
          <Text style={s.logoText}>MStudio</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {NAV.map(render)}
        </ScrollView>
        <View style={s.foot}><Text style={s.footT}>MTAA OS v10</Text></View>
      </View>
    );
  }
  if (!mobileOpen) return null;
  return (
    <>
      <TouchableOpacity style={s.overlay} onPress={onClose} activeOpacity={1}>
        <View style={s.backdrop} />
      </TouchableOpacity>
      <View style={s.mobile}>
        <View style={s.head}>
          <View style={s.logoWrap}><Feather name="play-circle" size={28} color="#FF2D55" /></View>
          <Text style={s.logoText}>MStudio</Text>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
          {NAV.map(render)}
        </ScrollView>
        <View style={s.foot}><Text style={s.footT}>MTAA OS v10</Text></View>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  desk: { width: SIDEBAR_W, backgroundColor: '#0f0f12', borderRightWidth: 1, borderRightColor: '#1C1C1E', height: '100vh', position: 'fixed', left: 0, top: 0, zIndex: 50, paddingBottom: 16 },
  mobile: { position: 'absolute', left: 0, top: 0, bottom: 0, width: Math.min(width * 0.78, 300), backgroundColor: '#0f0f12', borderRightWidth: 1, borderRightColor: '#1C1C1E', zIndex: 60 },
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 55 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  head: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 20, gap: 10, borderBottomWidth: 1, borderBottomColor: '#1C1C1E' },
  logoWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#1C1C1E', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  section: { fontSize: 10, fontWeight: '700', color: '#636366', marginTop: 16, marginBottom: 6, paddingHorizontal: 16, letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, marginHorizontal: 8, borderRadius: 8, gap: 14 },
  itemA: { backgroundColor: '#1C1C1E' },
  label: { fontSize: 14, color: '#8E8E93', fontWeight: '500' },
  labelA: { color: '#fff', fontWeight: '600' },
  foot: { padding: 16, borderTopWidth: 1, borderTopColor: '#1C1C1E', alignItems: 'center' },
  footT: { fontSize: 10, color: '#636366' },
});
