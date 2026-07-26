// asis-cse-chat-v2.tsx
// v2.1: Clean conversational UI. No exposed engine internals.
// Research → Reason → Synthesize pipeline. Live web research.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, StyleSheet,
  ActivityIndicator, Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { processResponse, ResponseEngineInput } from './asis-cse-response-engine-v2';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const { width } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  role: 'user' | 'asis';
  text: string;
  timestamp: Date;
  followUp?: string[];
  sources?: string[];
  isTyping?: boolean;
}

export function ASISChat() {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'asis',
      text: "Hello! I am ASIS. I research topics on the internet, reason through the information, and give you answers based on real data. What would you like me to look into?",
      timestamp: new Date(),
      followUp: ['Who is Einstein?', 'What is photosynthesis?', 'What day is it?'],
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    const typingId = `typing-${Date.now()}`;
    setMessages((prev) => [...prev, { id: typingId, role: 'asis', text: '', timestamp: new Date(), isTyping: true }]);

    try {
      const engineInput: ResponseEngineInput = {
        query: userMsg.text,
        userId: user?.id,
        userName: user?.full_name || user?.username,
        conversationTurn: messages.length + 1,
      };

      const response = await processResponse(engineInput);

      setMessages((prev) => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, {
          id: `asis-${Date.now()}`,
          role: 'asis',
          text: response.text,
          timestamp: new Date(),
          followUp: response.followUp,
          sources: response.sources,
        }];
      });
    } catch (error) {
      setMessages((prev) => prev.filter(m => m.id !== typingId));
      setMessages((prev) => [...prev, {
        id: `asis-err-${Date.now()}`,
        role: 'asis',
        text: "I apologize, but I encountered an issue while researching. Please check your connection and try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsProcessing(false);
    }
  }, [inputText, isProcessing, messages.length, user]);

  const handleFollowUp = useCallback((text: string) => {
    setInputText(text);
    setTimeout(() => sendMessage(), 200);
  }, [sendMessage]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    if (item.isTyping) {
      return (
        <View style={[styles.messageRow, styles.asisRow]}>
          <View style={[styles.bubble, styles.asisBubble]}>
            <View style={styles.typingContainer}>
              <ActivityIndicator size="small" color="#60A5FA" />
              <Text style={styles.typingText}>Researching...</Text>
            </View>
          </View>
        </View>
      );
    }

    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.asisRow]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.asisBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.asisText]}>
            {item.text}
          </Text>
          {item.sources && item.sources.length > 0 && (
            <Text style={styles.sourceText}>Sources: {item.sources.join(', ')}</Text>
          )}
          <Text style={styles.timestamp}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {!isUser && item.followUp && item.followUp.length > 0 && (
          <View style={styles.followUpContainer}>
            {item.followUp.map((suggestion, idx) => (
              <TouchableOpacity key={idx} style={styles.followUpChip} onPress={() => handleFollowUp(suggestion)}>
                <Text style={styles.followUpText}>{suggestion}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }, [handleFollowUp]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          <View style={styles.statusDot} />
          <Text style={styles.headerTitle}>ASIS</Text>
          <Text style={styles.headerSubtitle}>Research & Reason</Text>
        </View>
      </View>

      <Animated.View style={[styles.messagesContainer, { opacity: fadeAnim }]}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      </Animated.View>

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask ASIS anything..."
            placeholderTextColor="#6B7280"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isProcessing) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isProcessing}
          >
            <Text style={styles.sendButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F0F0F' },
  header: {
    backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#2A2A2A',
    paddingHorizontal: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center',
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#F3F4F6', marginRight: 8 },
  headerSubtitle: { fontSize: 13, color: '#6B7280' },
  messagesContainer: { flex: 1 },
  messagesList: { paddingHorizontal: 16, paddingVertical: 12 },
  messageRow: { marginBottom: 12, maxWidth: width * 0.85 },
  userRow: { alignSelf: 'flex-end' },
  asisRow: { alignSelf: 'flex-start' },
  bubble: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { backgroundColor: '#2563EB', borderBottomRightRadius: 4 },
  asisBubble: { backgroundColor: '#1F2937', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#FFFFFF' },
  asisText: { color: '#E5E7EB' },
  sourceText: { fontSize: 11, color: '#9CA3AF', marginTop: 4, fontStyle: 'italic' },
  timestamp: { fontSize: 10, color: '#9CA3AF', marginTop: 4, alignSelf: 'flex-end' },
  typingContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  typingText: { color: '#60A5FA', marginLeft: 8, fontSize: 14 },
  followUpContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, marginLeft: 4 },
  followUpChip: { backgroundColor: '#374151', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 6, borderWidth: 1, borderColor: '#4B5563' },
  followUpText: { color: '#93C5FD', fontSize: 12 },
  inputContainer: { backgroundColor: '#1A1A1A', borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingHorizontal: 16, paddingTop: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'flex-end', backgroundColor: '#262626', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6, minHeight: 44 },
  input: { flex: 1, color: '#F3F4F6', fontSize: 15, maxHeight: 100, paddingTop: 8, paddingBottom: 8 },
  sendButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', marginLeft: 8, marginBottom: 2 },
  sendButtonDisabled: { backgroundColor: '#374151' },
  sendButtonText: { color: '#FFFFFF', fontSize: 18, fontWeight: '600' },
});
