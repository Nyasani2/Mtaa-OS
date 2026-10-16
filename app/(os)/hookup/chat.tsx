import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert, Share
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import {
  sendMessage, getMessages, subscribeToMessages
} from '@/lib/hookup/chat/hookup-chat-engine';
import {
  encryptMessage, decryptMessage
} from '@/lib/hookup/encryption/hookup-encryption-engine';
import { generateRoomKey } from '@/lib/hookup/encryption/hookup-key-manager';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'file';
  created_at: string;
  is_mine: boolean;
}

export default function HookupChatScreen() {
  const router = useRouter();
  const { recipientId } = useLocalSearchParams<{ recipientId: string }>();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [matchProfile, setMatchProfile] = useState<any>(null);
  const [showMediaOptions, setShowMediaOptions] = useState(false);

  const conversationId = [user?.id, recipientId].sort().join('-');
  const roomKey = generateRoomKey(user?.id || '', recipientId || '');

  useEffect(() => {
    if (!user?.id || !recipientId) return;
    loadChat();
    
    const subscription = subscribeToMessages(conversationId, (newMsg: any) => {
      const decryptedContent = decryptMessage(newMsg.content, roomKey);
      setMessages(prev => {
        if (prev.some(m => m.id === newMsg.id)) return prev;
        return [...prev, {
          id: newMsg.id,
          sender_id: newMsg.sender_id,
          content: decryptedContent,
          media_url: newMsg.media_url,
          media_type: newMsg.media_type,
          created_at: newMsg.created_at,
          is_mine: newMsg.sender_id === user.id,
        }];
      });
    });
    return () => { supabase.removeChannel(subscription); };
  }, [user?.id, recipientId, conversationId, roomKey]);

  const loadChat = async () => {
    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('hookup_profiles')
        .select('display_name, photos, age, videos')
        .eq('user_id', recipientId)
        .single();
      setMatchProfile(profile);

      const data = await getMessages(conversationId);
      const mapped = (data || []).map((m: any) => ({
        id: m.id,
        sender_id: m.sender_id,
        content: decryptMessage(m.content, roomKey),
        media_url: m.media_url,
        media_type: m.media_type,
        created_at: m.created_at,
        is_mine: m.sender_id === user?.id,
      }));
      setMessages(mapped);
    } catch (err) {
      console.error('Chat load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !user?.id || sending) return;
    setSending(true);
    try {
      const encryptedContent = encryptMessage(inputText.trim(), roomKey);
      await sendMessage(conversationId, user.id, encryptedContent);
      setInputText('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  }, [inputText, user?.id, sending, conversationId, roomKey]);

  const handleSendMedia = async (uri: string, type: 'image' | 'video') => {
    if (!user?.id) return;
    setSending(true);
    try {
      const fileName = `${user.id}-${Date.now()}.${type === 'image' ? 'jpg' : 'mp4'}`;
      const response = await fetch(uri);
      const blob = await response.blob();
      const { error: uploadError } = await supabase.storage
        .from('hookup-chat-media')
        .upload(fileName, blob, { contentType: type === 'image' ? 'image/jpeg' : 'video/mp4' });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('hookup-chat-media').getPublicUrl(fileName);
      const encryptedContent = encryptMessage(`[Media: ${type}]`, roomKey);
      await sendMessage(conversationId, user.id, encryptedContent, urlData.publicUrl, type);
      setShowMediaOptions(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send media');
    } finally {
      setSending(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      handleSendMedia(result.assets[0].uri, 'image');
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      handleSendMedia(result.assets[0].uri, 'video');
    }
  };

  const startVideoCall = () => {
    Alert.alert('Video Call', `Calling ${matchProfile?.display_name || 'Match'}...`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: () => {
        // Integrate with WebRTC or third-party service
        Alert.alert('Video Call Started', 'Connecting...');
      }}
    ]);
  };

  const startVoiceCall = () => {
    Alert.alert('Voice Call', `Calling ${matchProfile?.display_name || 'Match'}...`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: () => {
        Alert.alert('Voice Call Started', 'Connecting...');
      }}
    ]);
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.is_mine ? styles.myMessageRow : styles.theirMessageRow]}>
      <View style={[styles.bubble, item.is_mine ? styles.myBubble : styles.theirBubble]}>
        {item.media_url && item.media_type === 'image' && (
          <Image source={{ uri: item.media_url }} style={styles.mediaImage} />
        )}
        {item.media_url && item.media_type === 'video' && (
          <View style={styles.mediaVideo}>
            <Feather name="play-circle" size={48} color="#fff" />
            <Text style={styles.videoText}>Video</Text>
          </View>
        )}
        {item.content && !item.content.startsWith('[Media:') && (
          <Text style={[styles.messageText, item.is_mine ? styles.myMessageText : styles.theirMessageText]}>
            {item.content}
          </Text>
        )}
        <Text style={[styles.timeText, item.is_mine ? styles.myTimeText : styles.theirTimeText]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#ff3366" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.headerInfo}
          onPress={() => router.push(`/(os)/hookup/profile-detail?id=${recipientId}` as any)}
        >
          <Image
            source={{ uri: matchProfile?.photos?.[0] || undefined }}
            style={styles.headerAvatar}
          />
          <View>
            <Text style={styles.headerName}>{matchProfile?.display_name || 'Match'}</Text>
            {matchProfile?.age && <Text style={styles.headerAge}>Age: {matchProfile.age}</Text>}
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={startVoiceCall} style={styles.headerActionBtn}>
            <Feather name="phone" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={startVideoCall} style={styles.headerActionBtn}>
            <Feather name="video" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Feather name="message-circle" size={48} color="#333" />
            <Text style={styles.emptyText}>No messages yet. Say hello!</Text>
          </View>
        }
      />

      {/* Media Options */}
      {showMediaOptions && (
        <View style={styles.mediaOptions}>
          <TouchableOpacity style={styles.mediaOptionBtn} onPress={pickImage}>
            <Feather name="image" size={24} color="#fff" />
            <Text style={styles.mediaOptionText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaOptionBtn} onPress={pickVideo}>
            <Feather name="video" size={24} color="#fff" />
            <Text style={styles.mediaOptionText}>Video</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.mediaOptionBtn, { backgroundColor: '#666' }]} onPress={() => setShowMediaOptions(false)}>
            <Feather name="x" size={24} color="#fff" />
            <Text style={styles.mediaOptionText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.attachBtn}
            onPress={() => setShowMediaOptions(!showMediaOptions)}
          >
            <Feather name="plus" size={24} color="#888" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#666"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Feather name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#2a2a2a'
  },
  headerBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, marginHorizontal: 12 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2a2a2a', marginRight: 10 },
  headerName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  headerAge: { color: '#888', fontSize: 12, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ff3366', justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, paddingBottom: 20 },
  messageRow: { marginBottom: 12, flexDirection: 'row' },
  myMessageRow: { justifyContent: 'flex-end' },
  theirMessageRow: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  myBubble: { backgroundColor: '#ff3366', borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: '#1a1a1a', borderBottomLeftRadius: 4 },
  mediaImage: { width: 200, height: 200, borderRadius: 12, marginBottom: 8 },
  mediaVideo: { width: 200, height: 150, backgroundColor: '#333', borderRadius: 12, marginBottom: 8, justifyContent: 'center', alignItems: 'center' },
  videoText: { color: '#fff', marginTop: 8, fontSize: 12 },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#fff' },
  theirMessageText: { color: '#e2e8f0' },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  myTimeText: { color: 'rgba(255,255,255,0.7)' },
  theirTimeText: { color: '#666' },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 15, marginTop: 12 },
  mediaOptions: { flexDirection: 'row', justifyContent: 'center', gap: 16, padding: 12, backgroundColor: '#1a1a1a' },
  mediaOptionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ff3366', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  mediaOptionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10,
    backgroundColor: '#1a1a1a', borderTopWidth: 1, borderTopColor: '#2a2a2a'
  },
  attachBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  input: {
    flex: 1, backgroundColor: '#0a0a0a', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15,
    maxHeight: 100, borderWidth: 1, borderColor: '#2a2a2a'
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#ff3366',
    justifyContent: 'center', alignItems: 'center'
  },
  sendBtnDisabled: { backgroundColor: '#333' },
});
