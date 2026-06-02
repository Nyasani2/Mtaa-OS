import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContactStore } from '@/domains/phone/state/contactStore';
import { osShell } from '@/lib/shell/osShell';

export default function NewContactScreen() {
  const router = useRouter();
  const { addContact } = useContactStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!firstName && !lastName) {
      Alert.alert('Name Required', 'Please enter at least a first or last name');
      return;
    }
    if (!phone && !email) {
      Alert.alert('Contact Required', 'Please enter a phone number or email');
      return;
    }

    addContact({
      firstName,
      lastName,
      phoneNumbers: phone ? [phone] : [],
      emails: email ? [email] : [],
      company,
      notes,
    });

    osShell.emit('contact:created', { name: `${firstName} ${lastName}`.trim() });
    Alert.alert('Saved', 'Contact added successfully', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Contact</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Done</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#C7C7CC" />
          </View>
          <TouchableOpacity>
            <Text style={styles.addPhotoText}>Add Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            placeholder="First name"
            placeholderTextColor="#8E8E93"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            style={styles.input}
            placeholder="Last name"
            placeholderTextColor="#8E8E93"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="Phone"
              placeholderTextColor="#8E8E93"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="Email"
              placeholderTextColor="#8E8E93"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <View style={styles.inputRow}>
            <Ionicons name="business-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, styles.inputWithIcon]}
              placeholder="Company"
              placeholderTextColor="#8E8E93"
              value={company}
              onChangeText={setCompany}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Notes"
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  cancelText: { fontSize: 16, color: '#007AFF' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#000' },
  saveText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  form: { paddingTop: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E5E5EA', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  addPhotoText: { fontSize: 15, color: '#007AFF' },
  inputGroup: { backgroundColor: '#fff', marginBottom: 16, borderRadius: 10, marginHorizontal: 16, overflow: 'hidden' },
  input: { fontSize: 16, color: '#000', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  inputIcon: { marginLeft: 16 },
  inputWithIcon: { flex: 1, borderBottomWidth: 0 },
  notesInput: { height: 100, textAlignVertical: 'top', borderBottomWidth: 0 },
});
