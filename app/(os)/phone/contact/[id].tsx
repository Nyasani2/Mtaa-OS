// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, Linking, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchContact();
  }, [id]);

  const fetchContact = async () => {
    try {
      const { data, error } = await supabase
        .from('phone_contacts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      setContact(data);
    } catch (err) {
      console.error('Fetch contact error:', err);
      Alert.alert('Error', 'Failed to load contact details.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleCall = () => {
    if (contact?.phone) Linking.openURL(`tel:${contact.phone}`);
  };

  const handleSMS = () => {
    if (contact?.phone) Linking.openURL(`sms:${contact.phone}`);
  };

  const handleMTAAMessage = () => {
    if (contact?.phone) {
      // Deep link to MTAA Chat with this phone number
      router.push(`/(os)/messages?recipientPhone=${contact.phone}` as any);
    }
  };

  const handleSendMoney = () => {
    if (contact?.phone) {
      // Deep link to Wallet Transfer with this phone number pre-filled
      router.push(`/(os)/wallet/transfer?recipient=${contact.phone}` as any);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.from('phone_contacts').delete().eq('id', id);
              Alert.alert('Success', 'Contact deleted.');
              router.back();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete contact.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.loadingText}>Loading contact...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!contact) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Contact not found.</Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initial = (contact.name || '?')[0].toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Contact</Text>
          <TouchableOpacity onPress={() => router.push(`/phone/contact-new?id=${id}` as any)} style={styles.iconBtn}>
            <Ionicons name="create-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.largeAvatar}>
            {contact.avatar ? (
              <Image source={{ uri: contact.avatar }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.largeAvatarText}>{initial}</Text>
            )}
          </View>
          <Text style={styles.name}>{contact.name || 'Unknown'}</Text>
          <Text style={styles.phone}>{contact.phone || 'No phone number'}</Text>
        </View>

        {/* MTAA Super-App Actions (The Differentiator) */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleMTAAMessage}>
            <View style={[styles.actionIcon, { backgroundColor: '#8b5cf6' }]}>
              <Ionicons name="chatbubbles" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>MTAA Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={handleSendMoney}>
            <View style={[styles.actionIcon, { backgroundColor: '#10b981' }]}>
              <Ionicons name="cash" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Send Money</Text>
          </TouchableOpacity>
        </View>

        {/* Native Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
            <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="call" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionBtn} onPress={handleSMS}>
            <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="chatbubble" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>SMS</Text>
          </TouchableOpacity>
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Ionicons name="phone-portrait" size={20} color="#888" />
            <Text style={styles.detailText}>{contact.phone || 'Not provided'}</Text>
          </View>
          {contact.email && (
            <View style={styles.detailRow}>
              <Ionicons name="mail" size={20} color="#888" />
              <Text style={styles.detailText}>{contact.email}</Text>
            </View>
          )}
          {contact.address && (
            <View style={styles.detailRow}>
              <Ionicons name="location" size={20} color="#888" />
              <Text style={styles.detailText}>{contact.address}</Text>
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color="#ef4444" />
          <Text style={styles.deleteText}>Delete Contact</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888', fontSize: 16 },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 16 },
  backBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  content: { padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  iconBtn: { padding: 8 },
  profileSection: { alignItems: 'center', marginBottom: 32 },
  largeAvatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  largeAvatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  name: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 4 },
  phone: { color: '#888', fontSize: 16 },
  actionsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 24 },
  actionBtn: { alignItems: 'center' },
  actionIcon: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  detailsSection: { backgroundColor: '#161b22', borderRadius: 16, padding: 16, marginBottom: 24 },
  sectionTitle: { color: '#888', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#21262d' },
  detailText: { color: '#fff', fontSize: 16, marginLeft: 16, flex: 1 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 16, borderRadius: 12, gap: 8, marginBottom: 20 },
  deleteText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
});
