import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePhoneStore } from '@/domains/phone/state/phoneStore';
import { useContactStore } from '@/domains/phone/state/contactStore';
import { CallLogItem } from '@/domains/phone/components/CallLogItem';
import { DialerPad } from '@/domains/phone/components/DialerPad';
import { ContactListItem } from '@/domains/phone/components/ContactListItem';
import { osShell } from '@/lib/shell/osShell';

export default function PhoneScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dialer' | 'recents' | 'contacts'>('dialer');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const { callLogs, makeCall, endCall, activeCall } = usePhoneStore();
  const { contacts, searchContacts } = useContactStore();

  useEffect(() => {
    requestPhonePermissions();
  }, []);

  const requestPhonePermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CALL_PHONE,
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
        PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
      ]);
    }
  };

  const handleDial = useCallback(() => {
    if (!phoneNumber || phoneNumber.length < 3) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number');
      return;
    }
    makeCall(phoneNumber);
    osShell.emit('phone:call:started', { number: phoneNumber });
  }, [phoneNumber, makeCall]);

  const handleContactPress = (contact: any) => {
    if (contact.phoneNumbers?.[0]) {
      setPhoneNumber(contact.phoneNumbers[0]);
      setActiveTab('dialer');
    }
  };

  const filteredContacts = searchQuery ? searchContacts(searchQuery) : contacts;
  const filteredLogs = searchQuery
    ? callLogs.filter((log) =>
        log.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.number.includes(searchQuery)
      )
    : callLogs;

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Phone</Text>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search contacts or numbers..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabBar}>
      {(['favorites', 'recents', 'contacts', 'dialer'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.tabActive]}
          onPress={() => setActiveTab(tab === 'favorites' ? 'contacts' : tab)}
        >
          <Ionicons
            name={
              tab === 'favorites'
                ? 'star'
                : tab === 'recents'
                ? 'time'
                : tab === 'contacts'
                ? 'people'
                : 'keypad'
            }
            size={22}
            color={activeTab === tab ? '#007AFF' : '#8E8E93'}
          />
          <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderDialer = () => (
    <View style={styles.dialerContainer}>
      <View style={styles.numberDisplay}>
        <Text style={styles.numberText}>{phoneNumber}</Text>
        {phoneNumber.length > 0 && (
          <TouchableOpacity onPress={() => setPhoneNumber((p) => p.slice(0, -1))}>
            <Ionicons name="backspace" size={28} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>
      <DialerPad onPress={(digit) => setPhoneNumber((p) => p + digit)} />
      <TouchableOpacity style={styles.callButton} onPress={handleDial}>
        <Ionicons name="call" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderRecents = () => (
    <FlatList
      data={filteredLogs}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CallLogItem
          log={item}
          onPress={() => {
            setPhoneNumber(item.number);
            setActiveTab('dialer');
          }}
          onLongPress={() => {
            Alert.alert('Call Options', '', [
              { text: 'Call Back', onPress: () => makeCall(item.number) },
              { text: 'Message', onPress: () => router.push(`/(os)/messages?to=${item.number}`) },
              { text: 'Delete', style: 'destructive', onPress: () => usePhoneStore.getState().deleteLog(item.id) },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>No recent calls</Text>
        </View>
      }
    />
  );

  const renderContacts = () => (
    <FlatList
      data={filteredContacts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ContactListItem
          contact={item}
          onPress={() => handleContactPress(item)}
          onCallPress={() => item.phoneNumbers?.[0] && makeCall(item.phoneNumbers[0])}
          onMessagePress={() => router.push(`/(os)/messages?to=${item.phoneNumbers?.[0]}`)}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#C7C7CC" />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No contacts found' : 'No contacts yet'}
          </Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/(os)/phone/contact-new')}
          >
            <Text style={styles.addButtonText}>Add Contact</Text>
          </TouchableOpacity>
        </View>
      }
    />
  );

  if (activeCall) {
    return (
      <View style={styles.callScreen}>
        <View style={styles.callInfo}>
          <Text style={styles.callName}>{activeCall.name || activeCall.number}</Text>
          <Text style={styles.callStatus}>{activeCall.status}</Text>
          <Text style={styles.callTimer}>{activeCall.duration}</Text>
        </View>
        <View style={styles.callActions}>
          <TouchableOpacity style={styles.callAction}>
            <Ionicons name="mic-off" size={28} color="#fff" />
            <Text style={styles.callActionLabel}>Mute</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callAction}>
            <Ionicons name="videocam" size={28} color="#fff" />
            <Text style={styles.callActionLabel}>Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.callAction}>
            <Ionicons name="add" size={28} color="#fff" />
            <Text style={styles.callActionLabel}>Add Call</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
          <Ionicons name="call" size={32} color="#fff" />
          <Text style={styles.endCallLabel}>End Call</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      {activeTab !== 'dialer' && renderTabs()}
      <View style={styles.content}>
        {activeTab === 'dialer' && renderDialer()}
        {activeTab === 'recents' && renderRecents()}
        {activeTab === 'contacts' && renderContacts()}
      </View>
      {activeTab === 'dialer' && renderTabs()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 16, paddingBottom: 12, backgroundColor: '#fff' },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#000', marginBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E5E5EA', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16, color: '#000' },
  tabBar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  tab: { alignItems: 'center', paddingHorizontal: 16 },
  tabActive: {},
  tabLabel: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  tabLabelActive: { color: '#007AFF' },
  content: { flex: 1 },
  dialerContainer: { flex: 1, justifyContent: 'flex-end', paddingBottom: 20 },
  numberDisplay: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20, paddingHorizontal: 40 },
  numberText: { fontSize: 36, fontWeight: '300', color: '#000', flex: 1, textAlign: 'center' },
  callButton: { alignSelf: 'center', width: 72, height: 72, borderRadius: 36, backgroundColor: '#34C759', justifyContent: 'center', alignItems: 'center', marginTop: 20, shadowColor: '#34C759', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#8E8E93', marginTop: 12 },
  addButton: { marginTop: 20, backgroundColor: '#007AFF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 20 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  callScreen: { flex: 1, backgroundColor: '#1C1C1E', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  callInfo: { alignItems: 'center', marginBottom: 60 },
  callName: { fontSize: 28, fontWeight: '600', color: '#fff' },
  callStatus: { fontSize: 16, color: '#8E8E93', marginTop: 8 },
  callTimer: { fontSize: 18, color: '#34C759', marginTop: 4 },
  callActions: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginBottom: 60 },
  callAction: { alignItems: 'center' },
  callActionLabel: { color: '#fff', fontSize: 12, marginTop: 6 },
  endCallButton: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'center' },
  endCallLabel: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 4 },
});
