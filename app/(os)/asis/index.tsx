/**
 * ASIS v7 Chat Interface
 * Replaces the v6 interface with full intelligence capabilities
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Linking,
  Dimensions,
} from 'react-native';
import { useASIS } from '@/lib/asis-v7/hooks/useAsis';
import {
  Search, Code, Terminal, Database, Globe, Send, X, Plus,
  MessageSquare, Sparkles, ExternalLink, Image as ImageIcon,
  ChevronRight, Mic, Paperclip, Brain, Zap,
  Copy, Share2, ThumbsUp, ThumbsDown,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TOOLS = [
  { id: 'search', label: 'Search', icon: Search, color: '#3B82F6' },
  { id: 'code', label: 'Code', icon: Code, color: '#10B981' },
  { id: 'terminal', label: 'Terminal', icon: Terminal, color: '#F59E0B' },
  { id: 'database', label: 'Database', icon: Database, color: '#8B5CF6' },
  { id: 'weather', label: 'Weather', icon: Globe, color: '#06B6D4' },
  { id: 'math', label: 'Math', icon: Zap, color: '#EF4444' },
];

export default function ASISScreen() {
  const { messages, isThinking, sendMessage, clearChat, sessionStats } = useASIS();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const text = input.trim();
    setInput('');
    setShowTools(false);
    await sendMessage(text);
  };

  const handleToolPress = (toolId: string) => {
    const prompts: Record<string, string> = {
      search: 'Search for ',
      code: 'Write code to ',
      terminal: 'Run command: ',
      database: 'Show my ',
      weather: "What's the weather in ",
      math: 'Calculate ',
    };
    setInput(prev => prev + (prompts[toolId] || ''));
    setShowTools(false);
  };

  const openUrl = (url: string) => {
    if (url) Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarOpen(!sidebarOpen)} style={styles.iconBtn}>
          {sidebarOpen ? <X size={20} color="#6b7280" /> : <MessageSquare size={20} color="#6b7280" />}
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Brain size={18} color="#6366f1" />
          <Text style={styles.headerTitle}>ASIS v7</Text>
          <View style={styles.intelligenceBadge}>
            <Zap size={10} color="#10B981" />
            <Text style={styles.intelligenceText}>Kamos AI</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowStats(!showStats)} style={styles.iconBtn}>
            <Sparkles size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={clearChat} style={styles.iconBtn}>
            <Plus size={20} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Panel */}
      {showStats && (
        <View style={styles.statsPanel}>
          <Text style={styles.statsTitle}>Session Intelligence</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{sessionStats.totalQueries}</Text>
              <Text style={styles.statLabel}>Queries</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{(sessionStats.avgConfidence * 100).toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Confidence</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{sessionStats.topIntents.length}</Text>
              <Text style={styles.statLabel}>Intents</Text>
            </View>
          </View>
        </View>
      )}

      <View style={styles.main}>
        {/* Sidebar */}
        {sidebarOpen && (
          <View style={styles.sidebar}>
            <TouchableOpacity style={styles.newChatBtn} onPress={clearChat}>
              <Plus size={16} color="#374151" />
              <Text style={styles.newChatText}>New Chat</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Intelligence Tools</Text>
            {TOOLS.map(tool => (
              <TouchableOpacity key={tool.id} style={styles.toolItem} onPress={() => handleToolPress(tool.id)}>
                <tool.icon size={16} color={tool.color} />
                <Text style={styles.toolText}>{tool.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.sidebarDivider} />

            <Text style={styles.sectionTitle}>Capabilities</Text>
            <View style={styles.capabilityItem}>
              <Globe size={14} color="#3B82F6" />
              <Text style={styles.capabilityText}>Web Search</Text>
            </View>
            <View style={styles.capabilityItem}>
              <Code size={14} color="#10B981" />
              <Text style={styles.capabilityText}>Code Execution</Text>
            </View>
            <View style={styles.capabilityItem}>
              <Database size={14} color="#8B5CF6" />
              <Text style={styles.capabilityText}>Database Queries</Text>
            </View>
            <View style={styles.capabilityItem}>
              <ImageIcon size={14} color="#EC4899" />
              <Text style={styles.capabilityText}>Device Photos</Text>
            </View>
            <View style={styles.capabilityItem}>
              <Terminal size={14} color="#F59E0B" />
              <Text style={styles.capabilityText}>Shell Commands</Text>
            </View>
            <View style={styles.capabilityItem}>
              <Brain size={14} color="#6366F1" />
              <Text style={styles.capabilityText}>Kamos Learning</Text>
            </View>
          </View>
        )}

        {/* Chat Area */}
        <View style={styles.chatArea}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.length === 0 && (
              <View style={styles.welcomeContainer}>
                <View style={styles.welcomeIcon}>
                  <Brain size={48} color="#6366f1" />
                </View>
                <Text style={styles.welcomeTitle}>ASIS v7 Intelligence</Text>
                <Text style={styles.welcomeSubtitle}>
                  Self-contained AI — no API needed. Internet is my brain.
                </Text>
                <View style={styles.welcomeFeatures}>
                  <Text style={styles.welcomeFeature}>Real-time web search</Text>
                  <Text style={styles.welcomeFeature}>Math and code execution</Text>
                  <Text style={styles.welcomeFeature}>Database intelligence</Text>
                  <Text style={styles.welcomeFeature}>Device photo search</Text>
                  <Text style={styles.welcomeFeature}>Kamos Theory learning</Text>
                </View>
              </View>
            )}

            {messages.map(msg => (
              <View key={msg.id} style={styles.messageWrapper}>
                {/* User message */}
                {msg.role === 'user' && (
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{msg.content}</Text>
                    <Text style={styles.timestamp}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}

                {/* ASIS message */}
                {msg.role === 'asis' && (
                  <View style={styles.asisBubble}>
                    {/* Intent badge */}
                    {msg.intent && (
                      <View style={styles.intentBadge}>
                        <Zap size={10} color="#6366f1" />
                        <Text style={styles.intentText}>
                          {msg.intent.category} ({(msg.intent.confidence * 100).toFixed(0)}%)
                        </Text>
                      </View>
                    )}

                    {/* Images */}
                    {msg.images && msg.images.length > 0 && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesRow}>
                        {msg.images.map((img, i) => (
                          <View key={i} style={styles.imageContainer}>
                            {img.startsWith('http') ? (
                              <Image source={{ uri: img }} style={styles.thumbnail} resizeMode="cover" />
                            ) : (
                              <View style={styles.imagePlaceholder}>
                                <ImageIcon size={20} color="#9ca3af" />
                              </View>
                            )}
                          </View>
                        ))}
                      </ScrollView>
                    )}

                    {/* Answer text */}
                    <Text style={styles.asisText}>{msg.content}</Text>

                    {/* Tool outputs */}
                    {msg.toolOutputs && msg.toolOutputs.length > 0 && (
                      <View style={styles.toolsContainer}>
                        <Text style={styles.toolsLabel}>Tools Used:</Text>
                        {msg.toolOutputs.map((tool, i) => (
                          <View key={i} style={[styles.toolBadge, tool.success ? styles.toolSuccess : styles.toolError]}>
                            <Text style={styles.toolBadgeText}>
                              {tool.tool} {tool.success ? '✓' : '✗'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <View style={styles.sourcesContainer}>
                        <Text style={styles.sourcesLabel}>Sources:</Text>
                        {msg.sources.map((src, i) => (
                          <TouchableOpacity key={i} style={styles.sourceItem} onPress={() => openUrl(src.url)}>
                            <Globe size={12} color="#6366f1" />
                            <Text style={styles.sourceTitle} numberOfLines={1}>{src.title}</Text>
                            <ExternalLink size={12} color="#9ca3af" />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Related questions */}
                    {msg.relatedQuestions && msg.relatedQuestions.length > 0 && (
                      <View style={styles.relatedContainer}>
                        <Text style={styles.relatedLabel}>Related:</Text>
                        {msg.relatedQuestions.map((q, i) => (
                          <TouchableOpacity key={i} style={styles.relatedItem} onPress={() => sendMessage(q)}>
                            <ChevronRight size={12} color="#6366f1" />
                            <Text style={styles.relatedText}>{q}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Action buttons */}
                    <View style={styles.messageActions}>
                      <TouchableOpacity style={styles.actionBtn}>
                        <Copy size={14} color="#9ca3af" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn}>
                        <ThumbsUp size={14} color="#9ca3af" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn}>
                        <ThumbsDown size={14} color="#9ca3af" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn}>
                        <Share2 size={14} color="#9ca3af" />
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.timestamp}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                )}
              </View>
            ))}

            {isThinking && (
              <View style={styles.thinkingBubble}>
                <ActivityIndicator size="small" color="#6366f1" />
                <View style={styles.thinkingSteps}>
                  <Text style={styles.thinkingText}>Analyzing intent...</Text>
                  <Text style={styles.thinkingText}>Searching sources...</Text>
                  <Text style={styles.thinkingText}>Synthesizing response...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Tool bar */}
          <View style={styles.toolBarContainer}>
            <TouchableOpacity onPress={() => setShowTools(!showTools)} style={styles.toolToggle}>
              <Sparkles size={16} color="#6366f1" />
              <Text style={styles.toolToggleText}>Tools</Text>
            </TouchableOpacity>

            {showTools && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolBar}>
                {TOOLS.map(tool => (
                  <TouchableOpacity key={tool.id} style={[styles.toolChip, { borderColor: tool.color }]} onPress={() => handleToolPress(tool.id)}>
                    <tool.icon size={12} color={tool.color} />
                    <Text style={[styles.toolChipText, { color: tool.color }]}>{tool.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Input */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
            <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.attachBtn}>
                <Paperclip size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Ask ASIS anything..."
                placeholderTextColor="#9ca3af"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={2000}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />

              <TouchableOpacity style={styles.micBtn}>
                <Mic size={20} color="#9ca3af" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || isThinking}
              >
                <Send size={18} color={input.trim() ? '#fff' : '#9ca3af'} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  iconBtn: { padding: 8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  intelligenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#10B98120',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 6,
  },
  intelligenceText: { fontSize: 10, color: '#10B981', fontWeight: '600' },

  statsPanel: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statsTitle: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 8 },
  statsGrid: { flexDirection: 'row', gap: 16 },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#64748B', fontSize: 11 },

  main: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 220,
    backgroundColor: '#1E293B',
    borderRightWidth: 1,
    borderRightColor: '#334155',
    padding: 12,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#334155',
    borderRadius: 8,
    marginBottom: 16,
  },
  newChatText: { fontSize: 13, fontWeight: '500', color: '#fff' },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#64748B', textTransform: 'uppercase', marginBottom: 8 },
  toolItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 4 },
  toolText: { fontSize: 13, color: '#CBD5E1' },
  sidebarDivider: { height: 1, backgroundColor: '#334155', marginVertical: 12 },
  capabilityItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  capabilityText: { fontSize: 12, color: '#94A3B8' },

  chatArea: { flex: 1, backgroundColor: '#0F172A' },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },

  welcomeContainer: { alignItems: 'center', paddingVertical: 40 },
  welcomeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366F120',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 8 },
  welcomeSubtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 24 },
  welcomeFeatures: { gap: 8 },
  welcomeFeature: { fontSize: 14, color: '#CBD5E1' },

  messageWrapper: { marginBottom: 12 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '85%',
  },
  userText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  asisBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    borderBottomLeftRadius: 4,
    maxWidth: '92%',
  },
  intentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#6366F120',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  intentText: { fontSize: 10, color: '#6366f1', fontWeight: '600' },
  asisText: { color: '#E2E8F0', fontSize: 14, lineHeight: 22 },
  imagesRow: { flexDirection: 'row', marginBottom: 10 },
  imageContainer: { marginRight: 8 },
  thumbnail: { width: 100, height: 70, borderRadius: 8 },
  imagePlaceholder: {
    width: 100, height: 70, borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center', justifyContent: 'center',
  },
  toolsContainer: { marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  toolsLabel: { fontSize: 10, color: '#64748B', marginRight: 4 },
  toolBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  toolSuccess: { backgroundColor: '#10B98130' },
  toolError: { backgroundColor: '#EF444430' },
  toolBadgeText: { fontSize: 10, color: '#CBD5E1' },
  sourcesContainer: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' },
  sourcesLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
    marginBottom: 4,
  },
  sourceTitle: { flex: 1, fontSize: 12, color: '#CBD5E1' },
  relatedContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#334155' },
  relatedLabel: { fontSize: 11, fontWeight: '600', color: '#64748B', marginBottom: 6 },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  relatedText: { fontSize: 12, color: '#6366f1' },
  messageActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionBtn: { padding: 4 },
  timestamp: { fontSize: 10, color: '#64748B', marginTop: 8, alignSelf: 'flex-end' },

  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  thinkingSteps: { gap: 4 },
  thinkingText: { fontSize: 12, color: '#94A3B8' },

  toolBarContainer: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  toolToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  toolToggleText: { fontSize: 12, color: '#6366f1', fontWeight: '500' },
  toolBar: { maxHeight: 40, marginTop: 6 },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 6,
  },
  toolChipText: { fontSize: 11, fontWeight: '500' },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 8,
  },
  attachBtn: { padding: 8 },
  input: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#fff',
    maxHeight: 100,
  },
  micBtn: { padding: 8 },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#334155' },
});
