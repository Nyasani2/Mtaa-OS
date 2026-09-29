// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SIDEBAR_ITEMS = [
  { label: 'Dashboard', icon: 'grid', route: '/(education)' },
  { label: 'My Classes', icon: 'people', route: '/(education)/classes' },
  { label: 'Assignments', icon: 'clipboard', route: '/(education)/assignments' },
  { label: 'Grades & Results', icon: 'trophy', route: '/(education)/results' },
  { label: 'Timetable', icon: 'calendar', route: '/(education)/timetable' },
  { label: 'Library', icon: 'book', route: '/(education)/library' },
  { label: 'Transport Tracking', icon: 'bus', route: '/(education)/transport/track' },
  { label: 'Live Classes', icon: 'videocam', route: '/(education)/live-class' },
  { label: 'Messages', icon: 'chatbubbles', route: '/(education)/messages' },
];

const DONUT_ACTIONS = [
  { label: 'Scan QR', icon: 'qr-code', color: '#8b5cf6', route: '/(education)/student/qr-display' },
  { label: 'Go Live', icon: 'videocam', color: '#ef4444', route: '/(education)/live-class/create' },
  { label: 'New Post', icon: 'create', color: '#3b82f6', route: '/(education)/feed/create' },
  { label: 'Transport', icon: 'bus', color: '#0ea5e9', route: '/(education)/transport/track' },
];

export default function EducationShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [donutOpen, setDonutOpen] = useState(false);

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      {sidebarOpen && (
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <Text style={styles.sidebarTitle}>MTAA Education</Text>
            <TouchableOpacity onPress={() => setSidebarOpen(false)}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.sidebarNav} showsVerticalScrollIndicator={false}>
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname.includes(item.route.replace('/(education)', '')) || (item.route === '/(education)' && pathname === '/(education)');
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.navItem, isActive && styles.navItemActive]}
                  onPress={() => router.push(item.route as any)}
                >
                  <Ionicons name={item.icon as any} size={20} color={isActive ? '#3b82f6' : '#94a3b8'} />
                  <Text style={[styles.navText, isActive && styles.navTextActive]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Main Content Area */}
      <View style={[styles.main, !sidebarOpen && { marginLeft: 0 }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setSidebarOpen(!sidebarOpen)} style={styles.menuBtn}>
            <Ionicons name={sidebarOpen ? "menu" : "menu-outline"} size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Education Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Page Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>

        {/* Donut Menu FAB */}
        <View style={styles.donutContainer}>
          {donutOpen && DONUT_ACTIONS.map((action, i) => {
            const angle = (Math.PI / 2) + (i * (Math.PI / (DONUT_ACTIONS.length - 1)));
            const radius = 90;
            const x = Math.cos(angle) * radius;
            const y = -Math.sin(angle) * radius;
            return (
              <TouchableOpacity
                key={action.label}
                style={[styles.donutItem, { transform: [{ translateX: x }, { translateY: y }] }]}
                onPress={() => { router.push(action.route as any); setDonutOpen(false); }}
              >
                <View style={styles.donutLabel}>
                  <Text style={styles.donutLabelText}>{action.label}</Text>
                </View>
                <View style={[styles.donutIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon as any} size={20} color="#fff" />
                </View>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity style={styles.donutFab} onPress={() => setDonutOpen(!donutOpen)}>
            <Ionicons name={donutOpen ? "close" : "add"} size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#f1f5f9' },
  sidebar: { width: 260, backgroundColor: '#1e293b', paddingTop: 60, borderRightWidth: 1, borderRightColor: '#334155' },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  sidebarTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sidebarNav: { flex: 1 },
  navItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  navItemActive: { backgroundColor: '#334155', borderLeftWidth: 3, borderLeftColor: '#3b82f6' },
  navText: { color: '#94a3b8', fontSize: 15, fontWeight: '500' },
  navTextActive: { color: '#fff', fontWeight: '600' },
  main: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1e3a5f', borderBottomWidth: 1, borderBottomColor: '#334155' },
  menuBtn: { padding: 4 },
  topTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  content: { flex: 1, padding: 16 },
  donutContainer: { position: 'absolute', bottom: 30, right: 30, alignItems: 'center', justifyContent: 'center' },
  donutFab: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#3b82f6', alignItems: 'center', justifyContent: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
  donutItem: { position: 'absolute', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  donutIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  donutLabel: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  donutLabelText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
