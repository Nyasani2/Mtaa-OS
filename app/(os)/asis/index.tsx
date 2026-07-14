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
  Dimensions
} from 'react-native';
import { useASIS } from '@/lib/kernel/ai/asis-provider-v6';
import {
  Search, Code, Terminal, Database, Globe, Send, X, Plus,
  MessageSquare, Sparkles, ExternalLink, Image as ImageIcon,
  ChevronRight
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const TOOLS = [
  { id: 'search', label: 'Search', icon: Search },
  { id: 'code', label: 'Code', icon: Code },
  { id: 'terminal', label: 'Terminal', icon: Terminal },
  { id: 'database', label: 'Database', icon: Database },
];

export default function ASISScreen() {
  const { messages, isThinking, sendMessage, clearChat } = useASIS();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim() || isThinking) return;
    const text = input.trim();
    setInput('');
    await sendMessage(text);
  };

  const handleToolPress = (toolId: string) => {
    const prompts: Record<string, string> = {
      search: 'Search for ',
      code: 'Write code to ',
      terminal: 'Run command: ',
      database: 'Show database tables',
    };
    setInput(prev => prev + (prompts[toolId] || ''));
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
          <Sparkles size={16} color="#6366f1" />
          <Text style={styles.headerTitle}>ASIS AI</Text>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.iconBtn}>
          <Plus size={20} color="#6b7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.main}>
        {/* Sidebar */}
        {sidebarOpen && (
          <View style={styles.sidebar}>
            <TouchableOpacity style={styles.newChatBtn} onPress={clearChat}>
              <Plus size={16} color="#374151" />
              <Text style={styles.newChatText}>New Chat</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Tools</Text>
            {TOOLS.map(tool => (
              <TouchableOpacity key={tool.id} style={styles.toolItem} onPress={() => handleToolPress(tool.id)}>
                <tool.icon size={16} color="#6b7280" />
                <Text style={styles.toolText}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Chat */}
        <View style={styles.chatArea}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesScroll}
            contentContainerStyle={styles.messagesContent}
            keyboardShouldPersistTaps="handled"
          >
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

                    {/* Sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <View style={styles.sourcesContainer}>
                        <Text style={styles.sourcesLabel}>Sources:</Text>
                        {msg.sources.map((src, i) => (
                          <TouchableOpacity key={i} style={styles.sourceItem} onPress={() => openUrl(src.url)}>
                            <Globe size={12} color="#6366f1" />
                            <Text style={styles.sourceTitle} numberOfLines={1}>{src.title}</Text>
                            <Text style={styles.sourceName}>{src.source}</Text>
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
                <Text style={styles.thinkingText}>Searching...</Text>
              </View>
            )}
          </ScrollView>

          {/* Tool bar */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.toolBar}>
            {TOOLS.map(tool => (
              <TouchableOpacity key={tool.id} style={styles.toolChip} onPress={() => handleToolPress(tool.id)}>
                <tool.icon size={12} color="#6b7280" />
                <Text style={styles.toolChipText}>{tool.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ask anything..."
                placeholderTextColor="#9ca3af"
                value={input}
                onChangeText={setInput}
                multiline
                maxLength={2000}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
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
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  iconBtn: { padding: 8 },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  main: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: 220,
    backgroundColor: '#f3f4f6',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
    padding: 12
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16
  },
  newChatText: { fontSize: 13, fontWeight: '500', color: '#374151' },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 },
  toolItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 4 },
  toolText: { fontSize: 13, color: '#4b5563' },
  chatArea: { flex: 1, backgroundColor: '#f9fafb' },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  messageWrapper: { marginBottom: 12 },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#6366f1',
    padding: 12,
    borderRadius: 16,
    borderBottomRightRadius: 4,
    maxWidth: '85%'
  },
  userText: { color: '#fff', fontSize: 14, lineHeight: 20 },
  asisBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderBottomLeftRadius: 4,
    maxWidth: '92%'
  },
  asisText: { color: '#1f2937', fontSize: 14, lineHeight: 22 },
  imagesRow: { flexDirection: 'row', marginBottom: 10 },
  imageContainer: { marginRight: 8 },
  thumbnail: { width: 100, height: 70, borderRadius: 8 },
  imagePlaceholder: {
    width: 100, height: 70, borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center', justifyContent: 'center'
  },
  sourcesContainer: { marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  sourcesLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  sourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginBottom: 4
  },
  sourceTitle: { flex: 1, fontSize: 12, color: '#374151' },
  sourceName: { fontSize: 10, color: '#6366f1', fontWeight: '500' },
  relatedContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  relatedLabel: { fontSize: 11, fontWeight: '600', color: '#9ca3af', marginBottom: 6 },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4
  },
  relatedText: { fontSize: 12, color: '#6366f1' },
  timestamp: { fontSize: 10, color: '#9ca3af', marginTop: 8, alignSelf: 'flex-end' },
  thinkingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  thinkingText: { fontSize: 13, color: '#6b7280' },
  toolBar: {
    maxHeight: 40,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 6
  },
  toolChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    marginRight: 6
  },
  toolChipText: { fontSize: 11, color: '#4b5563' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8
  },
  input: {
    flex: 1,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1f2937',
    maxHeight: 100
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#6366f1',
    alignItems: 'center', justifyContent: 'center'
  },
  sendBtnDisabled: { backgroundColor: '#e5e7eb' }
});
