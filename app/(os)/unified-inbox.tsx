// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import NotificationsScreen from './notifications';

export default function UnifiedInboxScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'notifications' | 'messages'>('notifications');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inbox</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'notifications' && styles.tabActive]} 
          onPress={() => setActiveTab('notifications')}
        >
          <Ionicons name="notifications-outline" size={20} color={activeTab === 'notifications' ? '#00d4ff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'notifications' && styles.tabTextActive]}>Notifications</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]} 
          onPress={() => setActiveTab('messages')}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={activeTab === 'messages' ? '#00d4ff' : '#888'} />
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>Messages</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === 'notifications' ? (
          <NotificationsScreen />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="chatbubble-ellipses" size={64} color="#333" />
            <Text style={styles.placeholderText}>Direct Messages Center</Text>
            <Text style={styles.placeholderSub}>Chat with drivers, schools, and other users here.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222' },
  tab: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, gap: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#00d4ff' },
  tabText: { color: '#888', fontSize: 15, fontWeight: '600' },
  tabTextActive: { color: '#00d4ff' },
  content: { flex: 1 },
  placeholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  placeholderText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 16 },
  placeholderSub: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 8 },
});
