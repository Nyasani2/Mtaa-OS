import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppItem } from '@/hooks/useAppStore';

interface AsisChatProps {
  app?: AppItem;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'asis';
  text: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  'Is this app safe?',
  'What are the best features?',
  'Compare with alternatives',
  'How much data does it use?',
  'Is it worth installing?',
];

export function AsisChat({ app, onClose }: AsisChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'asis',
      text: app
        ? `Hi! I'm ASIS, your MTAA AI assistant. Ask me anything about ${app.name} — features, safety, comparisons, or tips.`
        : `Hi! I'm ASIS. How can I help you find the perfect app today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Simulate ASIS response
    setTimeout(() => {
      const response = generateResponse(text, app);
      const asisMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'asis',
        text: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, asisMsg]);
      setIsTyping(false);
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 1500);
  };

  const generateResponse = (query: string, app?: AppItem): string => {
    const q = query.toLowerCase();

    if (!app) {
      if (q.includes('best') || q.includes('recommend')) {
        return 'Based on top ratings, I recommend MTaxi (4.8★) for transport, Wallet (4.9★) for finance, and Tribes (4.5★) for social. Would you like details on any of these?';
      }
      if (q.includes('new') || q.includes('recent')) {
        return 'The newest additions are the redesigned AppStore, Regulatory module, and enhanced Health with telemedicine. Check them out in the Discover tab!';
      }
      return 'I can help you find apps, compare features, check safety ratings, or get installation tips. What would you like to know?';
    }

    if (q.includes('safe') || q.includes('security') || q.includes('privacy')) {
      return `${app.name} requests these permissions: ${app.permissions.join(', ')}. All MTAA apps are vetted through our developer portal with AI review. ${app.isSystem ? 'This is a system app with full OS integration.' : 'Third-party apps are sandboxed for your safety.'}`;
    }
    if (q.includes('feature') || q.includes('what') || q.includes('does')) {
      return `${app.name} features: ${app.features.join(', ')}. The app is ${app.size} and version ${app.version}.`;
    }
    if (q.includes('compare') || q.includes('alternative') || q.includes('vs')) {
      return `In ${app.category}, ${app.name} ranks #${app.ranking?.rank || 'top'} with ${app.rating}★. Similar apps: ${getAlternatives(app.category, app.id)}.`;
    }
    if (q.includes('data') || q.includes('storage') || q.includes('mb')) {
      return `${app.name} is ${app.size}. It uses minimal background data. Offline features: ${app.features.filter(f => f.toLowerCase().includes('offline') || f.toLowerCase().includes('download')).join(', ') || 'None listed — all features require connection.'}`;
    }
    if (q.includes('worth') || q.includes('should') || q.includes('install')) {
      return `With ${app.rating}★ from ${app.reviewCount.toLocaleString()} reviews and ${app.installCount} installs, ${app.name} is highly rated. ${app.ranking ? `It ranks #${app.ranking.rank} in ${app.ranking.category}.` : ''} I'd recommend trying it — you can always uninstall.`;
    }
    if (q.includes('review') || q.includes('rating')) {
      return `${app.name} has ${app.rating}★ from ${app.reviewCount.toLocaleString()} reviews. Users praise: ${app.features.slice(0, 3).join(', ')}.`;
    }

    return `Great question about ${app.name}! ${app.name} is a ${app.category} app with ${app.rating}★ rating. ${app.about.slice(0, 120)}... Ask me about features, safety, or comparisons!`;
  };

  const getAlternatives = (category: string, excludeId: string): string => {
    const alts: Record<string, string> = {
      transport: 'MTruck for logistics, Streets for navigation',
      finance: 'Regulatory for compliance tools',
      social: 'Tribes for community groups',
      health: 'No direct alternative — unique in ecosystem',
      education: 'No direct alternative — unique in ecosystem',
      shopping: 'Marketplace for peer-to-peer trading',
      productivity: 'Jobs for workforce, Studio for development',
      communication: 'Messages for secure chat, Phone for calls',
    };
    return alts[category] || 'Explore the AppStore for similar options';
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <View style={styles.asisAvatar}>
            <Feather name="cpu" size={20} color="#4ECDC4" />
          </View>
          <View>
            <Text style={styles.headerTitle}>ASIS AI</Text>
            <Text style={styles.headerSubtitle}>
              {app ? `About ${app.name}` : 'AppStore Assistant'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Feather name="x" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
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
            {msg.role === 'asis' && (
              <View style={styles.asisIconSmall}>
                <Feather name="cpu" size={12} color="#4ECDC4" />
              </View>
            )}
            <Text style={msg.role === 'user' ? styles.userText : styles.asisText}>
              {msg.text}
            </Text>
          </View>
        ))}
        {isTyping && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#4ECDC4" />
            <Text style={styles.typingText}>ASIS is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {/* Suggested Prompts */}
      {messages.length <= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsContainer}
          contentContainerStyle={styles.suggestionsContent}
        >
          {SUGGESTED_PROMPTS.map(prompt => (
            <TouchableOpacity
              key={prompt}
              style={styles.suggestionChip}
              onPress={() => sendMessage(prompt)}
            >
              <Text style={styles.suggestionText}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
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
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
        >
          <Feather name="send" size={18} color={input.trim() ? '#121212' : '#666'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  asisAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78,205,196,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.3)',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 18,
    gap: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4ECDC4',
    borderBottomRightRadius: 4,
  },
  asisBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C1C1C',
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  asisIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(78,205,196,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  userText: {
    color: '#121212',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  asisText: {
    color: '#ddd',
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingText: {
    color: '#888',
    fontSize: 13,
  },
  suggestionsContainer: {
    maxHeight: 56,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C',
  },
  suggestionsContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#1C1C1C',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  suggestionText: {
    color: '#ccc',
    fontSize: 13,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1C',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1C1C1C',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 12,
    color: '#fff',
    fontSize: 15,
    maxHeight: 120,
    minHeight: 48,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#2A2A2A',
  },
});
