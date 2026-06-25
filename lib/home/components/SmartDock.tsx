import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useHomeStore } from '../store/home.store';

const DOCK_APPS: Record<string, { icon: string; route: string; color: string }> = {
  phone: { icon: 'call', route: '/phone', color: '#22c55e' },
  messages: { icon: 'chatbubble', route: '/(communication)/messages', color: '#3b82f6' },
  wallet: { icon: 'wallet', route: '/wallet', color: '#f97316' },
  profile: { icon: 'person', route: '/profile', color: '#8b5cf6' },
  search: { icon: 'search', route: '/appstore/search', color: '#0af' },
};

export default function SmartDock() {
  const router = useRouter();
  const { settings } = useHomeStore();

  if (!settings.showDock) return null;

  return (
    <View style={styles.dock}>
      <View style={styles.dockBg}>
        {settings.dockApps.map((appId) => {
          const app = DOCK_APPS[appId];
          if (!app) return null;
          return (
            <TouchableOpacity
              key={appId}
              style={styles.dockItem}
              onPress={() => router.push(app.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.dockIcon, { backgroundColor: app.color + '20' }]}>
                <Ionicons name={app.icon as any} size={22} color={app.color} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  dockBg: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30,30,30,0.85)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 16,
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  dockItem: {
    alignItems: 'center',
  },
  dockIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
