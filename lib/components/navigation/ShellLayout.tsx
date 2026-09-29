// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppSidebar from './AppSidebar';
import DonutMenu from './DonutMenu';

interface ShellLayoutProps {
  title: string;
  logo?: string;
  sections: any[];
  donutItems: any[];
  children: React.ReactNode;
  donutColor?: string;
}

export default function ShellLayout({
  title,
  logo,
  sections,
  donutItems,
  children,
  donutColor = '#3b82f6',
}: ShellLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { width } = Dimensions.get('window');

  return (
    <View style={styles.container}>
      {/* Sidebar */}
      {sidebarOpen && (
        <AppSidebar
          title={title}
          logo={logo}
          sections={sections}
          onNavigate={() => {}}
        />
      )}

      {/* Main Content Area */}
      <View style={[styles.main, { marginLeft: sidebarOpen ? 260 : 0 }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => setSidebarOpen(!sidebarOpen)} style={styles.menuBtn}>
            <Ionicons name={sidebarOpen ? 'menu' : 'menu-outline'} size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.topTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Page Content */}
        <View style={styles.content}>{children}</View>

        {/* Floating Donut */}
        <DonutMenu items={donutItems} centerColor={donutColor} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: '#0a0a0f' },
  main: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  menuBtn: { padding: 4 },
  topTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  content: { flex: 1, backgroundColor: '#0a0a0f' },
});
