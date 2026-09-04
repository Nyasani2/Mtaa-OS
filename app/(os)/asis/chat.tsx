// @ts-nocheck
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert,
  getOrCreateConversation,
  getMessages,
  saveMessage,
  processQuery,
  clearMessages,
  type AsisMessage,
} from '@/lib/asis/services/asis-cse-service';

interface ChatMessage extends AsisMessage {
  isLoading?: boolean;
}

export default function AsisChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initLoading, setInitLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── Init conversation ────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    async function init() {
      try {
        setInitLoading(true);
        const conv = await getOrCreateConversation(user!.id, { title: 'ASIS CSE v2' });
        if (cancelled) return;
        setConversationId(conv.id);

        const msgs = await getMessages(conv.id);
        if (cancelled) return;

        // Add system welcome if empty
        if (msgs.length === 0) {
          const welcome = await saveMessage(
            conv.id,
            'system',
            'ASIS CSE v2 online. How can I assist you today?',
            { engine: 'system', version: 'cse-v2' }
          );
          setMessages([welcome]);
        } else {
          setMessages(msgs);
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to initialize');
      } finally {
        if (!cancelled) setInitLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user?.id]);

  // ─── Auto-scroll ──────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  // ─── Handle MTAA Action ───────────────────────────────────
  const handleAction = useCallback((action: string) => {
    const routes: Record<string, string> = {
      mtaxi_request: '/(os)/mtaxi',
      wallet_transfer: '/(os)/wallet',
      health_access: '/(os)/health',
      education_access: '/(os)/education',
      shop_access: '/(os)/shop',
      jobs_access: '/(os)/jobs',
      profile_access: '/(os)/profile',
      messenger_access: '/(os)/messenger',
    };
    const route = routes[action];
    if (route) router.push(route);
  }, [router]);

  // ─── Send Message ─────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !conversationId || !user?.id) return;

    const userContent = inputText.trim();
    setInputText('');
    setLoading(true);
    setError(null);

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: `temp-user-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content: userContent,
      metadata: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      // Persist user message
      await saveMessage(conversationId, 'user', userContent);

      // Show loading indicator
      const tempAssistMsg: ChatMessage = {
        id: `temp-assist-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: '',
        metadata: null,
        created_at: new Date().toISOString(),
        isLoading: true,
      };
      setMessages((prev) => [...prev, tempAssistMsg]);

      // Run CSE pipeline
      const result = await processQuery(userContent, conversationId, user.id);

      // Remove temp messages
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));

      // Persist assistant response
      const saved = await saveMessage(conversationId, 'assistant', result.response, result.metadata);
      setMessages((prev) => [...prev, saved]);

      // Handle MTAA action routing
      if (result.action) {
        setTimeout(() => handleAction(result.action!), 1500);
      }
    } catch (e: any) {
      console.error('[AsisChat] handleSend error:', e);
      setError(e?.message || 'Failed to process query');
      setMessages((prev) => prev.filter((m) => !m.id.startsWith('temp-')));
    } finally {
      setLoading(false);
    }
  }, [inputText, conversationId, user?.id, handleAction]);

  // ─── Render Message ───────────────────────────────────────
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const isSystem = item.role === 'system';

    return (
      <View
        style={[
          styles.bubble,
          isUser && styles.bubbleUser,
          isSystem && styles.bubbleSystem,
          !isUser && !isSystem && styles.bubbleAssistant,
        ]}
      >
        {item.isLoading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.bubbleText}>Researching...</Text>
          </View>
        ) : (
          <Text style={[
            styles.bubbleText,
            isUser && styles.bubbleTextUser,
            isSystem && styles.bubbleTextSystem,
          ]}>
            {item.content}
          </Text>
        )}
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  // ─── Not logged in ────────────────────────────────────────
  if (!user?.id) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Please sign in to use ASIS</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login' as any)}>
          <Text style={styles.loginBtnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (initLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={[styles.emptyText, { marginTop: 16 }]}>Initializing ASIS CSE v2...</Text>
      </View>
    );
  }

  if (error && messages.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="warning" size={48} color="#F44336" />
        <Text style={[styles.emptyText, { marginTop: 12, color: '#F44336' }]}>{error}</Text>
        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => { setError(null); setInitLoading(true); }}
        >
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ASIS CSE v2</Text>
          <Text style={styles.headerSubtitle}>
            <Text style={{ color: '#4CAF50' }}>●</Text> Online · Cognitive Engines Active
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Alert.alert('Clear Chat', 'Delete all messages?', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Clear',
                style: 'destructive',
                onPress: async () => {
                  if (conversationId) {
                    await clearMessages(conversationId);
                    setMessages([]);
                  }
                },
              },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={22} color="#F44336" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.welcomeWrap}>
            <Ionicons name="sparkles" size={48} color="#2563eb" />
            <Text style={styles.welcomeTitle}>ASIS Cognitive System</Text>
            <Text style={styles.welcomeText}>
              I search the web, extract evidence, and synthesize answers through my cognitive engines.
              No external AI. No API costs. Pure intelligence.
            </Text>
            <Text style={styles.welcomeHint}>
              Try: "who is Edwin Sifuna" · "what are the African Great Lakes" · "get me a cab"
            </Text>
          </View>
        }
      />

      {/* Error banner */}
      {error && messages.length > 0 && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="Ask ASIS anything..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          onSubmitEditing={handleSend}
          editable={!loading}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputText.trim() || loading) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="send" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1117', padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 12,
    backgroundColor: '#161b22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262d',
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  messagesContainer: { paddingHorizontal: 16, paddingVertical: 12, flexGrow: 1 },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginVertical: 4,
  },
  bubbleUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#2563eb',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    alignSelf: 'flex-start',
    backgroundColor: '#21262d',
    borderBottomLeftRadius: 4,
  },
  bubbleSystem: {
    alignSelf: 'center',
    backgroundColor: '#3d1f00',
    borderRadius: 12,
    maxWidth: '90%',
  },
  bubbleText: { color: '#e6edf3', fontSize: 15, lineHeight: 20 },
  bubbleTextUser: { color: '#fff' },
  bubbleTextSystem: { color: '#ffa94d', fontSize: 14 },
  timestamp: { fontSize: 10, color: '#888', marginTop: 4, alignSelf: 'flex-end' },
  welcomeWrap: { alignItems: 'center', marginTop: 40, paddingHorizontal: 24 },
  welcomeTitle: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 16 },
  welcomeText: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  welcomeHint: { fontSize: 12, color: '#555', textAlign: 'center', marginTop: 16, fontStyle: 'italic' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#161b22',
    borderTopWidth: 1,
    borderTopColor: '#21262d',
  },
  input: {
    flex: 1,
    backgroundColor: '#21262d',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
    marginRight: 8,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#1f2937' },
  emptyText: { color: '#888', fontSize: 16, textAlign: 'center' },
  loginBtn: {
    marginTop: 20,
    backgroundColor: '#2563eb',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#21262d',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryBtnText: { color: '#fff', fontSize: 14 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4433620',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4433640',
  },
  errorBannerText: { color: '#F44336', fontSize: 13, flex: 1 },
});
