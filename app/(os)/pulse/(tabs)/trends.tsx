import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function TrendsScreen() {
  const categories = ['Topics', 'Businesses', 'Communities', 'Creators', 'Products'];

  return (
    <View style={styles.container}>
      <Text style={styles.header}>📈 Pulse Trends</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
        {categories.map(c => (
          <TouchableOpacity key={c} style={styles.categoryChip}>
            <Text style={styles.categoryText}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.empty}>What's trending across MTAA</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a', padding: 16 },
  header: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },
  categoryRow: { flexDirection: 'row', marginBottom: 16 },
  categoryChip: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  categoryText: { color: '#fff', fontSize: 13 },
  empty: { color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 40 },
});
