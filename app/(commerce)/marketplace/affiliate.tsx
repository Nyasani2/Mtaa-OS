import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AffiliateScreen() {
  const router = useRouter();
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Affiliate Program</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.card}>
        <Ionicons name="gift-outline" size={48} color="#10b981" />
        <Text style={styles.title}>Earn as an Affiliate</Text>
        <Text style={styles.desc}>Share products and earn commission on every sale.</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Join Program</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  card: { margin: 16, padding: 24, backgroundColor: '#1a1a1a', borderRadius: 16, alignItems: 'center' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  desc: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 8 },
  button: { backgroundColor: '#10b981', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, marginTop: 24 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
