import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function SoundScreen() {
  const { soundId } = useLocalSearchParams<{ soundId: string }>();
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sound</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}>
        <Ionicons name="musical-note-outline" size={48} color="#444" />
        <Text style={styles.emptyText}>Sound {soundId}</Text>
        <Text style={styles.subText}>Audio player integration pending</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  emptyText: { color: '#888', fontSize: 14, marginTop: 12, textAlign: 'center' },
  subText: { color: '#555', fontSize: 12, marginTop: 4 },
});
