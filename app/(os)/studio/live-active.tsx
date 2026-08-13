// @ts-nocheck
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useMLiveStreams, useMComments } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function LiveActiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const { data: stream, loadOne, chat, subscribeChat, sendChat, loading } = useMLiveStreams();
  const [message, setMessage] = useState('');
  const [superChatAmount, setSuperChatAmount] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) {
      loadOne(id);
      const unsub = subscribeChat(id);
      return unsub;
    }
  }, [id]);

  const handleSend = async () => {
    if (!message.trim() || !user?.id || !id) return;
    const amount = parseFloat(superChatAmount);
    await sendChat(id, user.id, message.trim(), amount > 0, amount);
    setMessage('');
    setSuperChatAmount('');
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#0a0a0a' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Stream Info */}
      <View style={{ padding: 16, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }} numberOfLines={1}>{stream?.title || 'Live Stream'}</Text>
        <Text style={{ color: '#888', fontSize: 13, marginTop: 4 }}>{stream?.current_viewers || 0} viewers • {stream?.studio_name || ''}</Text>
      </View>

      {/* Chat */}
      <FlatList
        ref={listRef}
        data={chat}
        keyExtractor={item => item.id}
        inverted
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12 }}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start' }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: item.is_super_chat ? '#ff0000' : '#333', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
              <Text style={{ color: '#fff', fontSize: 10 }}>{item.full_name?.[0]?.toUpperCase() || '?'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: item.is_super_chat ? '#ff6b6b' : '#888', fontSize: 11, fontWeight: '600' }}>
                {item.full_name || 'Anonymous'} {item.is_super_chat && `• KES ${item.super_chat_amount}`}
              </Text>
              <Text style={{ color: '#fff', fontSize: 13, marginTop: 2 }}>{item.message}</Text>
            </View>
          </View>
        )}
      />

      {/* Input */}
      <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#222', backgroundColor: '#111' }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          <TextInput
            value={superChatAmount}
            onChangeText={setSuperChatAmount}
            placeholder="Super Chat KES"
            placeholderTextColor="#555"
            keyboardType="numeric"
            style={{ flex: 0.4, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 10, color: '#ff6b6b', fontSize: 13 }}
          />
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Say something..."
            placeholderTextColor="#555"
            style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 10, color: '#fff', fontSize: 14 }}
          />
          <TouchableOpacity onPress={handleSend} style={{ backgroundColor: '#ff0000', borderRadius: 8, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
