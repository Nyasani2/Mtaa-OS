import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';

interface TabItem {
  name: string;
  icon: string;
  label: string;
  route: string;
}

const TABS: TabItem[] = [
  { name: 'home', icon: 'home', label: 'Home', route: '/(os)/appstore' },
  { name: 'apps', icon: 'grid', label: 'Apps', route: '/(os)/appstore/categories' },
  { name: 'search', icon: 'search', label: 'Search', route: '/(os)/appstore/search' },
  { name: 'you', icon: 'user', label: 'You', route: '/(os)/appstore/you' },
];

export function AppStoreBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (route: string) => {
    if (route === '/(os)/appstore' && pathname === '/(os)/appstore') return true;
    if (route !== '/(os)/appstore' && pathname.startsWith(route)) return true;
    return false;
  };

  return (
    <View style={styles.container}>
      {TABS.map(tab => {
        const active = isActive(tab.route);
        return (
          <TouchableOpacity
            key={tab.name}
            style={styles.tab}
            onPress={() => router.push(tab.route)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
              <Feather
                name={tab.icon}
                size={22}
                color={active ? '#4ECDC4' : '#888'}
              />
            </View>
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
          </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#1C1C1C',
    paddingTop: 8,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  iconContainerActive: {
    backgroundColor: 'rgba(78,205,196,0.12)',
  },
  label: {
    color: '#888',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  labelActive: {
    color: '#4ECDC4',
    fontWeight: '700',
  },
});

