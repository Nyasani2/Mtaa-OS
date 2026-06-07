// app/(os)/phone/index.tsx — Phone Home
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePhoneStore } from '@/domains/phone/state/phoneStore';

export default function PhoneScreen() {
  const router = useRouter();
  const { contacts, callLogs } = usePhoneStore();
  const [activeTab, setActiveTab] = useState<'contacts' | 'recent'>('contacts');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Phone</Text>
        <TouchableOpacity onPress={() => router.push('/phone/contact-new' as any)}>
          <Ionicons name="add" size={28} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'contacts' && styles.activeTab]}
          onPress={() => setActiveTab('contacts')}
        >
          <Text style={[styles.tabText, activeTab === 'contacts' && styles.activeTabText]}>Contacts</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'recent' && styles.activeTab]}
          onPress={() => setActiveTab('recent')}
        >
          <Text style={[styles.tabText, activeTab === 'recent' && styles.activeTabText]}>Recent</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {activeTab === 'contacts' && contacts.map((contact) => (
          <TouchableOpacity
            key={contact.id}
            style={styles.contactRow}
            onPress={() => router.push(`/phone/contact-detail?id=${contact.id}` as any)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{contact.firstName[0]}{contact.lastName[0]}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.firstName} {contact.lastName}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
            </View>
            <Ionicons name="call" size={20} color="#2563EB" />
          </TouchableOpacity>
        ))}
        {activeTab === 'recent' && callLogs.map((log) => (
          <View key={log.id} style={styles.logRow}>
            <Ionicons
              name={log.type === 'missed' ? 'call-missed' : log.type === 'incoming' ? 'call-received' : 'call-made'}
              size={20}
              color={log.type === 'missed' ? '#EF4444' : '#10B981'}
            />
            <Text style={styles.logText}>{log.type} — {log.duration}s</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#1E293B',
  },
  activeTab: { borderBottomColor: '#2563EB' },
  tabText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  activeTabText: { color: '#2563EB' },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  contactPhone: { color: '#94A3B8', fontSize: 13 },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  logText: { color: '#CBD5E1', fontSize: 14, marginLeft: 12 },
});
