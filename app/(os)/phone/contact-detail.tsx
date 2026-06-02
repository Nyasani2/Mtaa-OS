import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContactStore } from '@/domains/phone/state/contactStore';
import { usePhoneStore } from '@/domains/phone/state/phoneStore';
import { osShell } from '@/lib/shell/osShell';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { contacts, deleteContact } = useContactStore();
  const { makeCall } = usePhoneStore();

  const contact = contacts.find((c) => c.id === id);
  if (!contact) return null;

  const fullName = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown';

  const handleCall = (number: string) => {
    makeCall(number);
    osShell.emit('phone:call:started', { number, name: fullName });
  };

  const handleMessage = (number: string) => {
    router.push(`/(os)/messages?to=${number}`);
  };

  const handleDelete = () => {
    Alert.alert('Delete Contact', `Delete ${fullName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteContact(id as string);
          osShell.emit('contact:deleted', { id });
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push(`/(os)/phone/contact-edit?id=${id}`)}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(contact.firstName?.[0] || '') + (contact.lastName?.[0] || '')}
            </Text>
          </View>
          <Text style={styles.name}>{fullName}</Text>
          {contact.company && <Text style={styles.company}>{contact.company}</Text>}
        </View>

        <View style={styles.actionRow}>
          {contact.phoneNumbers?.map((num, idx) => (
            <View key={idx} style={styles.actionGroup}>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleCall(num)}>
                <Ionicons name="call" size={24} color="#34C759" />
                <Text style={styles.actionLabel}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleMessage(num)}>
                <Ionicons name="chatbubble" size={24} color="#007AFF" />
                <Text style={styles.actionLabel}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="videocam" size={24} color="#8E8E93" />
                <Text style={styles.actionLabel}>Video</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={styles.infoSection}>
          {contact.phoneNumbers?.map((num, idx) => (
            <View key={idx} style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color="#8E8E93" />
              <View style={styles.infoContent}>
                <Text style={styles.infoValue}>{num}</Text>
                <Text style={styles.infoLabel}>mobile</Text>
              </View>
            </View>
          ))}
          {contact.emails?.map((em, idx) => (
            <View key={idx} style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color="#8E8E93" />
              <View style={styles.infoContent}>
                <Text style={styles.infoValue}>{em}</Text>
                <Text style={styles.infoLabel}>email</Text>
              </View>
            </View>
          ))}
          {contact.notes && (
            <View style={styles.infoRow}>
              <Ionicons name="document-text-outline" size={20} color="#8E8E93" />
              <View style={styles.infoContent}>
                <Text style={styles.infoValue}>{contact.notes}</Text>
                <Text style={styles.infoLabel}>notes</Text>
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteText}>Delete Contact</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 16, paddingBottom: 12 },
  editText: { fontSize: 16, color: '#007AFF' },
  profileSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: '600', color: '#8E8E93' },
  name: { fontSize: 24, fontWeight: '600', color: '#000' },
  company: { fontSize: 16, color: '#8E8E93', marginTop: 4 },
  actionRow: { paddingHorizontal: 16, marginBottom: 24 },
  actionGroup: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, marginBottom: 8 },
  actionButton: { alignItems: 'center' },
  actionLabel: { fontSize: 12, color: '#007AFF', marginTop: 6 },
  infoSection: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  infoContent: { marginLeft: 12, flex: 1 },
  infoValue: { fontSize: 16, color: '#000' },
  infoLabel: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  deleteButton: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 40 },
  deleteText: { fontSize: 16, color: '#FF3B30', fontWeight: '500' },
});
