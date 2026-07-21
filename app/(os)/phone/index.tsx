import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput,
  Image, Alert, ScrollView, Modal, KeyboardAvoidingView, Platform,
  Linking, Share, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { usePhoneStore, PhoneContact, PhoneCallLog } from '@/domains/phone/state/phoneStore';

// ─── Types ─────────────────────────────────────────────────────────
type TabType = 'contacts' | 'recent' | 'favorites' | 'keypad';

interface DialPadBtn {
  digit: string;
  letters?: string;
}

const DIAL_PAD: DialPadBtn[] = [
  { digit: '1' },
  { digit: '2', letters: 'ABC' },
  { digit: '3', letters: 'DEF' },
  { digit: '4', letters: 'GHI' },
  { digit: '5', letters: 'JKL' },
  { digit: '6', letters: 'MNO' },
  { digit: '7', letters: 'PQRS' },
  { digit: '8', letters: 'TUV' },
  { digit: '9', letters: 'WXYZ' },
  { digit: '*' },
  { digit: '0', letters: '+' },
  { digit: '#' },
];

const AVATAR_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

// ─── Helpers ───────────────────────────────────────────────────────
function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getPrimaryPhone(contact: PhoneContact): string {
  return contact.phoneNumbers?.find(p => p.isPrimary)?.number || contact.phoneNumbers?.[0]?.number || contact.phone || '';
}

function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  if (cleaned.length === 12) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  if (cleaned.length === 13) return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  return phone;
}

