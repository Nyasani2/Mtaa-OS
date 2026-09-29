// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  color?: string;
  children?: { label: string; icon: string; route: string }[];
}

interface SidebarProps {
  title: string;
  logo?: string;
  sections: SidebarItem[];
  onNavigate?: (route: string) => void;
}

export default function AppSidebar({ title, logo, sections, onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string | null>(null);

  const handlePress = (item: SidebarItem) => {
    if (item.children) {
      setExpanded(expanded === item.label ? null : item.label);
    } else {
      if (onNavigate) onNavigate(item.route);
      else router.push(item.route as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo / Brand */}
      <View style={styles.brand}>
        {logo && <Text style={styles.logo}>{logo}</Text>}
        <Text style={styles.brandTitle} numberOfLines={1}>{title}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color="#64748b" />
        <Text style={styles.searchText}>Search...</Text>
      </View>

      {/* Navigation Sections */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.nav}>
        {sections.map((section) => {
          const isExpanded = expanded === section.label;
          const isActive = pathname?.includes(section.route.replace('/(', '').split('/')[0]);

          return (
            <View key={section.label}>
              <TouchableOpacity
                style={[styles.navItem, isActive && styles.navItemActive]}
                onPress={() => handlePress(section)}
              >
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name={section.icon as any} size={18} color={isActive ? '#fff' : '#cbd5e1'} />
                  <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                    {section.label}
                  </Text>
                </View>
                {section.children && (
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-forward'}
                    size={16}
                    color="#64748b"
                  />
                )}
              </TouchableOpacity>

              {/* Expandable Children */}
              {section.children && isExpanded && (
                <View style={styles.childrenContainer}>
                  {section.children.map((child) => (
                    <TouchableOpacity
                      key={child.label}
                      style={styles.childItem}
                      onPress={() => {
                        if (onNavigate) onNavigate(child.route);
                        else router.push(child.route as any);
                      }}
                    >
                      <Ionicons name={child.icon as any} size={14} color="#94a3b8" />
                      <Text style={styles.childLabel}>{child.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 260,
    backgroundColor: '#0f172a',
    borderRightWidth: 1,
    borderRightColor: '#1e293b',
    paddingTop: 20,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  logo: { fontSize: 24, marginRight: 8 },
  brandTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  searchText: { color: '#64748b', fontSize: 13, marginLeft: 8 },
  nav: { flex: 1 },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  navItemActive: { backgroundColor: '#1e293b', borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  navLabel: { fontSize: 14, color: '#cbd5e1', marginLeft: 12, fontWeight: '500' },
  navLabelActive: { color: '#fff', fontWeight: '600' },
  childrenContainer: { paddingLeft: 40, backgroundColor: '#0a0f1e' },
  childItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  childLabel: { fontSize: 13, color: '#94a3b8' },
});
