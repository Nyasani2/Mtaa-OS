import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHomeStore } from '@/lib/home/store/home.store';

const WALLPAPERS = [
  { id: 'default', name: 'Midnight', color: '#0f0f0f' },
  { id: 'ocean', name: 'Ocean', color: '#0a1628' },
  { id: 'forest', name: 'Forest', color: '#0a1f0a' },
  { id: 'sunset', name: 'Sunset', color: '#1a0a0a' },
  { id: 'aurora', name: 'Aurora', color: '#0a1a1a' },
  { id: 'nebula', name: 'Nebula', color: '#1a0a1a' },
];

interface WallpaperPickerProps {
  currentWallpaper?: string;
  onSelect?: (wallpaperId: string) => void;
  onClose?: () => void;
}

export function WallpaperPicker({ currentWallpaper, onSelect, onClose }: WallpaperPickerProps) {
  const { settings, setSettings, showWallpaperPicker, setShowWallpaperPicker } = useHomeStore();
  const [selected, setSelected] = useState(currentWallpaper || settings?.wallpaperUrl || 'default');

  // If no props provided (original usage <WallpaperPicker />), use store state
  const isControlled = onClose !== undefined;
  const isVisible = isControlled ? true : showWallpaperPicker;

  if (!isVisible) return null;

  const handleSelect = (id: string) => {
    setSelected(id);
    if (onSelect) {
      onSelect(id);
    } else {
      setSettings({ ...settings, wallpaperUrl: id });
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setShowWallpaperPicker(false);
    }
  };

  return (
    <Modal visible={true} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <View style={styles.header}>
            <Text style={styles.title}>Choose Wallpaper</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close-circle" size={32} color="#ff4444" />
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
            {WALLPAPERS.map((wp) => (
              <TouchableOpacity
                key={wp.id}
                style={[
                  styles.tile,
                  { backgroundColor: wp.color },
                  selected === wp.id && styles.selectedTile,
                ]}
                onPress={() => handleSelect(wp.id)}
              >
                {selected === wp.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#00d4ff" style={styles.check} />
                )}
                <Text style={styles.tileName}>{wp.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  container: { padding: 16, backgroundColor: '#0f0f0f', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  closeBtn: { padding: 4 },
  scroll: { flexDirection: 'row' },
  tile: {
    width: 100,
    height: 140,
    borderRadius: 12,
    marginRight: 12,
    justifyContent: 'flex-end',
    padding: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTile: { borderColor: '#00d4ff' },
  check: { position: 'absolute', top: 8, right: 8 },
  tileName: { color: '#fff', fontSize: 12, fontWeight: '500' },
  doneBtn: {
    backgroundColor: '#00d4ff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  doneText: { color: '#000', fontSize: 16, fontWeight: '700' },
});
