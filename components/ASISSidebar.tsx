// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useASIS } from '@/lib/asis-cse/asis-cse-provider';

export function ASISSidebar({ visible, onClose, onNewChat, onSelectConversation }) {
  const { conversations, currentConversation, deleteConversation } = useASIS();
  const [searchQuery, setSearchQuery] = useState('');

  if (!visible) return null;

  const handleDelete = (id) => {
    Alert.alert('Delete?', 'Delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteConversation(id) },
    ]);
  };

  const filtered = conversations.filter(c => c.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View style={styles.sidebar}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.newChatBtn} onPress={onNewChat}>
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.newChatText}>New chat</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color="#64748b" />
            <TextInput style={styles.searchInput} placeholder="Search..." placeholderTextColor="#64748b" value={searchQuery} onChangeText={setSearchQuery} />
          </View>

          <ScrollView style={styles.list}>
            {filtered.length === 0 && <Text style={styles.empty}>No conversations</Text>}
            {filtered.map(conv => (
              <TouchableOpacity
                key={conv.id}
                style={[styles.item, currentConversation?.id === conv.id && styles.itemActive]}
                onPress={() => onSelectConversation(conv.id)}
                onLongPress={() => handleDelete(conv.id)}
              >
                <Ionicons name="chatbubble-outline" size={16} color={currentConversation?.id === conv.id ? '#fff' : '#64748b'} />
                <Text style={[styles.itemText, currentConversation?.id === conv.id && styles.itemTextActive]} numberOfLines={1}>
                  {conv.title || 'New Conversation'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.userSection}>
              <View style={styles.userAvatar}><Ionicons name="sparkles" size={16} color="#fff" /></View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>ASIS User</Text>
                <Text style={styles.userPlan}>ASIS CSE v3.6</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sidebar: { width: '85%', maxWidth: 320, height: '100%', backgroundColor: '#1e293b', position: 'absolute', left: 0, top: 0 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3b82f6', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  newChatText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  closeBtn: { padding: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', margin: 12, padding: 10, borderRadius: 8, gap: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  list: { flex: 1, paddingHorizontal: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 8, marginBottom: 2 },
  itemActive: { backgroundColor: '#334155' },
  itemText: { flex: 1, color: '#94a3b8', fontSize: 14 },
  itemTextActive: { color: '#fff' },
  empty: { color: '#64748b', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  footer: { borderTopWidth: 1, borderTopColor: '#334155', padding: 12 },
  userSection: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, backgroundColor: '#0f172a', borderRadius: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1 },
  userName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  userPlan: { color: '#64748b', fontSize: 11 },
});
