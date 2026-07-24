/**
 * ASIS v7 Chat Interface
 * Replaces the v6 interface with full intelligence capabilities
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAsis } from '@/lib/asis-v7/hooks/useAsis';

export default function AsisScreen() {
  const router = useRouter();
  const { messages, isLoading, error, sendMessage, clearChat } = useAsis();
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
  }, [input, isLoading, sendMessage]);

  const renderMessage = ({ item }: { item: any }) => (
    <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.asisBubble]}>
      <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.asisText]}>
        {item.content}
      </Text>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ASIS</Text>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Online</Text>
        </View>
        <TouchableOpacity onPress={clearChat}>
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask ASIS anything..."
            placeholderTextColor="#64748b"
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#1e293b',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  statusText: { fontSize: 12, color: '#10b981' },
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#ef444420', padding: 12, marginHorizontal: 16,
    marginTop: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ef444440',
  },
  errorText: { color: '#ef4444', fontSize: 13, flex: 1 },
  messagesList: { padding: 16, gap: 12 },
  messageBubble: {
    maxWidth: '80%', padding: 12, borderRadius: 16,
    marginBottom: 4,
  },
  userBubble: {
    alignSelf: 'flex-end', backgroundColor: '#38bdf8',
    borderBottomRightRadius: 4,
  },
  asisBubble: {
    alignSelf: 'flex-start', backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#0f172a' },
  asisText: { color: '#e2e8f0' },
  timestamp: { fontSize: 10, color: '#64748b', marginTop: 4, alignSelf: 'flex-end' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  input: {
    flex: 1, backgroundColor: '#1e293b', borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, paddingTop: 10,
    color: '#f8fafc', fontSize: 14, maxHeight: 100,
    borderWidth: 1, borderColor: '#334155',
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#38bdf8', justifyContent: 'center', alignItems: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#334155' },
});
