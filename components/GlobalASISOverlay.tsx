// @ts-nocheck
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
  PanResponder, Dimensions, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useASIS } from '@/lib/asis-cse/asis-cse-provider';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { usePathname } from 'expo-router';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export function GlobalASISOverlay() {
  // 1. ALL HOOKS MUST BE AT THE TOP (React Rule)
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [position, setPosition] = useState({ x: SCREEN_WIDTH - 70, y: SCREEN_HEIGHT - 150 });
  const { sendMessage, currentConversation, isProcessing } = useASIS();
  const { user } = useAuthStore();
  const scrollViewRef = useRef(null);
  const recognitionRef = useRef<any>(null);

  // 2. Conditional return AFTER hooks
  if (pathname === '/asis' || pathname?.startsWith('/asis')) {
    return null;
  }

  // PanResponder for dragging the donut button
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        setPosition({
          x: Math.max(0, Math.min(SCREEN_WIDTH - 60, position.x + gestureState.dx)),
          y: Math.max(0, Math.min(SCREEN_HEIGHT - 150, position.y + gestureState.dy)),
        });
      },
      onPanResponderRelease: (_, gestureState) => {
        if (Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5) {
          setVisible(true);
        }
      },
    })
  ).current;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollViewRef.current && currentConversation?.messages) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [currentConversation?.messages]);

  // Initialize Web Speech API (100% Free, built into Chrome/Edge/Safari)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText((prev) => (prev ? prev + ' ' + transcript : transcript));
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            Alert.alert('Permission Denied', 'Please allow microphone access in your browser settings.');
          }
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      Alert.alert('Not Supported', 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start recognition:', error);
        setIsListening(false);
      }
    }
  };

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || isProcessing) return;
    await sendMessage(inputText.trim());
    setInputText('');
  }, [inputText, isProcessing, sendMessage]);

  const handleKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter' && !e.nativeEvent.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <>
      {/* Draggable ASIS Donut Button */}
      <View style={[styles.floatingButton, { left: position.x, top: position.y }]} {...panResponder.panHandlers}>
        <View style={styles.floatingButtonInner}>
          <Ionicons name="sparkles" size={24} color="#fff" />
        </View>
        {isListening && (
          <View style={styles.listeningIndicator}>
            <View style={styles.listeningDot} />
            <Text style={styles.listeningText}>Listening...</Text>
          </View>
        )}
      </View>

      {/* Main Chat Modal */}
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setVisible(false)}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>ASIS</Text>
              <Text style={styles.userName}>Hi, {userName}!</Text>
            </View>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
            {currentConversation?.messages.map((msg: any) => (
              <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.messageUser : styles.messageAssistant]}>
                {msg.role === 'asis' && (
                  <View style={styles.avatarContainer}>
                    <View style={styles.asisArrayAvatar}><Ionicons name="sparkles" size={12} color="#fff" /></View>
                  </View>
                )}
                <View style={styles.messageContent}>
                  <Text style={styles.messageText}>{msg.content}</Text>
                  <Text style={styles.messageTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
              </View>
            ))}
            {isProcessing && (
              <View style={styles.typingIndicator}>
                <ActivityIndicator size="small" color="#8b5cf6" />
                <Text style={styles.typingText}>ASIS is thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
            <View style={styles.inputContainer}>
              <TouchableOpacity style={[styles.voiceButton, isListening && styles.voiceButtonListening]} onPress={toggleListening} disabled={isProcessing}>
                <Ionicons name={isListening ? 'stop' : 'mic'} size={20} color={isListening ? '#ef4444' : '#94a3b8'} />
              </TouchableOpacity>
              
              <TextInput
                style={styles.input}
                placeholder="Message ASIS or tap mic to speak..."
                placeholderTextColor="#64748b"
                value={inputText}
                onChangeText={setInputText}
                multiline
                onKeyPress={handleKeyPress}
                editable={!isProcessing}
              />

              <TouchableOpacity style={[styles.sendButton, (!inputText.trim() || isProcessing) && styles.sendButtonDisabled]} onPress={handleSend} disabled={!inputText.trim() || isProcessing}>
                {isProcessing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
            <Text style={styles.inputHint}>
              {isListening ? 'Listening... tap mic to stop' : 'Tap mic for hands-free voice • Enter to send'}
            </Text>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  floatingButton: { position: 'absolute', zIndex: 1000 },
  floatingButtonInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', shadowColor: '#8b5cf6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 8 },
  listeningIndicator: { position: 'absolute', bottom: 60, left: 0, right: 0, backgroundColor: 'rgba(239, 68, 68, 0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  listeningDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  listeningText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerCenter: { alignItems: 'center', flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 12, color: '#60a5fa', marginTop: 2 },
  closeButton: { padding: 8 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  messageBubble: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16, gap: 8 },
  messageUser: { justifyContent: 'flex-end' },
  messageAssistant: { justifyContent: 'flex-start' },
  avatarContainer: { marginBottom: 4 },
  asisArrayAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  messageContent: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  messageText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  messageTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14 },
  typingText: { color: '#94a3b8', fontSize: 13 },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155', gap: 10 },
  voiceButton: { padding: 10, marginBottom: 4, borderRadius: 20, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  voiceButtonListening: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  input: { flex: 1, backgroundColor: '#0f172a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 120, minHeight: 44, marginBottom: 4 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  sendButtonDisabled: { backgroundColor: '#334155' },
  inputHint: { textAlign: 'center', fontSize: 11, color: '#64748b', paddingVertical: 6, backgroundColor: '#0f172a' },
});
