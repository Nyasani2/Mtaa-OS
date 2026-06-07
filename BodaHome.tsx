import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function BodaHome() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Boda Boda</Text>
        <Text style={styles.subtitle}>Fast motorcycle transport</Text>
      </View>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/(boda)/request')}>
        <Text style={styles.cardTitle}>Request Ride</Text>
        <Text style={styles.cardDesc}>Book a boda boda near you</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push('/(mtaxi)/history')}>
        <Text style={styles.cardTitle}>Ride History</Text>
        <Text style={styles.cardDesc}>View past trips</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 24, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 4 },
  card: { backgroundColor: '#1a1a1a', margin: 16, padding: 20, borderRadius: 16 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  cardDesc: { fontSize: 14, color: '#888', marginTop: 4 },
});
