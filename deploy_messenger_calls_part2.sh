#!/bin/bash
cd ~/MTAA_OS_V10

# ============================================
# STEP 6 — CALLS LAYOUT
# ============================================

cat << 'EOF' > app/\(calls\)/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function CallsLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="history/index" />
        <Stack.Screen name="dialer/index" />
        <Stack.Screen name="voicemail/index" />
        <Stack.Screen name="active/[id]" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
EOF

# ============================================
# STEP 7 — CALLS HOME (History + Active Calls)
# ============================================

cat << 'EOF' > app/\(calls\)/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Ionicons } from '@expo/vector-icons';

interface CallLog {
  id: string;
  call_id: string;
  direction: string;
  contact_name: string;
  contact_avatar: string;
  is_video: boolean;
  duration_seconds: number;
  status: string;
  started_at: string;
}

export default function CallsHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [activeCalls, setActiveCalls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'missed' | 'incoming' | 'outgoing'>('all');

  const fetchCalls = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('call_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setCalls(data || []);
    setLoading(false);
  }, [user]);

  const fetchActiveCalls = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('calls')
      .select('*, participants:call_participants(*)')
      .eq('status', 'connected')
      .eq('participants.user_id', user.id);
    setActiveCalls(data || []);
  }, [user]);

  useEffect(() => {
    fetchCalls();
    fetchActiveCalls();
  }, [fetchCalls, fetchActiveCalls]);

  const filteredCalls = calls.filter(c => filter === 'all' || c.direction === filter || (filter === 'missed' && c.status === 'missed'));

  const getCallIcon = (direction: string, isVideo: boolean) => {
    if (isVideo) return direction === 'incoming' ? 'videocam' : 'videocam-outline';
    return direction === 'incoming' ? 'call' : 'call-outline';
  };

  const getCallColor = (direction: string, status: string) => {
    if (status === 'missed') return '#EF4444';
    if (direction === 'incoming') return '#10B981';
    return '#3B82F6';
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderCallItem = ({ item }: { item: CallLog }) => (
    <TouchableOpacity
      onPress={() => router.push(`/calls/active/${item.call_id}`)}
      className="flex-row items-center p-4 bg-white border-b border-gray-100 active:bg-gray-50"
    >
      <View className="relative">
        <Image
          source={{ uri: item.contact_avatar || 'https://via.placeholder.com/48' }}
          className="w-12 h-12 rounded-full"
        />
        <View
          className="absolute -bottom-1 -right-1 rounded-full p-0.5"
          style={{ backgroundColor: getCallColor(item.direction, item.status) }}
        >
          <Ionicons
            name={getCallIcon(item.direction, item.is_video)}
            size={10}
            color="white"
          />
        </View>
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-center">
          <Text className={`font-semibold text-base ${item.status === 'missed' ? 'text-red-600' : 'text-gray-900'}`}>
            {item.contact_name || 'Unknown'}
          </Text>
          <Text className="text-xs text-gray-400">
            {new Date(item.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View className="flex-row items-center mt-1">
          <Ionicons
            name={item.direction === 'incoming' ? 'arrow-down' : 'arrow-up'}
            size={12}
            color={getCallColor(item.direction, item.status)}
          />
          <Text className="text-sm text-gray-500 ml-1 capitalize">
            {item.status === 'missed' ? 'Missed call' : `${item.direction} call`}
          </Text>
          {item.duration_seconds > 0 && (
            <Text className="text-sm text-gray-400 ml-2">• {formatDuration(item.duration_seconds)}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => router.push(`/calls/dialer?call=${item.call_id}`)}
        className="ml-2 w-10 h-10 bg-green-100 rounded-full items-center justify-center"
      >
        <Ionicons name="call" size={18} color="#10B981" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-900 px-4 pt-12 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-2xl font-bold">Calls</Text>
          <TouchableOpacity onPress={() => router.push('/calls/dialer')}>
            <Ionicons name="keypad" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View className="flex-row px-4 py-3 bg-white/10 rounded-xl">
          {[{ key: 'all', label: 'All' }, { key: 'missed', label: 'Missed' }, { key: 'incoming', label: 'Incoming' }, { key: 'outgoing', label: 'Outgoing' }].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key as any)}
              className={`flex-1 py-2 rounded-lg mx-1 ${filter === f.key ? 'bg-white' : ''}`}
            >
              <Text className={`text-center text-sm font-medium ${filter === f.key ? 'text-blue-900' : 'text-white'}`}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeCalls.length > 0 && (
        <View className="bg-green-50 px-4 py-3 border-b border-green-200">
          <Text className="text-green-800 font-semibold mb-2">Active Calls</Text>
          {activeCalls.map((call) => (
            <TouchableOpacity
              key={call.id}
              onPress={() => router.push(`/calls/active/${call.id}`)}
              className="flex-row items-center bg-white p-3 rounded-xl mb-2"
            >
              <View className="w-3 h-3 bg-green-500 rounded-full mr-3 animate-pulse" />
              <Text className="flex-1 text-gray-800 font-medium">Ongoing call...</Text>
              <Text className="text-green-600 font-semibold">Join</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <FlatList
        data={filteredCalls}
        renderItem={renderCallItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="call" size={64} color="#E5E7EB" />
            <Text className="text-gray-400 mt-4 text-lg">No calls yet</Text>
          </View>
        }
      />

      <TouchableOpacity
        onPress={() => router.push('/calls/dialer')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-green-600 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="call" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
EOF

# ============================================
# STEP 8 — DIALER SCREEN
# ============================================

cat << 'EOF' > app/\(calls\)/dialer/index.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function DialerScreen() {
  const router = useRouter();
  const [number, setNumber] = useState('');

  const dialPad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ];

  const handlePress = (digit: string) => {
    setNumber(prev => prev + digit);
  };

  const handleDelete = () => {
    setNumber(prev => prev.slice(0, -1));
  };

  const handleCall = async () => {
    if (!number.trim()) return;
    // Initiate call via Supabase
    router.push(`/calls/active/new?number=${encodeURIComponent(number)}`);
  };

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-1 justify-end pb-8">
        <View className="px-8 mb-8">
          <Text className="text-white text-4xl font-light text-center" selectable>
            {number || 'Enter number'}
          </Text>
        </View>

        <View className="px-12">
          {dialPad.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row justify-between mb-4">
              {row.map((digit) => (
                <TouchableOpacity
                  key={digit}
                  onPress={() => handlePress(digit)}
                  className="w-20 h-20 rounded-full bg-gray-800 items-center justify-center active:bg-gray-700"
                >
                  <Text className="text-white text-2xl font-semibold">{digit}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <View className="flex-row justify-center items-center mt-6 px-12">
          <TouchableOpacity
            onPress={handleCall}
            className="w-20 h-20 rounded-full bg-green-500 items-center justify-center shadow-lg"
          >
            <Ionicons name="call" size={32} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            className="absolute right-12 w-14 h-14 rounded-full bg-gray-800 items-center justify-center"
          >
            <Ionicons name="backspace" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
EOF

# ============================================
# STEP 9 — ACTIVE CALL SCREEN
# ============================================

cat << 'EOF' > app/\(calls\)/active/\[id\].tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Ionicons } from '@expo/vector-icons';

export default function ActiveCallScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [call, setCall] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const fetchCall = async () => {
      const { data } = await supabase.from('calls').select('*, participants:call_participants(*)').eq('id', id).single();
      setCall(data);
    };
    fetchCall();

    const interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    await supabase.from('calls').update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      duration_seconds: duration
    }).eq('id', id);
    router.back();
  };

  const handleToggleMute = () => setIsMuted(!isMuted);
  const handleToggleVideo = () => setIsVideoEnabled(!isVideoEnabled);
  const handleToggleSpeaker = () => setIsSpeakerOn(!isSpeakerOn);
  const handleToggleRecord = () => setIsRecording(!isRecording);

  const otherParticipant = call?.participants?.find((p: any) => p.user_id !== user?.id);

  return (
    <View className="flex-1 bg-gray-900">
      <View className="flex-1 items-center justify-center px-8">
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }} className="mb-8">
          <Image
            source={{ uri: otherParticipant?.avatar || 'https://via.placeholder.com/120' }}
            className="w-32 h-32 rounded-full border-4 border-white/20"
          />
        </Animated.View>

        <Text className="text-white text-2xl font-semibold mb-2">
          {otherParticipant?.name || 'Unknown'}
        </Text>
        <Text className="text-gray-400 text-lg">
          {call?.call_type === 'video' ? 'Video call' : 'Voice call'}
        </Text>
        <Text className="text-gray-500 text-base mt-2 font-mono">
          {formatDuration(duration)}
        </Text>

        {call?.is_encrypted && (
          <View className="flex-row items-center mt-4 bg-green-500/20 px-4 py-2 rounded-full">
            <Ionicons name="lock-closed" size={14} color="#10B981" />
            <Text className="text-green-400 text-sm ml-2">End-to-end encrypted</Text>
          </View>
        )}
      </View>

      <View className="px-8 pb-12">
        <View className="flex-row justify-between mb-8">
          <TouchableOpacity
            onPress={handleToggleMute}
            className={`w-16 h-16 rounded-full items-center justify-center ${isMuted ? 'bg-red-500' : 'bg-gray-700'}`}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleVideo}
            className={`w-16 h-16 rounded-full items-center justify-center ${!isVideoEnabled ? 'bg-red-500' : 'bg-gray-700'}`}
          >
            <Ionicons name={isVideoEnabled ? 'videocam' : 'videocam-off'} size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleSpeaker}
            className={`w-16 h-16 rounded-full items-center justify-center ${isSpeakerOn ? 'bg-blue-500' : 'bg-gray-700'}`}
          >
            <Ionicons name={isSpeakerOn ? 'volume-high' : 'volume-medium'} size={28} color="white" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleRecord}
            className={`w-16 h-16 rounded-full items-center justify-center ${isRecording ? 'bg-red-500' : 'bg-gray-700'}`}
          >
            <Ionicons name={isRecording ? 'stop' : 'radio-button-on'} size={28} color="white" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleEndCall}
          className="w-full h-16 bg-red-500 rounded-full items-center justify-center shadow-lg"
        >
          <Ionicons name="call" size={32} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
EOF

# ============================================
# STEP 10 — VOICEMAIL SCREEN
# ============================================

cat << 'EOF' > app/\(calls\)/voicemail/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface Voicemail {
  id: string;
  sender_id: string;
  audio_url: string;
  duration_seconds: number;
  transcript: string;
  is_listened: boolean;
  created_at: string;
}

export default function VoicemailScreen() {
  const { user } = useAuthStore();
  const [voicemails, setVoicemails] = useState<Voicemail[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const fetchVoicemails = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('voicemails')
      .select('*')
      .eq('recipient_id', user.id)
      .order('created_at', { ascending: false });
    setVoicemails(data || []);
  }, [user]);

  useEffect(() => { fetchVoicemails(); }, [fetchVoicemails]);

  const playVoicemail = async (vm: Voicemail) => {
    if (playingId === vm.id) {
      await sound?.stopAsync();
      setPlayingId(null);
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync({ uri: vm.audio_url });
    setSound(newSound);
    setPlayingId(vm.id);
    await newSound.playAsync();

    if (!vm.is_listened) {
      await supabase.from('voicemails').update({ is_listened: true, listened_at: new Date().toISOString() }).eq('id', vm.id);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-900 px-4 pt-12 pb-4">
        <Text className="text-white text-2xl font-bold">Voicemail</Text>
        <Text className="text-blue-300 text-sm mt-1">{voicemails.filter(v => !v.is_listened).length} new</Text>
      </View>

      <FlatList
        data={voicemails}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => playVoicemail(item)}
            className="flex-row items-center p-4 bg-white border-b border-gray-100"
          >
            <View className={`w-12 h-12 rounded-full items-center justify-center ${item.is_listened ? 'bg-gray-100' : 'bg-blue-100'}`}>
              <Ionicons
                name={playingId === item.id ? 'pause' : 'play'}
                size={24}
                color={item.is_listened ? '#6B7280' : '#2563EB'}
              />
            </View>
            <View className="flex-1 ml-3">
              <Text className={`font-semibold ${item.is_listened ? 'text-gray-600' : 'text-gray-900'}`}>
                From: {item.sender_id.slice(0, 8)}...
              </Text>
              <Text className="text-sm text-gray-500 mt-1">{formatDuration(item.duration_seconds || 0)}</Text>
              {item.transcript && (
                <Text className="text-xs text-gray-400 mt-1 italic" numberOfLines={2}>{item.transcript}</Text>
              )}
            </View>
            {!item.is_listened && <View className="w-3 h-3 bg-blue-600 rounded-full" />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="mail-open" size={64} color="#E5E7EB" />
            <Text className="text-gray-400 mt-4">No voicemails</Text>
          </View>
        }
      />
    </View>
  );
}
EOF

# ============================================
# STEP 11 — MESSENGER CONTACTS SCREEN
# ============================================

cat << 'EOF' > app/\(messenger\)/contacts/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Ionicons } from '@expo/vector-icons';

interface Contact {
  id: string;
  contact_user_id: string;
  name: string;
  phone_number: string;
  avatar_url: string;
  is_favorite: boolean;
  is_blocked: boolean;
  contact_source: string;
}

export default function ContactsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchContacts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_contacts')
      .select('*')
      .eq('owner_id', user.id)
      .eq('is_blocked', false)
      .order('is_favorite', { ascending: false })
      .order('name');
    setContacts(data || []);
  }, [user]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  const startConversation = async (contactId: string) => {
    // Check if conversation exists
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user?.id)
      .eq('conversation.type', 'direct');

    // For simplicity, create new conversation
    const { data: conv } = await supabase.from('conversations').insert({
      type: 'direct',
      created_by: user?.id,
      is_encrypted: true
    }).select('id').single();

    if (conv) {
      await supabase.from('conversation_participants').insert([
        { conversation_id: conv.id, user_id: user?.id, role: 'owner' },
        { conversation_id: conv.id, user_id: contactId, role: 'member' }
      ]);
      router.push(`/messenger/chat/${conv.id}`);
    }
  };

  const filtered = contacts.filter(c =>
    !searchQuery || c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone_number?.includes(searchQuery)
  );

  const renderContact = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      onPress={() => startConversation(item.contact_user_id)}
      className="flex-row items-center p-4 bg-white border-b border-gray-100 active:bg-gray-50"
    >
      <Image
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/48' }}
        className="w-12 h-12 rounded-full"
      />
      <View className="flex-1 ml-3">
        <Text className="font-semibold text-gray-900 text-base">{item.name}</Text>
        <Text className="text-sm text-gray-500">{item.phone_number}</Text>
      </View>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={() => router.push(`/calls/dialer?contact=${item.contact_user_id}`)}
          className="w-10 h-10 bg-green-100 rounded-full items-center justify-center"
        >
          <Ionicons name="call" size={18} color="#10B981" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => startConversation(item.contact_user_id)}
          className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center"
        >
          <Ionicons name="chatbubble" size={18} color="#3B82F6" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-900 px-4 pt-12 pb-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-bold">Contacts</Text>
        </View>
        <View className="flex-row items-center bg-white/20 rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color="white" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search contacts..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            className="flex-1 ml-2 text-white"
          />
        </View>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="people" size={64} color="#E5E7EB" />
            <Text className="text-gray-400 mt-4">No contacts yet</Text>
          </View>
        }
      />
    </View>
  );
}
EOF

echo "Part 2 complete: Calls Layout + Home + Dialer + Active Call + Voicemail + Contacts"
