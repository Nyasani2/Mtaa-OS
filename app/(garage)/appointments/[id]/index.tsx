import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Appointment #{id}</Text>
      <Text style={styles.subtitle}>This route is handled by the modal in the parent screen.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  title: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
