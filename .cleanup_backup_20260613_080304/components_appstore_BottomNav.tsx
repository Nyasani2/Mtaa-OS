import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface Props {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TABS = ['today', 'games', 'apps', 'arcade', 'search'];

export function BottomNav({ activeTab = 'today', onTabChange }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map(tab => (
        <TouchableOpacity key={tab} style={styles.tab} onPress={() => onTabChange?.(tab)}>
          <Text style={[styles.label, activeTab === tab && styles.active]}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function AppStoreBottomNav(props: Props) {
  return <BottomNav {...props} />;
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#0a0a0a' },
  tab: { alignItems: 'center' },
  label: { color: '#888', fontSize: 11 },
  active: { color: '#00d26a', fontWeight: '700' },
});

export default BottomNav;
