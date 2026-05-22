import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const chats = [
  { id: 1, name: 'Sarah', lastMessage: 'See you tomorrow!', time: '2m', unread: 2 },
  { id: 2, name: 'Work Group', lastMessage: 'Meeting at 3pm', time: '1h', unread: 0 },
  { id: 3, name: 'Mom', lastMessage: 'Call me when free', time: '3h', unread: 1 },
  { id: 4, name: 'MTAA Support', lastMessage: 'How can we help?', time: '1d', unread: 0 },
];

export function MessagesShell() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.newBtn}>
          <Ionicons name="create" size={20} color="white" />
        </TouchableOpacity>
      </View>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={16} color="#94A3B8" />
        <TextInput style={styles.searchInput} placeholder="Search messages..." placeholderTextColor="#64748B" />
      </View>
      <FlatList
        data={chats}
        keyExtractor={c => c.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.chatRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View style={styles.chatInfo}>
              <View style={styles.chatTop}>
                <Text style={styles.chatName}>{item.name}</Text>
                <Text style={styles.chatTime}>{item.time}</Text>
              </View>
              <View style={styles.chatBottom}>
                <Text style={styles.chatPreview} numberOfLines={1}>{item.lastMessage}</Text>
                {item.unread > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.unread}</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050816' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white' },
  newBtn: { backgroundColor: '#6366F1', padding: 10, borderRadius: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 16, padding: 10, borderRadius: 12, marginBottom: 8 },
  searchInput: { flex: 1, color: 'white', marginLeft: 8, fontSize: 14 },
  chatRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  chatInfo: { flex: 1, marginLeft: 12 },
  chatTop: { flexDirection: 'row', justifyContent: 'space-between' },
  chatName: { color: 'white', fontSize: 15, fontWeight: '600' },
  chatTime: { color: '#64748B', fontSize: 12 },
  chatBottom: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  chatPreview: { color: '#94A3B8', fontSize: 13, flex: 1 },
  badge: { backgroundColor: '#6366F1', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: 'white', fontSize: 12, fontWeight: 'bold' },
});
