import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, ScrollView, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface ChatMessage {
  id: string;
  role: 'user' | 'asis';
  text: string;
  timestamp: Date;
}

export default function AsisStudioAssistantScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'asis',
      text: `Welcome to ASIS Studio Assistant. I can help you with:

` +
        `• Scriptwriting and storyboarding
` +
        `• Thumbnail optimization
` +
        `• Title and tag suggestions
` +
        `• Analytics interpretation
` +
        `• Content strategy

` +
        `What are you working on today?`,
      timestamp: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses = [
        `I have analyzed your request. Here are 3 suggestions for your next video:

` +
        `1. Focus on trending topics in your niche
` +
        `2. Use high-contrast thumbnails with faces
` +
        `3. Post during peak hours (6-9 PM)`,
        `Based on your analytics, your audience engagement peaks on weekends. ` +
        `Consider scheduling your premium content for Saturday mornings.`,
        `I have generated a script outline for you. It includes a hook in the first 5 seconds, ` +
        `3 key points, and a strong call-to-action at the end.`,
      ];
      const asisMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'asis',
        text: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, asisMsg]);
      setIsTyping(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 1500);
  };

  const quickActions = [
    { icon: 'create-outline', label: 'Write Script', prompt: 'Help me write a video script about ' },
    { icon: 'image-outline', label: 'Thumbnails', prompt: 'Analyze my thumbnails and suggest improvements' },
    { icon: 'trending-up-outline', label: 'Analytics', prompt: 'Interpret my channel analytics' },
    { icon: 'pricetag-outline', label: 'Tags', prompt: 'Suggest SEO tags for my video about ' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Ionicons name="sparkles" size={20} color="#A78BFA" />
          <Text style={styles.headerTitle}>ASIS Studio</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.asisBubble,
            ]}
          >
            <Text style={msg.role === 'user' ? styles.userText : styles.asisText}>
              {msg.text}
            </Text>
          </View>
        ))}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>ASIS is thinking...</Text>
          </View>
        )}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
        {quickActions.map((action, i) => (
          <TouchableOpacity
            key={i}
            style={styles.quickActionBtn}
            onPress={() => { setInput(action.prompt); }}
          >
            <Ionicons name={action.icon as any} size={18} color="#A78BFA" />
            <Text style={styles.quickActionText}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          placeholder="Ask ASIS anything..."
          placeholderTextColor="#666"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={!input.trim()}
        >
          <Ionicons name="send" size={20} color="#FFF" />
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A1A1A',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, gap: 12 },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 16 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#7C3AED' },
  asisBubble: { alignSelf: 'flex-start', backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#2A2A2A' },
  userText: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  asisText: { color: '#E5E5E5', fontSize: 14, lineHeight: 20 },
  typingIndicator: { alignSelf: 'flex-start', marginTop: 4 },
  typingText: { color: '#666', fontSize: 12, fontStyle: 'italic' },
  quickActions: { maxHeight: 60, paddingHorizontal: 12, paddingVertical: 8 },
  quickActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    marginRight: 8, borderWidth: 1, borderColor: '#2A2A2A',
  },
  quickActionText: { color: '#A78BFA', fontSize: 12, fontWeight: '600' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1A1A1A',
  },
  input: {
    flex: 1, backgroundColor: '#1A1A1A', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: '#FFF', fontSize: 14, maxHeight: 100, borderWidth: 1, borderColor: '#2A2A2A',
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#333' },
});
