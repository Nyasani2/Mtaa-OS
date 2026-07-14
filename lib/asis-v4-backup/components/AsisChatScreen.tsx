import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, KeyboardAvoidingView, Platform, Image, ActivityIndicator
} from 'react-native';
import { useAsis } from '../hooks/useAsis';

interface Message {
  role: 'user' | 'asis';
  text: string;
  timestamp: number;
}

export const AsisChatScreen: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const { query, queryVoice, queryImage, speak, isListening, isLoading, stats } = useAsis('general');
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = useCallback(async () => {
    if (!input.trim()) return;
    const userText = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText, timestamp: Date.now() }]);

    const result = await query(userText);
    const response = result.answer;
    setMessages(prev => [...prev, { role: 'asis', text: response, timestamp: Date.now() }]);
    speak(response);
  }, [input, query, speak]);

  const handleVoice = useCallback(async () => {
    const result = await queryVoice();
    if (result) {
      setMessages(prev => [...prev, { role: 'asis', text: result.answer, timestamp: Date.now() }]);
    }
  }, [queryVoice]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>🧠 ASIS v4</Text>
        <Text style={styles.subtitle}>
          {stats.knowledgeNodes} concepts • {stats.memoryEntries} memories • Kamos Theory
        </Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View key={i} style={[styles.message, msg.role === 'user' ? styles.userMsg : styles.asisMsg]}>
            <Text style={styles.messageText}>{msg.text}</Text>
            <Text style={styles.timestamp}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </Text>
          </View>
        ))}
        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#6366f1" />
            <Text style={styles.loading}>ASIS is thinking...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputArea}>
        <TouchableOpacity onPress={handleVoice} style={styles.voiceBtn}>
          <Text style={styles.icon}>{isListening ? '🔴' : '🎙️'}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask ASIS anything..."
          placeholderTextColor="#666"
          onSubmitEditing={sendMessage}
          multiline
        />
        <TouchableOpacity onPress={sendMessage} style={styles.sendBtn}>
          <Text style={styles.icon}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#333', backgroundColor: '#1a1a2e' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: '#888', fontSize: 11, marginTop: 4 },
  messages: { flex: 1, padding: 16 },
  message: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '85%' },
  userMsg: { backgroundColor: '#6366f1', alignSelf: 'flex-end' },
  asisMsg: { backgroundColor: '#1e1e2e', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#333' },
  messageText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  timestamp: { color: '#888', fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', padding: 8, alignSelf: 'flex-start' },
  loading: { color: '#888', marginLeft: 8 },
  inputArea: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#333', backgroundColor: '#1a1a2e' },
  voiceBtn: { padding: 12, justifyContent: 'center' },
  input: { flex: 1, backgroundColor: '#1e1e2e', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', maxHeight: 100 },
  sendBtn: { padding: 12, justifyContent: 'center' },
  icon: { fontSize: 20 },
});