function getCallIcon(type: PhoneCallLog['type']): { icon: any; color: string } {
  switch (type) {
    case 'incoming': return { icon: 'arrow-down', color: '#10B981' };
    case 'outgoing': return { icon: 'arrow-up', color: '#2563EB' };
    case 'missed': return { icon: 'arrow-down', color: '#EF4444' };
    case 'rejected': return { icon: 'close', color: '#EF4444' };
    default: return { icon: 'call', color: '#64748B' };
  }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCallTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Contact Detail Modal ───────────────────────────────────────────
function ContactDetailModal({
  contact, visible, onClose, onEdit, onDelete,
}: {
  contact: PhoneContact | null;
  visible: boolean;
  onClose: () => void;
  onEdit: (c: PhoneContact) => void;
  onDelete: (id: string) => void;
}) {
  const router = useRouter();
  const { toggleFavorite } = usePhoneStore();
  if (!contact) return null;

  const primaryPhone = getPrimaryPhone(contact);
  const whatsappNum = contact.whatsappNumber || primaryPhone;

  const handleCall = async () => {
    if (!primaryPhone) return;
    const { addCallLog } = usePhoneStore.getState();
    await addCallLog({
      userId: contact.user_id,
      contactId: contact.id,
      phoneNumber: primaryPhone,
      contactName: contact.displayName,
      type: 'outgoing',
      duration: 0,
      startedAt: new Date().toISOString(),
    });
    Linking.openURL(`tel:${primaryPhone}`);
  };

  const handleMessage = () => {
    if (!primaryPhone) return;
    router.push(`/(os)/messages?phone=${encodeURIComponent(primaryPhone)}&name=${encodeURIComponent(contact.displayName)}`);
    onClose();
  };

  const handleVideoCall = () => {
    if (!whatsappNum) {
      Alert.alert('No WhatsApp', 'This contact has no WhatsApp number set.');
      return;
    }
    const clean = whatsappNum.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${clean}`).catch(() => {
      Linking.openURL(`whatsapp://send?phone=${clean}`);
    });
  };

  const handleWhatsApp = () => {
    if (!whatsappNum) {
      Alert.alert('No WhatsApp', 'This contact has no WhatsApp number set.');
      return;
    }
    const clean = whatsappNum.replace(/\D/g, '');
    Linking.openURL(`https://wa.me/${clean}`);
  };

  const handleSendCash = () => {
    if (!primaryPhone) return;
    router.push(`/(os)/wallet/transfer?recipient=${encodeURIComponent(primaryPhone)}&name=${encodeURIComponent(contact.displayName)}`);
    onClose();
  };

  const handleEmail = () => {
    const email = contact.emails?.[0]?.email;
    if (email) Linking.openURL(`mailto:${email}`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${contact.displayName}\n${primaryPhone}\n${contact.emails?.map(e => e.email).filter(Boolean).join('\n') || ''}`,
      });
    } catch {}
  };

  const handleToggleFav = async () => {
    await toggleFavorite(contact.id, !contact.isFavorite);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={dStyles.overlay}>
        <ScrollView style={dStyles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={dStyles.header}>
            <TouchableOpacity onPress={onClose} style={dStyles.headerBtn}>
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onEdit(contact); onClose(); }} style={dStyles.headerBtn}>
              <Text style={dStyles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <View style={dStyles.avatarSection}>
            {contact.photoUrl ? (
              <Image source={{ uri: contact.photoUrl }} style={dStyles.avatarImg} />
            ) : (
              <View style={[dStyles.avatarFallback, { backgroundColor: getAvatarColor(contact.displayName) }]}>
                <Text style={dStyles.avatarText}>{getInitials(contact.displayName)}</Text>
              </View>
            )}
            <Text style={dStyles.nameText}>{contact.displayName}</Text>
            {contact.company && (
              <Text style={dStyles.companyText}>
                {contact.jobTitle ? `${contact.jobTitle} at ` : ''}{contact.company}
              </Text>
            )}
          </View>

          {/* Quick Actions */}
          <View style={dStyles.quickActions}>
            <TouchableOpacity style={dStyles.actionBtn} onPress={handleMessage}>
              <View style={[dStyles.actionIcon, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="chatbubble" size={20} color="#fff" />
              </View>
              <Text style={dStyles.actionLabel}>Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dStyles.actionBtn} onPress={handleCall}>
              <View style={[dStyles.actionIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="call" size={20} color="#fff" />
              </View>
              <Text style={dStyles.actionLabel}>Call</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dStyles.actionBtn} onPress={handleVideoCall}>
              <View style={[dStyles.actionIcon, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="videocam" size={20} color="#fff" />
              </View>
              <Text style={dStyles.actionLabel}>Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dStyles.actionBtn} onPress={handleSendCash}>
              <View style={[dStyles.actionIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="cash" size={20} color="#fff" />
              </View>
              <Text style={dStyles.actionLabel}>Send Cash</Text>
            </TouchableOpacity>
          </View>

          {/* Phone Numbers */}
          {contact.phoneNumbers?.length > 0 && (
            <View style={dStyles.section}>
              <Text style={dStyles.sectionTitle}>Phone</Text>
              {contact.phoneNumbers.map((phone, idx) => (
                <View key={idx} style={dStyles.infoRow}>
                  <View style={dStyles.infoLeft}>
                    <Text style={dStyles.infoValue}>{formatPhoneDisplay(phone.number)}</Text>
                    <Text style={dStyles.infoLabel}>{phone.label}</Text>
                  </View>
                  <View style={dStyles.infoActions}>
                    <TouchableOpacity onPress={() => Linking.openURL(`tel:${phone.number}`)}>
                      <Ionicons name="call-outline" size={22} color="#10B981" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push(`/(os)/messages?phone=${encodeURIComponent(phone.number)}`)}>
                      <Ionicons name="chatbubble-outline" size={22} color="#2563EB" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => {
                      const clean = (contact.whatsappNumber || phone.number).replace(/\D/g, '');
                      Linking.openURL(`https://wa.me/${clean}`);
                    }}>
                      <FontAwesome name="whatsapp" size={22} color="#25D366" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Emails */}
          {contact.emails?.length > 0 && (
            <View style={dStyles.section}>
              <Text style={dStyles.sectionTitle}>Email</Text>
              {contact.emails.map((email, idx) => (
                <TouchableOpacity key={idx} style={dStyles.infoRow} onPress={handleEmail}>
                  <View style={dStyles.infoLeft}>
                    <Text style={dStyles.infoValue}>{email.email}</Text>
                    <Text style={dStyles.infoLabel}>{email.label}</Text>
                  </View>
                  <Ionicons name="mail-outline" size={22} color="#2563EB" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Notes */}
          {contact.notes && (
            <View style={dStyles.section}>
              <Text style={dStyles.sectionTitle}>Notes</Text>
              <Text style={dStyles.notesText}>{contact.notes}</Text>
            </View>
          )}

          {/* More Actions */}
          <View style={dStyles.section}>
            <TouchableOpacity style={dStyles.moreRow} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="#2563EB" />
              <Text style={dStyles.moreText}>Share Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dStyles.moreRow} onPress={handleToggleFav}>
              <Ionicons name={contact.isFavorite ? 'star' : 'star-outline'} size={22} color="#F59E0B" />
              <Text style={dStyles.moreText}>
                {contact.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={dStyles.moreRow} onPress={handleWhatsApp}>
              <FontAwesome name="whatsapp" size={22} color="#25D366" />
              <Text style={dStyles.moreText}>Open in WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[dStyles.moreRow, { borderBottomWidth: 0 }]}
              onPress={() => {
                Alert.alert('Delete Contact', `Delete ${contact.displayName}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => { onDelete(contact.id); onClose(); } },
                ]);
              }}
            >
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
              <Text style={[dStyles.moreText, { color: '#EF4444' }]}>Delete Contact</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const dStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0F172A' },
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 8 },
  headerBtn: { padding: 8 },
  editText: { color: '#2563EB', fontSize: 16, fontWeight: '600' },

  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarImg: { width: 100, height: 100, borderRadius: 50 },
  avatarFallback: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '600' },
  nameText: { color: '#fff', fontSize: 26, fontWeight: '700', marginTop: 16 },
  companyText: { color: '#94A3B8', fontSize: 15, marginTop: 4 },

  quickActions: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, paddingHorizontal: 16 },
  actionBtn: { alignItems: 'center', gap: 8 },
  actionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { color: '#fff', fontSize: 12 },

  section: { paddingHorizontal: 16, marginTop: 8, borderTopWidth: 0.5, borderTopColor: '#1E293B', paddingTop: 12 },
  sectionTitle: { color: '#64748B', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1E293B' },
  infoLeft: { flex: 1 },
  infoValue: { color: '#fff', fontSize: 16 },
  infoLabel: { color: '#64748B', fontSize: 12, marginTop: 2 },
  infoActions: { flexDirection: 'row', gap: 16 },
  notesText: { color: '#CBD5E1', fontSize: 15, lineHeight: 22 },

  moreRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#1E293B' },
  moreText: { color: '#fff', fontSize: 16 },
});

// ─── Add/Edit Contact Form Modal ───────────────────────────────────
function ContactFormModal({
  contact, visible, onClose, onSave,
}: {
  contact: PhoneContact | null;
  visible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phones, setPhones] = useState([{ label: 'Mobile', number: '', isPrimary: true }]);
  const [emails, setEmails] = useState([{ label: 'Home', email: '' }]);
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [whatsapp, setWhatsapp] = useState('');

  useEffect(() => {
    if (contact) {
      setFirstName(contact.firstName || '');
      setLastName(contact.lastName || '');
      setPhones(contact.phoneNumbers?.length ? contact.phoneNumbers : [{ label: 'Mobile', number: '', isPrimary: true }]);
      setEmails(contact.emails?.length ? contact.emails : [{ label: 'Home', email: '' }]);
      setCompany(contact.company || '');
      setJobTitle(contact.jobTitle || '');
      setNotes(contact.notes || '');
      setWhatsapp(contact.whatsappNumber || '');
    } else {
      setFirstName(''); setLastName('');
      setPhones([{ label: 'Mobile', number: '', isPrimary: true }]);
      setEmails([{ label: 'Home', email: '' }]);
      setCompany(''); setJobTitle(''); setNotes(''); setWhatsapp('');
    }
  }, [contact, visible]);

  const handleSave = () => {
    if (!firstName.trim()) {
      Alert.alert('Required', 'First name is required');
      return;
    }
    onSave({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      phoneNumbers: phones.filter(p => p.number.trim()),
      emails: emails.filter(e => e.email.trim()),
      company: company.trim() || undefined,
      jobTitle: jobTitle.trim() || undefined,
      notes: notes.trim() || undefined,
      whatsappNumber: whatsapp.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={fStyles.overlay}>
          <View style={fStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={fStyles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={fStyles.title}>{contact ? 'Edit Contact' : 'New Contact'}</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={fStyles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={fStyles.container} showsVerticalScrollIndicator={false}>
            <View style={fStyles.avatarSection}>
              <View style={[fStyles.avatarPlaceholder, { backgroundColor: getAvatarColor(firstName + ' ' + lastName) }]}>
                <Text style={fStyles.avatarText}>{getInitials(firstName + ' ' + lastName) || '?'}</Text>
              </View>
            </View>

            <View style={fStyles.inputGroup}>
              <TextInput style={fStyles.input} placeholder="First Name" placeholderTextColor="#475569" value={firstName} onChangeText={setFirstName} />
              <TextInput style={fStyles.input} placeholder="Last Name" placeholderTextColor="#475569" value={lastName} onChangeText={setLastName} />
            </View>

            <View style={fStyles.inputGroup}>
              <TextInput style={fStyles.input} placeholder="Company" placeholderTextColor="#475569" value={company} onChangeText={setCompany} />
              <TextInput style={fStyles.input} placeholder="Job Title" placeholderTextColor="#475569" value={jobTitle} onChangeText={setJobTitle} />
            </View>

            <View style={fStyles.section}>
              <Text style={fStyles.sectionLabel}>Phone Numbers</Text>
              {phones.map((phone, idx) => (
                <View key={idx} style={fStyles.phoneRow}>
                  <TextInput
                    style={[fStyles.input, { flex: 0.35, marginRight: 8 }]}
                    placeholder="Label"
                    placeholderTextColor="#475569"
                    value={phone.label}
                    onChangeText={t => { const n = [...phones]; n[idx].label = t; setPhones(n); }}
                  />
                  <TextInput
                    style={[fStyles.input, { flex: 1 }]}
                    placeholder="Phone Number"
                    placeholderTextColor="#475569"
                    keyboardType="phone-pad"
                    value={phone.number}
                    onChangeText={t => { const n = [...phones]; n[idx].number = t; setPhones(n); }}
                  />
                </View>
              ))}
              <TouchableOpacity onPress={() => setPhones([...phones, { label: 'Other', number: '', isPrimary: false }])} style={fStyles.addBtn}>
                <Ionicons name="add-circle" size={20} color="#2563EB" />
                <Text style={fStyles.addText}>Add Phone</Text>
              </TouchableOpacity>
            </View>

            <View style={fStyles.section}>
              <Text style={fStyles.sectionLabel}>Emails</Text>
              {emails.map((email, idx) => (
                <View key={idx} style={fStyles.phoneRow}>
                  <TextInput
                    style={[fStyles.input, { flex: 0.35, marginRight: 8 }]}
                    placeholder="Label"
                    placeholderTextColor="#475569"
                    value={email.label}
                    onChangeText={t => { const n = [...emails]; n[idx].label = t; setEmails(n); }}
                  />
                  <TextInput
                    style={[fStyles.input, { flex: 1 }]}
                    placeholder="Email"
                    placeholderTextColor="#475569"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email.email}
                    onChangeText={t => { const n = [...emails]; n[idx].email = t; setEmails(n); }}
                  />
                </View>
              ))}
              <TouchableOpacity onPress={() => setEmails([...emails, { label: 'Other', email: '' }])} style={fStyles.addBtn}>
                <Ionicons name="add-circle" size={20} color="#2563EB" />
                <Text style={fStyles.addText}>Add Email</Text>
              </TouchableOpacity>
            </View>

            <View style={fStyles.inputGroup}>
              <TextInput style={fStyles.input} placeholder="WhatsApp Number (optional)" placeholderTextColor="#475569" keyboardType="phone-pad" value={whatsapp} onChangeText={setWhatsapp} />
            </View>

            <View style={fStyles.inputGroup}>
              <TextInput style={[fStyles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Notes" placeholderTextColor="#475569" multiline value={notes} onChangeText={setNotes} />
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const fStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 0.5, borderBottomColor: '#1E293B' },
  cancelText: { color: '#94A3B8', fontSize: 16 },
  title: { color: '#fff', fontSize: 17, fontWeight: '600' },
  saveText: { color: '#2563EB', fontSize: 16, fontWeight: '600' },
  container: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 20 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '600' },
  inputGroup: { paddingHorizontal: 16, marginTop: 8 },
  input: { backgroundColor: '#1E293B', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 16, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel: { color: '#64748B', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginBottom: 8 },
  phoneRow: { flexDirection: 'row', marginBottom: 8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  addText: { color: '#2563EB', fontSize: 14, fontWeight: '500' },
});

// ─── Main Phone Screen ─────────────────────────────────────────────
export default function PhoneScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { contacts, callLogs, favorites, loading, fetchContacts, fetchCallLogs, searchContacts, addContact, updateContact, deleteContact, importContacts } = usePhoneStore();

  const [activeTab, setActiveTab] = useState<TabType>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [dialNumber, setDialNumber] = useState('');

  const [selectedContact, setSelectedContact] = useState<PhoneContact | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<PhoneContact | null>(null);

  // Load data on mount
  useEffect(() => {
    if (user?.id) {
      fetchContacts(user.id);
      fetchCallLogs(user.id);
    }
  }, [user?.id]);

  // Search
  useEffect(() => {
    if (!user?.id) return;
    if (!searchQuery.trim()) {
      fetchContacts(user.id);
      return;
    }
    const timeout = setTimeout(async () => {
      const results = await searchContacts(user.id, searchQuery);
      usePhoneStore.setState({ contacts: results });
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, user?.id]);

  // ─── Import from Phone ───────────────────────────────────────────
  const handleImport = async () => {
    try {
      const Contacts = require('expo-contacts');
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Contacts permission is required to import.');
        return;
      }
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Emails, Contacts.Fields.Company, Contacts.Fields.JobTitle],
      });
      if (data.length > 0) {
        const imported = data.map((c: any) => ({
          firstName: c.firstName || c.name?.split(' ')[0] || 'Unknown',
          lastName: c.lastName || c.name?.split(' ').slice(1).join(' ') || undefined,
          phoneNumbers: (c.phoneNumbers || []).map((p: any) => ({
            label: p.label || 'Mobile',
            number: p.number || '',
            isPrimary: p.isPrimary || false,
          })),
          emails: (c.emails || []).map((e: any) => ({
            label: e.label || 'Home',
            email: e.email || '',
          })),
          company: c.company || undefined,
          jobTitle: c.jobTitle || undefined,
          nativeContactId: c.id,
        }));
        const count = await importContacts(user!.id, imported);
        Alert.alert('Success', `Imported ${count} contacts.`);
      } else {
        Alert.alert('No Contacts', 'No contacts found on your device.');
      }
    } catch {
      Alert.alert('Import Failed', 'Could not access device contacts. Make sure expo-contacts is installed.');
    }
  };

  // ─── Save Contact ────────────────────────────────────────────────
  const handleSave = async (data: any) => {
    try {
      if (editingContact) {
        await updateContact(editingContact.id, data);
      } else {
        await addContact({ ...data, user_id: user!.id });
      }
      setShowForm(false);
      setEditingContact(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save contact');
    }
  };

  // ─── Delete ──────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try { await deleteContact(id); } catch { Alert.alert('Error', 'Failed to delete'); }
  };

  // ─── Dial Pad ────────────────────────────────────────────────────
  const handleDial = (digit: string) => setDialNumber(p => p + digit);
  const handleBackspace = () => setDialNumber(p => p.slice(0, -1));
  const handleDialCall = async () => {
    if (!dialNumber) return;
    const { addCallLog } = usePhoneStore.getState();
    await addCallLog({
      userId: user!.id,
      phoneNumber: dialNumber,
      type: 'outgoing',
      duration: 0,
      startedAt: new Date().toISOString(),
    });
    Linking.openURL(`tel:${dialNumber}`);
    setDialNumber('');
  };

  // ─── Group contacts by letter ────────────────────────────────────
  const groupedContacts = useMemo(() => {
    const sorted = [...contacts].sort((a, b) => a.firstName.localeCompare(b.firstName));
    const groups: Record<string, PhoneContact[]> = {};
    for (const c of sorted) {
      const letter = (c.firstName[0] || '#').toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(c);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [contacts]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Phone</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleImport} style={styles.headerBtn}>
            <Ionicons name="sync" size={22} color="#2563EB" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setEditingContact(null); setShowForm(true); }} style={styles.headerBtn}>
            <Ionicons name="add" size={28} color="#2563EB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#64748B" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts..."
          placeholderTextColor="#475569"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {[
          { key: 'contacts' as TabType, label: 'Contacts', icon: 'people-outline' },
          { key: 'recent' as TabType, label: 'Recent', icon: 'time-outline' },
          { key: 'favorites' as TabType, label: 'Favorites', icon: 'star-outline' },
          { key: 'keypad' as TabType, label: 'Keypad', icon: 'keypad-outline' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons name={tab.icon as any} size={18} color={activeTab === tab.key ? '#2563EB' : '#64748B'} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ─── CONTACTS TAB ─── */}
      {activeTab === 'contacts' && (
        <>
          {loading ? (
            <View style={styles.emptyState}><ActivityIndicator size="large" color="#2563EB" /></View>
          ) : contacts.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color="#1E293B" />
              <Text style={styles.emptyText}>No Contacts</Text>
              <Text style={styles.emptySubtext}>Tap + to add or sync to import from phone</Text>
            </View>
          ) : (
            <FlatList
              data={groupedContacts}
              keyExtractor={([letter]) => letter}
              showsVerticalScrollIndicator={false}
              renderItem={({ item: [letter, group] }) => (
                <View>
                  <Text style={styles.sectionHeader}>{letter}</Text>
                  {group.map(contact => (
                    <TouchableOpacity
                      key={contact.id}
                      style={styles.contactRow}
                      onPress={() => { setSelectedContact(contact); setShowDetail(true); }}
                    >
                      {contact.photoUrl ? (
                        <Image source={{ uri: contact.photoUrl }} style={styles.contactAvatar} />
                      ) : (
                        <View style={[styles.contactAvatarFallback, { backgroundColor: getAvatarColor(contact.displayName) }]}>
                          <Text style={styles.contactAvatarText}>{getInitials(contact.displayName)}</Text>
                        </View>
                      )}
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.displayName}</Text>
                        {contact.company && <Text style={styles.contactSub}>{contact.company}</Text>}
                      </View>
                      <TouchableOpacity
                        style={styles.contactAction}
                        onPress={() => {
                          const phone = getPrimaryPhone(contact);
                          if (phone) Linking.openURL(`tel:${phone}`);
                        }}
                      >
                        <Ionicons name="call-outline" size={20} color="#10B981" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          )}
        </>
      )}

      {/* ─── RECENT TAB ─── */}
      {activeTab === 'recent' && (
        <>
          {callLogs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={64} color="#1E293B" />
              <Text style={styles.emptyText}>No Recent Calls</Text>
              <Text style={styles.emptySubtext}>Your call history will appear here</Text>
            </View>
          ) : (
            <FlatList
              data={callLogs}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.callRow}
                  onPress={() => {
                    const contact = contacts.find(c => c.id === item.contactId);
                    if (contact) { setSelectedContact(contact); setShowDetail(true); }
                    else { setDialNumber(item.phoneNumber); setActiveTab('keypad'); }
                  }}
                >
                  <View style={[styles.callIconWrap, { backgroundColor: getCallIcon(item.type).color + '20' }]}>
                    <Ionicons name={getCallIcon(item.type).icon} size={18} color={getCallIcon(item.type).color} />
                  </View>
                  <View style={styles.callInfo}>
                    <Text style={[styles.callName, item.type === 'missed' && styles.callNameMissed]}>
                      {item.contactName || item.phoneNumber}
                    </Text>
                    <Text style={styles.callMeta}>
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                      {item.duration > 0 ? ` · ${formatDuration(item.duration)}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.callTime}>{formatCallTime(item.startedAt)}</Text>
                  <TouchableOpacity style={styles.callAction} onPress={() => Linking.openURL(`tel:${item.phoneNumber}`)}>
                    <Ionicons name="call" size={18} color="#10B981" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* ─── FAVORITES TAB ─── */}
      {activeTab === 'favorites' && (
        <>
          {favorites.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="star-outline" size={64} color="#1E293B" />
              <Text style={styles.emptyText}>No Favorites</Text>
              <Text style={styles.emptySubtext}>Star contacts to see them here</Text>
            </View>
          ) : (
            <FlatList
              data={favorites}
              keyExtractor={item => item.id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.favoriteRow}
                  onPress={() => { setSelectedContact(item); setShowDetail(true); }}
                >
                  <View style={[styles.favAvatar, { backgroundColor: getAvatarColor(item.displayName) }]}>
                    <Text style={styles.favAvatarText}>{getInitials(item.displayName)}</Text>
                  </View>
                  <Text style={styles.favName}>{item.displayName}</Text>
                  <TouchableOpacity
                    style={styles.favCallBtn}
                    onPress={() => {
                      const phone = getPrimaryPhone(item);
                      if (phone) Linking.openURL(`tel:${phone}`);
                    }}
                  >
                    <Ionicons name="call" size={20} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.favMsgBtn}
                    onPress={() => {
                      const phone = getPrimaryPhone(item);
                      if (phone) router.push(`/(os)/messages?phone=${encodeURIComponent(phone)}&name=${encodeURIComponent(item.displayName)}`);
                    }}
                  >
                    <Ionicons name="chatbubble" size={20} color="#2563EB" />
                  </TouchableOpacity>
                </TouchableOpacity>
              )}
            />
          )}
        </>
      )}

      {/* ─── KEYPAD TAB ─── */}
      {activeTab === 'keypad' && (
        <View style={styles.keypadContainer}>
          <View style={styles.dialDisplay}>
            <Text style={styles.dialNumber}>{formatPhoneDisplay(dialNumber)}</Text>
            {dialNumber.length > 0 && (
              <TouchableOpacity onPress={handleBackspace} style={styles.backspaceBtn}>
                <Ionicons name="backspace" size={24} color="#2563EB" />
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.dialPad}>
            {DIAL_PAD.map(btn => (
              <TouchableOpacity key={btn.digit} style={styles.dialBtn} onPress={() => handleDial(btn.digit)}>
                <Text style={styles.dialDigit}>{btn.digit}</Text>
                {btn.letters && <Text style={styles.dialLetters}>{btn.letters}</Text>}
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={handleDialCall}>
            <Ionicons name="call" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Modals */}
      <ContactDetailModal
        contact={selectedContact}
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        onEdit={(c) => { setEditingContact(c); setShowForm(true); setShowDetail(false); }}
        onDelete={handleDelete}
      />

      <ContactFormModal
        contact={editingContact}
        visible={showForm}
        onClose={() => { setShowForm(false); setEditingContact(null); }}
        onSave={handleSave}
      />
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 32, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { padding: 8 },

  // Search
  searchWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 16 },

  // Tabs
  tabBar: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#1E293B', marginHorizontal: 16 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabItemActive: { borderBottomColor: '#2563EB' },
  tabLabel: { color: '#64748B', fontSize: 12, marginTop: 4 },
  tabLabelActive: { color: '#2563EB' },

  // Empty
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -40 },
  emptyText: { color: '#64748B', fontSize: 20, fontWeight: '600', marginTop: 16 },
  emptySubtext: { color: '#475569', fontSize: 14, marginTop: 6 },

  // Contact Row
  sectionHeader: { color: '#64748B', fontSize: 13, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 6, backgroundColor: '#0B1221' },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#1E293B' },
  contactAvatar: { width: 44, height: 44, borderRadius: 22 },
  contactAvatarFallback: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  contactAvatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { color: '#fff', fontSize: 16, fontWeight: '500' },
  contactSub: { color: '#64748B', fontSize: 13, marginTop: 1 },
  contactAction: { padding: 8 },

  // Call Log
  callRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1E293B' },
  callIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  callInfo: { flex: 1 },
  callName: { color: '#fff', fontSize: 16, fontWeight: '500' },
  callNameMissed: { color: '#EF4444' },
  callMeta: { color: '#64748B', fontSize: 13, marginTop: 2 },
  callTime: { color: '#64748B', fontSize: 13, marginRight: 12 },
  callAction: { padding: 8 },

  // Favorites
  favoriteRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#1E293B' },
  favAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  favAvatarText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  favName: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '500', marginLeft: 12 },
  favCallBtn: { padding: 8, marginRight: 4 },
  favMsgBtn: { padding: 8 },

  // Keypad
  keypadContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 40 },
  dialDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 30, width: '100%' },
  dialNumber: { color: '#fff', fontSize: 36, fontWeight: '300', letterSpacing: 2 },
  backspaceBtn: { position: 'absolute', right: 30 },
  dialPad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', width: 280, gap: 12 },
  dialBtn: { width: 76, height: 76, borderRadius: 38, backgroundColor: '#1E293B', alignItems: 'center', justifyContent: 'center', margin: 4 },
  dialDigit: { color: '#fff', fontSize: 28, fontWeight: '400' },
  dialLetters: { color: '#64748B', fontSize: 10, marginTop: 2 },
  callBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', marginTop: 20 },
});
