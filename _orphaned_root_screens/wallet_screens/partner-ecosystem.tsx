// app/(os)/wallet/partner-ecosystem.tsx — Partner Ecosystem
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PartnerEcosystemScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Partner Ecosystem</Text>
        <Text style={styles.subtitle}>Coming soon — under development</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 16, alignItems: 'center', justifyContent: 'center', flex: 1 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#94A3B8', fontSize: 16 },
});
