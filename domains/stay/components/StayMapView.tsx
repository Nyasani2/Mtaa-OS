import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props { listings?: any[]; onMarkerPress?: (id: string) => void; }

export default function StayMapView({ listings }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>🗺️ Map View ({listings?.length || 0} stays)</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' }, text: { fontSize: 16, color: '#6b7280' } });
