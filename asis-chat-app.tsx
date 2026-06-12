// app/(os)/asis/index.tsx
// MTAA ASIS — Kimi-like AI Chat App

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
  Dimensions, Modal, SafeAreaView, StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../../domains/identity/state/authStore';

const { width, height } = Dimensions.get('window');

interface AsisMessage {
  id: string;
  role: 'user' | 'asis' | 'system';
  content: string;
  timestamp: string;
  actions?: any[];
  toolCalls?: any[];
}

interface AsisTool {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
}

const ASIS_TOOLS: AsisTool[] = [
  { id: 'wallet-check', name: 'Wallet Check', icon: 'wallet', description: 'Check balance & transactions', category: 'Wallet' },
  { id: 'send-money', name: 'Send Money', icon: 'paper-plane', description: 'Transfer to contacts', category: 'Wallet' },
  { id: 'pulse-post', name: 'Create Post', icon: 'newspaper', description: 'Post to Pulse feed', category: 'Pulse' },
  { id: 'mtaxi-book', name: 'Book Ride', icon: 'taxi', description: 'Request MTaxi', category: 'Transport' },
  { id: 'health-appointment', name: 'Book Appointment', icon: 'hospital', description: 'Schedule health visit', category: 'Health' },
  { id: 'job-search', name: 'Find Jobs', icon: 'briefcase', description: 'Search job listings', category: 'Jobs' },
  { id: 'marketplace-browse', name: 'Browse Shop', icon: 'shopping-bag', description: 'Explore marketplace', category: 'Shop' },
  { id: 'tribe-join', name: 'Join Tribe', icon: 'users', description: 'Find communities', category: 'Tribes' },
  { id: 'civic-report', name: 'Civic Report', icon: 'landmark', description: 'Report to government', category: 'Civic' },
  { id: 'education-course', name: 'Find Course', icon: 'graduation-cap', description: 'Search education', category: 'Education' },
  { id: 'kernel-audit', name: 'System Audit', icon: 'shield-alt', description: 'Run health check', category: 'System' },
  { id: 'code-generator', name: 'Code Gen', icon: 'code', description: 'Generate code snippets', category: 'Dev' },
];

const DOMAINS = [
  { key: 'general', label: 'General', icon: 'globe', color: '#6366f1' },
  { key: 'wallet', label: 'Wallet', icon: 'wallet', color: '#10b981' },
  { key: 'transport', label: 'Transport', icon: 'car', color: '#f59e0b' },
  { key: 'health', label: 'Health', icon: 'heartbeat', color: '#ef4444' },
  { key: 'jobs', label: 'Jobs', icon: 'briefcase', color: '#8b5cf6' },
  { key: 'pulse', label: 'Pulse', icon: 'newspaper', color: '#ec4899' },
  { key: 'shop', label: 'Shop', icon: 'shopping-bag', color: '#06b6d4' },
  { key: 'civic', label: 'Civic', icon: 'landmark', color: '#84cc16' },
  { key: 'education', label: 'Education', icon: 'graduation-cap', color: '#f97316' },
];

