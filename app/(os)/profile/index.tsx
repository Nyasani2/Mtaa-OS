import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useIdentity } from '@/lib/auth/identity-provider';
import { hasPin, clearPin } from '@/lib/security/pin-engine';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, signOut } = useAuthStore();
  const { identity } = useIdentity();
  const [pinSet, setPinSet] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    const hasPinSet = await hasPin();
    setPinSet(hasPinSet);
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              await clearPin();
              router.replace('/auth/login');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const menuItems = [
    { icon: 'create-outline', label: 'Edit Profile', route: '/(os)/profile/edit', color: '#3b82f6' },
    { icon: 'shield-checkmark-outline', label: 'Privacy & Security', route: '/(os)/profile/privacy', color: '#10b981' },
    { icon: 'trophy-outline', label: 'Achievements', route: '/(os)/profile/achievements', color: '#f59e0b' },
    { icon: 'briefcase-outline', label: 'Professional', route: '/(os)/profile/professional', color: '#8b5cf6' },
    { icon: 'folder-outline', label: 'Portfolio', route: '/(os)/profile/portfolio', color: '#f97316' },
    { icon: 'cash-outline', label: 'Earnings', route: '/(os)/profile/earnings', color: '#10b981' },
    { icon: 'people-outline', label: 'Family', route: '/(os)/profile/family', color: '#ef4444' },
    { icon: 'qr-code-outline', label: 'QR Code', route: '/(os)/profile/qr-code', color: '#06b6d4' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f0f0f' }}>
      <View style={{ alignItems: 'center', paddingTop: 60, paddingBottom: 20 }}>
        <View style={{
          width: 100, height: 100, borderRadius: 50, backgroundColor: '#1a1a1a',
          justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#333'
        }}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={{ width: 100, height: 100, borderRadius: 50 }} />
          ) : (
            <Ionicons name="person" size={50} color="#666" />
          )}
        </View>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 12 }}>
          {profile?.display_name || profile?.full_name || 'User'}
        </Text>
        <Text style={{ color: '#888', fontSize: 14, marginTop: 4 }}>
          @{profile?.username || 'username'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, marginHorizontal: 16, backgroundColor: '#1a1a1a', borderRadius: 12 }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>0</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Posts</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>0</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Followers</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>0</Text>
          <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Following</Text>
        </View>
      </View>

      <View style={{ marginTop: 16, marginHorizontal: 16, backgroundColor: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => router.push(item.route as any)}
            style={{
              flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
              paddingVertical: 14, borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
              borderBottomColor: '#2a2a2a'
            }}
          >
            <Ionicons name={item.icon as any} size={22} color={item.color} style={{ width: 28 }} />
            <Text style={{ color: '#fff', fontSize: 15, flex: 1, marginLeft: 12 }}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#666" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 16, marginHorizontal: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="lock-closed-outline" size={22} color={pinSet ? '#10b981' : '#ef4444'} />
            <Text style={{ color: '#fff', fontSize: 15, marginLeft: 12 }}>
              App PIN {pinSet ? 'Enabled' : 'Not Set'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/(os)/settings/pin' as any)}
            style={{ backgroundColor: pinSet ? '#10b98120' : '#ef444420', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 }}
          >
            <Text style={{ color: pinSet ? '#10b981' : '#ef4444', fontSize: 12, fontWeight: '600' }}>
              {pinSet ? 'Change' : 'Set Up'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleSignOut}
        style={{
          marginHorizontal: 16, marginTop: 16, marginBottom: 40,
          backgroundColor: '#1a1a1a', borderRadius: 12, paddingVertical: 16,
          alignItems: 'center'
        }}
      >
        <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '600' }}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
