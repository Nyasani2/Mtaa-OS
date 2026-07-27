/**
 * ASIS CSE v2 — Main Chat Screen
 * Replaces the Wikipedia-wrapper UI with a real cognitive engine interface.
 * Shows messages, confidence scores, engine tabs, and tool call results.
 *
 * @module components/asis/AsisChatScreen
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useAsisChat, ChatMessage } from '@/lib/hooks/use-asis-chat';
import { AsisEnginePanel } from './AsisEnginePanel';

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) return null;

  return (
    <View style={[styles.bubbleContainer, isUser ? styles.userAlign : styles.assistantAlign]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.bubbleText, isUser ? styles.userText : styles.assistantText]}>
          {message.content}
        </Text>
        {message.metadata?.confidence !== undefined && !isUser && (
          <View style={styles.confidenceRow}>
            <View
              style={[
                styles.confidenceDot,
                {
                  backgroundColor:
                    message.metadata.confidence >= 0.8
                      ? '#22c55e'
                      : message.metadata.confidence >= 0.5
                      ? '#f59e0b'
                      : '#ef4444',
                },
              ]}
            />
            <Text style={styles.confidenceText}>
              {Math.round(message.metadata.confidence * 100)}%
            </Text>
          </View>
        )}
        {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
          <View style={styles.toolBadge}>
            <Text style={styles.toolBadgeText}>
              {message.metadata.toolCalls.length} tool call(s)
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ============================================================================
// MAIN SCREEN
// ============================================================================

export function AsisChatScreen() {
  const {
    messages,
    isLoading,
    engineStatus,
    currentConfidence,
    currentIntent,
    currentReasoning,
    sendMessage,
    clearChat,
  } = useAsisChat();

  const [inputText, setInputText] = useState('');
  const [showEngines, setShowEngines] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(text);
  };

  const quickReplies = [
    'What is my wallet balance?',
    'Book a cab from CBD to Westlands',
    'Who built you?',
    'What is Kamos Theory?',
    'Check my health records',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.statusIndicator} />
          <Text style={styles.headerTitle}>ASIS</Text>
          <Text style={styles.headerSubtitle}>CSE v2.0</Text>
        </View>
        <View style={styles.headerRight}>
          {isLoading && <ActivityIndicator size="small" color="#3b82f6" />}
          <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Engine Panel (collapsible) */}
      {showEngines && (
        <AsisEnginePanel
          engineStatus={engineStatus}
          confidence={currentConfidence}
          intent={currentIntent}
          reasoning={currentReasoning}
          isLoading={isLoading}
        />
      )}

      {/* Toggle engine panel */}
      <TouchableOpacity onPress={() => setShowEngines(!showEngines)} style={styles.toggleBar}>
        <Text style={styles.toggleText}>
          {showEngines ? '▼ Hide Engine Panel' : '▶ Show Engine Panel'}
        </Text>
      </TouchableOpacity>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 && (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>ASIS Cognitive Engine</Text>
            <Text style={styles.welcomeSubtitle}>
              Local intelligence. No external APIs. Built on Kamos Theory.
            </Text>
            <View style={styles.quickReplies}>
              {quickReplies.map((qr) => (
                <TouchableOpacity
                  key={qr}
                  style={styles.quickReplyBtn}
                  onPress={() => sendMessage(qr)}
                >
                  <Text style={styles.quickReplyText}>{qr}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === 'user' && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#6b7280" />
            <Text style={styles.typingText}>ASIS is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask ASIS anything..."
          placeholderTextColor="#9ca3af"
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginLeft: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#e2e8f0',
  },
  toggleBar: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  toggleText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  quickReplies: {
    marginTop: 16,
    gap: 8,
    width: '100%',
  },
  quickReplyBtn: {
    backgroundColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickReplyText: {
    fontSize: 13,
    color: '#e2e8f0',
    textAlign: 'center',
  },
  bubbleContainer: {
    marginBottom: 12,
    maxWidth: '85%',
  },
  userAlign: {
    alignSelf: 'flex-end',
  },
  assistantAlign: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#ffffff',
  },
  assistantText: {
    color: '#e2e8f0',
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  confidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  confidenceText: {
    fontSize: 10,
    color: '#94a3b8',
  },
  toolBadge: {
    backgroundColor: '#064e3b',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  toolBadgeText: {
    fontSize: 10,
    color: '#34d399',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 12,
    color: '#6b7280',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#f8fafc',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#334155',
  },
  sendBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AsisChatScreen;
