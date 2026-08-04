/**
 * ASIS CSE v2 — Chat Screen
 * Replaces the old asis/index.tsx
 * Full UI for the 22-engine cognitive architecture
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useASIS, ASISMessage } from '@/lib/asis-cse/asis-cse-provider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ASISScreen() {
  const {
    isInitialized,
    isProcessing,
    health,
    currentConversation,
    conversations,
    systemStatus,
    activeEngines,
    toolHealth,
    sendMessage,
    clearConversation,
    newConversation,
    switchConversation,
    deleteConversation,
    getDiagnostics,
    getMetrics,
    getClockReport,
    getToolHealth,
  } = useASIS();

  const [inputText, setInputText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticText, setDiagnosticText] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);
  const [metricsText, setMetricsText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const scrollToBottom = useCallback(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation?.messages, scrollToBottom]);

  const handleSend = async () => {
    if (!inputText.trim() || isProcessing) return;
    const text = inputText.trim();
    setInputText('');
    await sendMessage(text);
  };

  const handleDiagnostics = () => {
    setDiagnosticText(getDiagnostics());
    setShowDiagnostics(true);
  };

  const handleMetrics = () => {
    setMetricsText(getMetrics() + '\n\n' + getClockReport() + '\n\n' + getToolHealth());
    setShowMetrics(true);
  };

  const renderMessage = (msg: ASISMessage) => {
    const isUser = msg.role === 'user';
    const isSystem = msg.role === 'system';
    const isTool = msg.role === 'tool';

    return (
      <View
        key={msg.id}
        style={[
          styles.messageBubble,
          isUser && styles.userBubble,
          isSystem && styles.systemBubble,
          isTool && styles.toolBubble,
          !isUser && !isSystem && !isTool && styles.asisBubble,
        ]}
      >
        <Text style={styles.messageRole}>
          {isUser ? 'You' : isSystem ? 'System' : isTool ? 'Tool' : 'ASIS'}
        </Text>
        <Text style={styles.messageContent}>{msg.content}</Text>
        {msg.metadata && (
          <View style={styles.metadataRow}>
            {msg.metadata.engineName && (
              <Text style={styles.metadataText}>🧠 {msg.metadata.engineName}</Text>
            )}
            {msg.metadata.confidence !== undefined && (
              <Text style={styles.metadataText}>
                📊 {(msg.metadata.confidence * 100).toFixed(0)}%
              </Text>
            )}
            {msg.metadata.executionTimeMs && (
              <Text style={styles.metadataText}>
                ⏱️ {msg.metadata.executionTimeMs}ms
              </Text>
            )}
          </View>
        )}
        <Text style={styles.messageTime}>
          {new Date(msg.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  const healthColor = health.score > 0.8 ? '#22c55e' : health.score > 0.5 ? '#f59e0b' : '#ef4444';

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />

      {/* ─── Header ─────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>☰</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ASIS CSE v2</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: healthColor }]} />
            <Text style={styles.statusText}>
              {systemStatus} • Health {(health.score * 100).toFixed(0)}%
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleDiagnostics} style={styles.headerButton}>
          <Text style={styles.headerButtonText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Active Engines Bar ─────────────── */}
      {activeEngines.length > 0 && (
        <View style={styles.enginesBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {activeEngines.map((engine, idx) => (
              <View key={idx} style={styles.engineChip}>
                <Text style={styles.engineChipText}>{engine}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ─── Messages ───────────────────────── */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {currentConversation?.messages.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>🧠 ASIS Cognitive Architecture</Text>
            <Text style={styles.emptySubtitle}>
              22 engines • 5 infrastructure layers • 6 tool integrations{'\n'}
              KAMOS Theory • Explainable AI • Ethical guardrails
            </Text>
            <Text style={styles.emptyHint}>
              Try: "Search for MTAA updates" or "Query user_profiles table"
            </Text>
          </View>
        )}
        {currentConversation?.messages.map(renderMessage)}
        {isProcessing && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.typingText}>ASIS is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* ─── Input ──────────────────────────── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handleMetrics} style={styles.inputAction}>
            <Text style={styles.inputActionText}>📊</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask ASIS anything..."
            placeholderTextColor="#6b7280"
            multiline
            maxLength={2000}
            editable={isInitialized && !isProcessing}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />

          <TouchableOpacity
            onPress={handleSend}
            disabled={!inputText.trim() || isProcessing || !isInitialized}
            style={[
              styles.sendButton,
              (!inputText.trim() || isProcessing || !isInitialized) && styles.sendButtonDisabled,
            ]}
          >
            <Text style={styles.sendButtonText}>➤</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* ─── Sidebar Modal ──────────────────── */}
      <Modal
        visible={showSidebar}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSidebar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Conversations</Text>
              <TouchableOpacity onPress={() => setShowSidebar(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={newConversation} style={styles.newConvButton}>
              <Text style={styles.newConvButtonText}>+ New Conversation</Text>
            </TouchableOpacity>

            <ScrollView style={styles.convList}>
              {conversations.map((conv) => (
                <TouchableOpacity
                  key={conv.id}
                  onPress={() => {
                    switchConversation(conv.id);
                    setShowSidebar(false);
                  }}
                  style={[
                    styles.convItem,
                    currentConversation?.id === conv.id && styles.convItemActive,
                  ]}
                >
                  <Text style={styles.convTitle} numberOfLines={1}>
                    {conv.title}
                  </Text>
                  <Text style={styles.convMeta}>
                    {conv.messages.length} msgs • {new Date(conv.updatedAt).toLocaleDateString()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteConversation(conv.id)}
                    style={styles.deleteButton}
                  >
                    <Text style={styles.deleteButtonText}>🗑</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.sidebarFooter}>
              <Text style={styles.footerText}>ASIS CSE v2.0</Text>
              <Text style={styles.footerSubtext}>
                {isInitialized ? 'Initialized' : 'Not initialized'}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Diagnostics Modal ──────────────── */}
      <Modal
        visible={showDiagnostics}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDiagnostics(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModal}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>🔍 Diagnostic Report</Text>
              <TouchableOpacity onPress={() => setShowDiagnostics(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.reportContent}>
              <Text style={styles.reportText}>{diagnosticText}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─── Metrics Modal ──────────────────── */}
      <Modal
        visible={showMetrics}
        animationType="fade"
        transparent
        onRequestClose={() => setShowMetrics(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.reportModal}>
            <View style={styles.reportHeader}>
              <Text style={styles.reportTitle}>📊 System Metrics</Text>
              <TouchableOpacity onPress={() => setShowMetrics(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.reportContent}>
              <Text style={styles.reportText}>{metricsText}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────

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
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  headerButtonText: {
    fontSize: 18,
    color: '#e2e8f0',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  enginesBar: {
    maxHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  engineChip: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  engineChipText: {
    fontSize: 11,
    color: '#e2e8f0',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyHint: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
  },
  asisBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    borderBottomLeftRadius: 4,
  },
  systemBubble: {
    alignSelf: 'center',
    backgroundColor: '#451a03',
    borderRadius: 8,
    maxWidth: '90%',
  },
  toolBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#14532d',
    borderBottomLeftRadius: 4,
  },
  messageRole: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  messageContent: {
    fontSize: 15,
    color: '#e2e8f0',
    lineHeight: 22,
  },
  metadataRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  metadataText: {
    fontSize: 10,
    color: '#64748b',
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginBottom: 12,
  },
  typingText: {
    fontSize: 13,
    color: '#94a3b8',
    marginLeft: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  inputAction: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  inputActionText: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: '#0f172a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#e2e8f0',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sidebar: {
    width: SCREEN_WIDTH * 0.8,
    height: '100%',
    backgroundColor: '#1e293b',
    paddingTop: 16,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  closeButton: {
    fontSize: 20,
    color: '#94a3b8',
    padding: 4,
  },
  newConvButton: {
    margin: 16,
    padding: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  newConvButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  convList: {
    flex: 1,
  },
  convItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    position: 'relative',
  },
  convItemActive: {
    backgroundColor: '#334155',
  },
  convTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#e2e8f0',
    paddingRight: 30,
  },
  convMeta: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  deleteButton: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  deleteButtonText: {
    fontSize: 16,
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  footerText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  reportModal: {
    backgroundColor: '#1e293b',
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  reportContent: {
    padding: 16,
  },
  reportText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 18,
  },
});