export default function AsisChatApp() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userId = user?.id || 'guest';
  const params = useLocalSearchParams();
  const initialDomain = (params.domain as string) || 'general';
  const initialMessage = (params.message as string) || '';

  const [messages, setMessages] = useState<AsisMessage[]>([]);
  const [inputText, setInputText] = useState(initialMessage);
  const [selectedDomain, setSelectedDomain] = useState(initialDomain);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { if (initialMessage) handleSend(initialMessage); }, []);

  const handleSend = async (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim() || isLoading) return;

    const userMessage: AsisMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setError(null);

    try {
      await simulateAsisResponse(userMessage.content, selectedDomain);
    } catch (err: any) {
      setError(err.message || 'Failed to get response');
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'system',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const simulateAsisResponse = async (userText: string, domain: string) => {
    setIsTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsTyping(false);

    let response = '';
    let actions: any[] = [];
    let toolCalls: any[] = [];
    const lowerText = userText.toLowerCase();

    if (lowerText.includes('wallet') || lowerText.includes('balance')) {
      response = 'Your wallet balance is KSh 5,420.00. You have 3 recent transactions. Would you like to see full history or send money?';
      actions = [{ type: 'navigate', target: '/(os)/wallet', description: 'Open Wallet', requiresConfirmation: false }];
      toolCalls = [{ tool: 'wallet-check', input: { userId }, status: 'complete' }];
    } else if (lowerText.includes('ride') || lowerText.includes('taxi')) {
      response = '12 drivers available near you. Estimated fare to CBD: KSh 350. Book now?';
      actions = [{ type: 'navigate', target: '/(os)/mtaxi', description: 'Book MTaxi', requiresConfirmation: true }];
      toolCalls = [{ tool: 'mtaxi-book', input: {}, status: 'complete' }];
    } else if (lowerText.includes('health') || lowerText.includes('doctor')) {
      response = '3 facilities nearby: Nairobi Hospital (2.5km), Aga Khan (3.8km), MP Shah (4.2km). All available tomorrow.';
      actions = [{ type: 'navigate', target: '/(os)/health', description: 'Open Health', requiresConfirmation: false }];
      toolCalls = [{ tool: 'health-appointment', input: {}, status: 'complete' }];
    } else if (lowerText.includes('job') || lowerText.includes('work')) {
      response = '24 jobs match your profile. Top: Software Engineer at Safaricom (KSh 180k), Product Manager at Twiga (KSh 150k).';
      actions = [{ type: 'navigate', target: '/(os)/jobs', description: 'View Jobs', requiresConfirmation: false }];
      toolCalls = [{ tool: 'job-search', input: {}, status: 'complete' }];
    } else if (lowerText.includes('audit') || lowerText.includes('system')) {
      response = 'System audit: 26/31 passed, 5 failed. Issues: Auth profile missing, Wallet send/receive incomplete. Run detailed diagnostic?';
      actions = [{ type: 'navigate', target: '/(os)/command/asis-simulator', description: 'Run Audit', requiresConfirmation: false }];
      toolCalls = [{ tool: 'kernel-audit', input: {}, status: 'complete' }];
    } else {
      response = 'I am ASIS, your AI assistant for MTAA OS. I can help with wallet, transport, health, jobs, pulse, shopping, and more. What would you like to do?';
      setSuggestions(['Check wallet', 'Book ride', 'Find jobs', 'System audit']);
    }

    setMessages((prev) => [...prev, {
      id: (Date.now() + 2).toString(),
      role: 'asis',
      content: response,
      timestamp: new Date().toISOString(),
      actions,
      toolCalls,
    }]);
  };

  const handleAction = (action: any) => {
    if (action.type === 'navigate') router.push(action.target as any);
  };

  const handleToolPress = (tool: AsisTool) => {
    setShowTools(false);
    const msgs: Record<string, string> = {
      'wallet-check': 'Check my wallet balance',
      'send-money': 'Send money to a contact',
      'pulse-post': 'Help me create a Pulse post',
      'mtaxi-book': 'Book an MTaxi ride',
      'health-appointment': 'Book a health appointment',
      'job-search': 'Find job opportunities',
      'marketplace-browse': 'Browse the marketplace',
      'tribe-join': 'Find tribes to join',
      'civic-report': 'Submit a civic report',
      'education-course': 'Find education courses',
      'kernel-audit': 'Run system audit',
      'code-generator': 'Generate code for me',
    };
    handleSend(msgs[tool.id] || `Use ${tool.name}`);
  };

  const newChat = () => {
    setMessages([]);
    setCurrentProjectId(null);
    setInputText('');
    setError(null);
    setShowSidebar(false);
  };

  const saveProject = () => {
    if (messages.length === 0) return;
    const title = messages[0].content.slice(0, 30) + '...';
    const project = {
      id: Date.now().toString(),
      title,
      messages: [...messages],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      domain: selectedDomain,
    };
    setProjects((prev) => [project, ...prev]);
    setCurrentProjectId(project.id);
  };

  const domain = DOMAINS.find((d) => d.key === selectedDomain) || DOMAINS[0];

  const renderMessage = ({ item }: { item: AsisMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser ? styles.userRow : styles.asisRow]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>A</Text>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.asisBubble]}>
          <Text style={[styles.msgText, isUser ? styles.userText : styles.asisText]}>{item.content}</Text>
          {item.toolCalls?.map((tc: any, idx: number) => (
            <View key={idx} style={styles.toolCall}>
              <Ionicons name="flash" size={14} color="#6366f1" />
              <Text style={styles.toolText}>{tc.tool} — {tc.status}</Text>
            </View>
          ))}
          {item.actions?.map((action: any, idx: number) => (
            <TouchableOpacity key={idx} style={styles.actionBtn} onPress={() => handleAction(action)}>
              <Text style={styles.actionText}>{action.description}</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          ))}
          <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </View>
        {isUser && (
          <View style={[styles.avatar, styles.userAvatar]}>
            <Text style={styles.avatarText}>U</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={styles.headerBtn}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ASIS</Text>
          <View style={styles.headerSubtitle}>
            <View style={[styles.domainDot, { backgroundColor: domain.color }]} />
            <Text style={styles.headerDomain}>{domain.label}</Text>
            {isTyping && <Text style={styles.typingText}>typing...</Text>}
          </View>
        </View>
        <TouchableOpacity onPress={() => setShowTools(true)} style={styles.headerBtn}>
          <Ionicons name="grid" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Domain Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.domainBar}>
        {DOMAINS.map((d) => (
          <TouchableOpacity
            key={d.key}
            style={[styles.domainChip, selectedDomain === d.key && { backgroundColor: d.color + '30', borderColor: d.color }]}
            onPress={() => setSelectedDomain(d.key)}
          >
            <FontAwesome5 name={d.icon} size={12} color={selectedDomain === d.key ? d.color : '#8e8e93'} />
            <Text style={[styles.domainChipText, selectedDomain === d.key && { color: d.color }]}>{d.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.msgList}
        contentContainerStyle={styles.msgContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="sparkles" size={48} color="#6366f1" />
            <Text style={styles.emptyTitle}>How can I help you today?</Text>
            <Text style={styles.emptySubtitle}>Ask me anything about MTAA OS.</Text>
            <View style={styles.quickActions}>
              {['Check wallet', 'Book ride', 'Find jobs', 'System audit'].map((qa, i) => (
                <TouchableOpacity key={i} style={styles.quickAction} onPress={() => handleSend(qa)}>
                  <Text style={styles.quickActionText}>{qa}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
      />

      {/* Suggestions */}
      {suggestions.length > 0 && !isLoading && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsBar}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={i} style={styles.suggestionChip} onPress={() => handleSend(s)}>
              <Text style={styles.suggestionChipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Message ASIS..."
            placeholderTextColor="#666"
            multiline
            maxLength={2000}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="arrow-up" size={20} color="#fff" />}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {error && <View style={styles.errorBar}><Text style={styles.errorText}>{error}</Text></View>}

      {/* Sidebar Modal */}
      <Modal visible={showSidebar} animationType="slide" transparent onRequestClose={() => setShowSidebar(false)}>
        <View style={styles.sidebarOverlay}>
          <View style={styles.sidebar}>
            <View style={styles.sidebarHeader}>
              <Text style={styles.sidebarTitle}>Chat History</Text>
              <TouchableOpacity onPress={() => setShowSidebar(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.newChatBtn} onPress={newChat}>
              <Ionicons name="add-circle" size={20} color="#6366f1" />
              <Text style={styles.newChatText}>New Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={saveProject}>
              <Ionicons name="save" size={18} color="#10b981" />
              <Text style={styles.saveBtnText}>Save Current Chat</Text>
            </TouchableOpacity>
            <ScrollView style={styles.projectList}>
              {projects.map((p) => (
                <TouchableOpacity key={p.id} style={[styles.projectItem, currentProjectId === p.id && styles.projectItemActive]} onPress={() => { setMessages(p.messages); setSelectedDomain(p.domain); setCurrentProjectId(p.id); setShowSidebar(false); }}>
                  <Ionicons name="chatbubbles" size={18} color={currentProjectId === p.id ? '#6366f1' : '#8e8e93'} />
                  <View style={styles.projectInfo}>
                    <Text style={[styles.projectTitle, currentProjectId === p.id && styles.projectTitleActive]}>{p.title}</Text>
                    <Text style={styles.projectMeta}>{p.domain} · {new Date(p.updatedAt).toLocaleDateString()}</Text>
                  </View>
                </TouchableOpacity>
              ))}
              {projects.length === 0 && <Text style={styles.emptyProjects}>No saved chats yet. Start a conversation and save it!</Text>}
            </ScrollView>
            <View style={styles.sidebarFooter}>
              <Text style={styles.sidebarFooterText}>ASIS v2.0 · MTAA OS</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tools Modal */}
      <Modal visible={showTools} animationType="fade" transparent onRequestClose={() => setShowTools(false)}>
        <View style={styles.toolsOverlay}>
          <View style={styles.toolsPanel}>
            <View style={styles.toolsHeader}>
              <Text style={styles.toolsTitle}>ASIS Tools</Text>
              <TouchableOpacity onPress={() => setShowTools(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.toolsList}>
              {['Wallet', 'Pulse', 'Transport', 'Health', 'Jobs', 'Shop', 'Civic', 'Education', 'System', 'Dev'].map((cat) => (
                <View key={cat}>
                  <Text style={styles.toolsCategory}>{cat}</Text>
                  {ASIS_TOOLS.filter((t) => t.category === cat).map((tool) => (
                    <TouchableOpacity key={tool.id} style={styles.toolItem} onPress={() => handleToolPress(tool)}>
                      <View style={styles.toolIcon}>
                        <FontAwesome5 name={tool.icon} size={16} color="#6366f1" />
                      </View>
                      <View style={styles.toolInfo}>
                        <Text style={styles.toolName}>{tool.name}</Text>
                        <Text style={styles.toolDesc}>{tool.description}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#666" />
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  headerBtn: { padding: 8, borderRadius: 8 },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', letterSpacing: 1 },
  headerSubtitle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  domainDot: { width: 8, height: 8, borderRadius: 4 },
  headerDomain: { fontSize: 12, color: '#8e8e93' },
  typingText: { fontSize: 12, color: '#6366f1', fontStyle: 'italic' },
  domainBar: { maxHeight: 44, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  domainChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#2a2a3e', marginRight: 8, marginVertical: 8 },
  domainChipText: { fontSize: 12, color: '#8e8e93', fontWeight: '500' },
  msgList: { flex: 1 },
  msgContent: { padding: 16, gap: 16 },
  msgRow: { flexDirection: 'row', gap: 10, maxWidth: width * 0.85 },
  userRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  asisRow: { alignSelf: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center', alignSelf: 'flex-end' },
  userAvatar: { backgroundColor: '#10b981' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bubble: { padding: 14, borderRadius: 18, maxWidth: width * 0.7 },
  userBubble: { backgroundColor: '#1a1a3e', borderBottomRightRadius: 4 },
  asisBubble: { backgroundColor: '#1e1e2e', borderBottomLeftRadius: 4 },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  asisText: { color: '#e0e0e0' },
  timestamp: { fontSize: 10, color: '#666', marginTop: 6, alignSelf: 'flex-end' },
  toolCall: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 10, backgroundColor: '#0f0f1e', borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#6366f1' },
  toolText: { fontSize: 12, color: '#6366f1', fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, padding: 12, backgroundColor: '#6366f1', borderRadius: 10 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 60 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 20, marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#8e8e93', textAlign: 'center', marginBottom: 24 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  quickAction: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1a1a2e', borderRadius: 20, borderWidth: 1, borderColor: '#2a2a3e' },
  quickActionText: { color: '#8e8e93', fontSize: 13 },
  suggestionsBar: { maxHeight: 50, borderTopWidth: 1, borderTopColor: '#1a1a2e', paddingVertical: 8 },
  suggestionChip: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#1a1a2e', borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#2a2a3e' },
  suggestionChipText: { color: '#8e8e93', fontSize: 12 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: '#1a1a2e', backgroundColor: '#0a0a0f' },
  input: { flex: 1, backgroundColor: '#1a1a2e', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, maxHeight: 120, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2a2a3e' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#6366f1', justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: '#2a2a3e' },
  errorBar: { backgroundColor: '#3a1a1a', padding: 12, borderTopWidth: 1, borderTopColor: '#ff453a' },
  errorText: { color: '#ff453a', fontSize: 13, textAlign: 'center' },
  sidebarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', flexDirection: 'row' },
  sidebar: { width: width * 0.8, backgroundColor: '#0f0f1a', paddingTop: 20, paddingHorizontal: 16 },
  sidebarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sidebarTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  newChatBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#1a1a2e', borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#6366f1', borderStyle: 'dashed' },
  newChatText: { color: '#6366f1', fontWeight: '600', fontSize: 15 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: '#1a1a2e', borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#10b981', borderStyle: 'dashed' },
  saveBtnText: { color: '#10b981', fontWeight: '600', fontSize: 15 },
  projectList: { flex: 1 },
  projectItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, marginBottom: 6 },
  projectItemActive: { backgroundColor: '#1a1a2e' },
  projectInfo: { flex: 1 },
  projectTitle: { fontSize: 14, color: '#e0e0e0', fontWeight: '500' },
  projectTitleActive: { color: '#6366f1' },
  projectMeta: { fontSize: 11, color: '#666', marginTop: 2 },
  emptyProjects: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 14 },
  sidebarFooter: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#1a1a2e' },
  sidebarFooterText: { color: '#666', fontSize: 12, textAlign: 'center' },
  toolsOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  toolsPanel: { backgroundColor: '#0f0f1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: height * 0.7, padding: 20 },
  toolsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  toolsTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  toolsList: { flex: 1 },
  toolsCategory: { fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginTop: 16, marginBottom: 8 },
  toolItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, backgroundColor: '#1a1a2e', borderRadius: 12, marginBottom: 8 },
  toolIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#6366f115', justifyContent: 'center', alignItems: 'center' },
  toolInfo: { flex: 1 },
  toolName: { fontSize: 15, color: '#fff', fontWeight: '600' },
  toolDesc: { fontSize: 12, color: '#8e8e93', marginTop: 2 },
});
