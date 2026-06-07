import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function SystemPanels() {
  const router = useRouter();

  const panels = [
    { title: 'Activity', route: '/activity', icon: '📊' },
    { title: 'Alerts', route: '/civic/alerts', icon: '🚨' },
    { title: 'Transactions', route: '/wallet/transactions', icon: '💰' },
  ];

  return (
    <View style={styles.container}>
      {panels.map((panel) => (
        <TouchableOpacity key={panel.route} style={styles.panel} onPress={() => router.push(panel.route)}>
          <Text style={styles.icon}>{panel.icon}</Text>
          <Text style={styles.title}>{panel.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 12, padding: 16 },
  panel: { flex: 1, backgroundColor: '#f5f5f5', padding: 16, borderRadius: 8, alignItems: 'center' },
  icon: { fontSize: 24, marginBottom: 8 },
  title: { fontSize: 12, fontWeight: '600' }
});

