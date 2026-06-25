import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Slider,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHomeStore } from '../store/home.store';

let ImagePicker: any;
try { ImagePicker = require('expo-image-picker'); } catch { ImagePicker = null; }

const MTAA_WALLPAPERS = [
  { id: 'warrior', name: 'Default Warrior', url: require('@/assets/images/mtaa_home.png') },
  { id: 'africa1', name: 'Savanna Sunset', url: null },
  { id: 'africa2', name: 'Kilimanjaro', url: null },
  { id: 'africa3', name: 'Nile River', url: null },
  { id: 'tech1', name: 'Digital Grid', url: null },
  { id: 'tech2', name: 'Neural Network', url: null },
];

export default function WallpaperPicker() {
  const { showWallpaperPicker, setShowWallpaperPicker, settings, setSettings, saveSettings } = useHomeStore();

  const pickFromGallery = async () => {
    if (!ImagePicker) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSettings({ wallpaperUrl: result.assets[0].uri, wallpaperType: 'gallery' });
    }
  };

  const pickFromCamera = async () => {
    if (!ImagePicker) return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.9,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSettings({ wallpaperUrl: result.assets[0].uri, wallpaperType: 'camera' });
    }
  };

  const setDefault = () => {
    setSettings({ wallpaperUrl: '/assets/images/mtaa_home.png', wallpaperType: 'default', blurStrength: 40 });
  };

  const fetchDailyWallpaper = async (source: 'bing' | 'nasa' | 'africa') => {
    // TODO: Integrate with Bing/NASA/Africa APIs
    console.log(`[Wallpaper] Fetching ${source} wallpaper...`);
  };

  return (
    <Modal visible={showWallpaperPicker} animationType="slide" transparent onRequestClose={() => setShowWallpaperPicker(false)}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Wallpaper</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Blur Strength */}
            <Text style={styles.sectionTitle}>Blur Strength</Text>
            <View style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>{settings.blurStrength}%</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.blurStrength}
                  onChange={(e) => setSettings({ blurStrength: parseInt(e.target.value) })}
                  style={{ flex: 1 }}
                />
              ) : (
                <View style={{ flex: 1 }}>
                  {/* React Native Slider would go here */}
                </View>
              )}
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={pickFromGallery}>
                <Ionicons name="images" size={24} color="#0af" />
                <Text style={styles.actionLabel}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={pickFromCamera}>
                <Ionicons name="camera" size={24} color="#0af" />
                <Text style={styles.actionLabel}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={setDefault}>
                <Ionicons name="refresh" size={24} color="#0af" />
                <Text style={styles.actionLabel}>Default</Text>
              </TouchableOpacity>
            </View>

            {/* Daily Wallpapers */}
            <Text style={styles.sectionTitle}>Daily Wallpapers</Text>
            <View style={styles.dailyRow}>
              {[
                { name: 'Bing', icon: 'sunny', source: 'bing' as const },
                { name: 'NASA', icon: 'planet', source: 'nasa' as const },
                { name: 'Africa', icon: 'map', source: 'africa' as const },
              ].map(item => (
                <TouchableOpacity key={item.name} style={styles.dailyBtn} onPress={() => fetchDailyWallpaper(item.source)}>
                  <Ionicons name={item.icon as any} size={22} color="#fff" />
                  <Text style={styles.dailyLabel}>{item.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* MTAA Wallpapers */}
            <Text style={styles.sectionTitle}>MTAA Wallpapers</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.wallpaperScroll}>
              {MTAA_WALLPAPERS.map(wp => (
                <TouchableOpacity key={wp.id} style={styles.wallpaperThumb} onPress={() => setSettings({ wallpaperUrl: wp.url as any, wallpaperType: 'mtaa' })}>
                  {wp.url ? (
                    <Image source={wp.url} style={styles.thumbImage} />
                  ) : (
                    <View style={[styles.thumbImage, { backgroundColor: '#222', alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="image" size={20} color="#555" />
                    </View>
                  )}
                  <Text style={styles.thumbLabel}>{wp.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </ScrollView>

          <TouchableOpacity style={styles.doneBtn} onPress={() => { saveSettings(); setShowWallpaperPicker(false); }}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor: '#111', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  handle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  sectionTitle: { color: '#888', fontSize: 13, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sliderLabel: { color: '#fff', fontSize: 14, width: 40 },
  quickActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionBtn: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center', gap: 6 },
  actionLabel: { color: '#ccc', fontSize: 12 },
  dailyRow: { flexDirection: 'row', gap: 10 },
  dailyBtn: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center', gap: 6 },
  dailyLabel: { color: '#ccc', fontSize: 12 },
  wallpaperScroll: { marginTop: 8 },
  wallpaperThumb: { marginRight: 12, width: 100 },
  thumbImage: { width: 100, height: 160, borderRadius: 12, marginBottom: 6 },
  thumbLabel: { color: '#aaa', fontSize: 11, textAlign: 'center' },
  doneBtn: { backgroundColor: '#0af', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
