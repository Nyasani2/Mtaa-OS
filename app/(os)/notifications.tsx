import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

interface Notification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', title: 'Welcome', body: 'Welcome to MTAA OS', read: false, created_at: new Date().toISOString() },
  { id: '2', title: 'Update', body: 'New apps available', read: true, created_at: new Date().toISOString() },
];

export default function NotificationsScreen() {
  const markAsRead = (id: string) => {
    // Mark read handled via API
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={[]}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, item.read ? styles.read : styles.unread]} onPress={() => markAsRead(item.id)}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardBody}>{item.body}</Text>
            <Text style={styles.time}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  card: { padding: 12, marginBottom: 8, borderRadius: 8 },
  unread: { backgroundColor: '#e3f2fd' },
  read: { backgroundColor: '#f5f5f5' },
  cardTitle: { fontWeight: '600', fontSize: 14 },
  cardBody: { fontSize: 12, color: '#666', marginTop: 4 },
  time: { fontSize: 10, color: '#999', marginTop: 4 }
});

