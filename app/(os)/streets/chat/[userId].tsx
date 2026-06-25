import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function ChatScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}>
        <Ionicons name="chatbubbles-outline" size={48} color="#444" />
        <Text style={styles.text}>Chat coming soon</Text>
        <Text style={styles.subtext}>User ID: {userId}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#888', fontSize: 16, marginTop: 12 },
  subtext: { color: '#444', fontSize: 12, marginTop: 8 },
});
