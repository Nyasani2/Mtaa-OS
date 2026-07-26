// ============================================================================
// MTAA Restaurant Module — ASIS AI Integration Screen
// ============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ScrollView } from 'react-native';

export default function RestaurantASIS() {
  const [messages, setMessages] = useState<any[]>([
    { role: 'asis', text: 'Hello! I am ASIS, your restaurant AI assistant. I can help you with menu suggestions, demand forecasting, staff scheduling, and more. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    // In production: call ASIS AI endpoint with restaurant context
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'asis',
        text: `[ASIS AI Response Placeholder]\n\nYou asked: "${userMsg}"\n\nIn production, this connects to the ASIS AI engine with full restaurant context (sales data, inventory levels, staff schedules, customer trends) to provide intelligent recommendations.`
      }]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 ASIS AI Assistant</Text>
        <Text style={styles.headerSubtitle}>Powered by MTAA Intelligence</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.messagesList}
        renderItem={({ item }) => (
          <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.asisBubble]}>
            <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.asisText]}>
              {item.text}
            </Text>
          </View>
        )}
      />

      {isLoading && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>ASIS is thinking...</Text>
        </View>
      )}

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask ASIS about your restaurant..."
          value={input}
          onChangeText={setInput}
          multiline
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>➤</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickActions}>
        <QuickAction label="📈 Forecast demand" onPress={() => setInput('Forecast demand for next week')} />
        <QuickAction label="🍽️ Menu suggestions" onPress={() => setInput('Suggest menu items based on current inventory')} />
        <QuickAction label="👥 Staff schedule" onPress={() => setInput('Optimize staff schedule for this weekend')} />
        <QuickAction label="📊 Sales analysis" onPress={() => setInput('Analyze sales trends and suggest promotions')} />
      </ScrollView>
    </View>
  );
}

function QuickAction({ label, onPress }: any) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickActionText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
    backgroundColor: '#1F2937',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  messagesList: { padding: 16, gap: 12 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 4,
  },
  asisBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#FFFFFF' },
  asisText: { color: '#1F2937' },
  typingIndicator: { paddingHorizontal: 16, paddingBottom: 8 },
  typingText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#1F2937',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: { color: '#FFFFFF', fontSize: 18 },
  quickActions: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickAction: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  quickActionText: { fontSize: 12, color: '#4B5563' },
});
