import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function PropertyCard({ property, onPress }: { property: any; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.title}>{property.title}</Text>
      <Text style={styles.location}>{property.location}</Text>
      <Text style={styles.price}>${property.price}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 10 },
  title: { color: '#fff', fontSize: 16, fontWeight: '600' },
  location: { color: '#888', marginTop: 4 },
  price: { color: '#00d4ff', fontSize: 16, fontWeight: '700', marginTop: 8 },
});
