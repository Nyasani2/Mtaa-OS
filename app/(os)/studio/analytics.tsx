import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function AnalyticsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Studio Analytics</Text>
      <Text style={styles.subtext}>Coming Soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  text: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subtext: { color: '#94a3b8', fontSize: 14, marginTop: 8 },
});
