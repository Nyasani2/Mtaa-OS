import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsisV3Engine from '../../../lib/asis/core/asisV3Engine';

const MessageBubble = React.memo(function MessageBubble(props) {
  const item = props.item;
  return (
    <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.asisBubble]}>
      <Text style={[styles.bubbleText, item.isUser ? styles.userText : styles.asisText]}>
        {item.text}
      </Text>
      {!item.isUser && item.growthFactor !== undefined && (
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {'f=' + item.growthFactor + ' | conf=' + item.confidence +
             (item.source ? ' | ' + item.source : '') +
             (item.timing ? ' | ' + item.timing + 'ms' : '') +
             (item.cost ? ' | ' + item.cost : '')}
          </Text>
        </View>
      )}
    </View>
  );
});

export default function AsisScreen() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      text: 'ASIS v3 M-Theory Engine active.\n\nGroq: Connected (Free Tier)\nKimi: Disconnected (Recharge needed)\n\nI can solve math, generate code, and answer complex questions via Groq cloud AI.\n\nTry: "what is 2 + 2 * 2" or "explain quantum computing"',
      isUser: false,
      growthFactor: 1.0,
      confidence: 1.0,
      source: 'mtheory',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [engineStatus, setEngineStatus] = useState({
    groq: false,
    kimi: false,
    mtheory: true,
  });
  const engineRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AsisV3Engine();
      engineRef.current.healthCheck().then((health) => {
        setEngineStatus({
          mtheory: health.mtheory,
          groq: health.groq.ok,
          kimi: health.kimi.ok,
        });
      });
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !engineRef.current) return;

    const userMsg = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const result = await engineRef.current.process(text);

      const asisMsg = {
        id: (Date.now() + 1).toString(),
        text: result.text,
        isUser: false,
        growthFactor: result.growthFactor,
        confidence: result.confidence,
        domain: result.domain,
        source: result.source,
        timing: result.timing,
        cost: result.cost,
      };

      setMessages((prev) => [...prev, asisMsg]);
    } catch (err) {
      const errorMsg = {
        id: (Date.now() + 1).toString(),
        text: 'Error: ' + (err.message || 'Unknown error'),
        isUser: false,
        source: 'error',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  }, [inputText]);

  const handleBenchmark = useCallback(async () => {
    if (!engineRef.current) return;
    const stats = engineRef.current.getStats();

    const benchMsg = {
      id: (Date.now() + 1).toString(),
      text: 'ASIS v3 Benchmark Report\n\n' +
        'Knowledge Nodes: ' + stats.nodes + '\n' +
        'Total Interactions: ' + stats.interactions + '\n' +
        'Groq Requests: ' + stats.groqRequests + '\n' +
        'Kimi Requests: ' + stats.kimiRequests + '\n' +
        'Total Tokens Used: ' + stats.totalTokens + '\n' +
        'Total Cost: $' + stats.totalCostUsd + '\n' +
        'Avg Confidence: ' + stats.avgConfidence + '\n' +
        'Session Time: ' + stats.sessionTime + 's\n\n' +
        'Engine Status:\n' +
        '  M-Theory: ' + (stats.mtheory ? 'Active' : 'Offline') + '\n' +
        '  Groq: ' + (stats.groqConnected ? 'Connected' : 'Not configured') + '\n' +
        '  Kimi: ' + (stats.kimiConnected ? 'Connected' : 'Not configured'),
      isUser: false,
      growthFactor: 1.5,
      confidence: 1.0,
      source: 'benchmark',
    };

    setMessages((prev) => [...prev, benchMsg]);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="sparkles" size={20} color="#00d4ff" />
          <Text style={styles.headerTitle}>ASIS v3</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.statusDot, { backgroundColor: engineStatus.groq ? '#00ff88' : '#ff4444' }]} />
          <Text style={styles.statusText}>
            {'Groq ' + (engineStatus.groq ? 'Connected' : 'Offline')}
          </Text>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble item={item} />}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }}
      />

      {isLoading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#00d4ff" />
          <Text style={styles.loadingText}>M-Theory analyzing...</Text>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity onPress={handleBenchmark} style={styles.benchButton}>
            <Ionicons name="stats-chart" size={18} color="#00d4ff" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask ASIS anything..."
            placeholderTextColor="#666"
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={sendMessage}
            editable={!isLoading}
          />

          <TouchableOpacity
            onPress={sendMessage}
            disabled={isLoading || !inputText.trim()}
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#888',
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  bubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#0066cc',
    borderBottomRightRadius: 4,
  },
  asisBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a2e',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  asisText: {
    color: '#e0e0e0',
  },
  metaRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e',
  },
  metaText: {
    fontSize: 10,
    color: '#00d4ff',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#00d4ff',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
    backgroundColor: '#0a0a1a',
    gap: 8,
  },
  benchButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00d4ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#1a1a2e',
  },
});
