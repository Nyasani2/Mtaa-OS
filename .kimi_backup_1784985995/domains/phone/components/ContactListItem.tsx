import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers?: string[];
  emails?: string[];
  company?: string;
}

interface Props {
  contact: Contact;
  onPress: () => void;
  onCallPress: () => void;
  onMessagePress: () => void;
}

export function ContactListItem({ contact, onPress, onCallPress, onMessagePress }: Props) {
  const name = `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unknown';
  const initials = (contact.firstName?.[0] || '') + (contact.lastName?.[0] || '');

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{name}</Text>
        {contact.company && <Text style={styles.company}>{contact.company}</Text>}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onCallPress}>
          <Ionicons name="call" size={20} color="#34C759" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={onMessagePress}>
          <Ionicons name="chatbubble" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600', color: '#8E8E93' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, color: '#000' },
  company: { fontSize: 13, color: '#8E8E93', marginTop: 1 },
  actions: { flexDirection: 'row' },
  actionBtn: { padding: 8, marginLeft: 4 },
});
