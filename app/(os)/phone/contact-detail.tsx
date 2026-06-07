// app/(os)/phone/contact-detail.tsx — Contact Detail
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePhoneStore } from '@/domains/phone/state/phoneStore';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { contacts, startCall, removeContact } = usePhoneStore();
  const contact = contacts.find((c) => c.id === id);

  if (!contact) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.error}>Contact not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {contact.firstName[0]}{contact.lastName[0]}
          </Text>
        </View>
        <Text style={styles.name}>{contact.firstName} {contact.lastName}</Text>
        <Text style={styles.phone}>{contact.phone}</Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => startCall(contact)}>
          <Ionicons name="call" size={24} color="#fff" />
          <Text style={styles.actionText}>Call</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(contact.phone)}>
          <Ionicons name="chatbubble" size={24} color="#fff" />
          <Text style={styles.actionText}>Message</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.deleteBtn} onPress={() => { removeContact(contact.id); router.back(); }}>
        <Text style={styles.deleteText}>Delete Contact</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  backBtn: { padding: 16 },
  header: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  name: { color: '#fff', fontSize: 24, fontWeight: '700' },
  phone: { color: '#94A3B8', fontSize: 16, marginTop: 4 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 24,
  },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: { color: '#fff', fontSize: 12, marginTop: 4 },
  deleteBtn: {
    marginTop: 40,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#EF444420',
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteText: { color: '#EF4444', fontSize: 16, fontWeight: '600' },
  error: { color: '#EF4444', fontSize: 18, textAlign: 'center', marginTop: 40 },
});

