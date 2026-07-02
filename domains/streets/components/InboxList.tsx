import React from 'react';
import { View, Text, Image, Pressable, FlatList, StyleSheet, TextInput } from 'react-native';
import { useInbox } from '../hooks/useInbox';

export function InboxList() {
  const { threads, isLoading, selectedThread, setSelectedThread, searchQuery, setSearchQuery } = useInbox();

  const renderThread = ({ item }: { item: any }) => (
    <Pressable
      style={[styles.thread, selectedThread === item.id && styles.selected]}
      onPress={() => setSelectedThread(item.id)}
    >
      <Image source={{ uri: item.participantAvatar }} style={styles.avatar} />
      <View style={styles.threadInfo}>
        <View style={styles.threadHeader}>
          <Text style={styles.name}>{item.participantName}</Text>
          <Text style={styles.time}>{item.lastMessageTime}</Text>
        </View>
        <Text style={[styles.preview, !item.isRead && styles.unread]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
        {!item.isRead && <View style={styles.unreadDot} />}
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={threads}
        renderItem={renderThread}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14 },
  thread: { flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5', alignItems: 'center' },
  selected: { backgroundColor: '#f0f8ff' },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  threadInfo: { flex: 1 },
  threadHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  name: { fontWeight: '700', fontSize: 14 },
  time: { fontSize: 12, color: '#888' },
  preview: { fontSize: 13, color: '#666' },
  unread: { fontWeight: '700', color: '#000' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E91E63', position: 'absolute', right: 12, top: '50%' },
});
