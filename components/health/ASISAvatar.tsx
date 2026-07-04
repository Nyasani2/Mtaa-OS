import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Modal, TextInput, ScrollView } from 'react-native';
import { healthASIS } from '@/lib/health/asis/health-asis';

interface ASISAvatarProps {
  context?: any;
  onExplainLab?: (record: any) => void;
  onEmergencyHelp?: (symptoms: string[]) => void;
}

export default function ASISAvatar({ context, onExplainLab, onEmergencyHelp }: ASISAvatarProps) {
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'asis'; text: string }[]>([
    { role: 'asis', text: 'Hi! I\'m ASIS, your health assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    if (context) healthASIS.setContext(context);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [context]);

  async function sendMessage() {
    if (!input.trim()) return;
    const userText = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setTyping(true);

    let response = '';
    const lower = userText.toLowerCase();

    if (lower.includes('lab') || lower.includes('result') || lower.includes('blood') || lower.includes('test')) {
      response = 'I can help explain your lab results. Please share which test you\'d like me to analyze, or go to your Medical Timeline and tap "ASIS Explain" on any lab result.';
    } else if (lower.includes('medication') || lower.includes('pill') || lower.includes('drug')) {
      response = 'I can remind you about medications and check for interactions. What would you like to know?';
    } else if (lower.includes('appointment') || lower.includes('doctor') || lower.includes('visit')) {
      response = 'I can help you prepare for your appointment. Would you like me to summarize your recent health history?';
    } else if (lower.includes('emergency') || lower.includes('pain') || lower.includes('hurt')) {
      response = 'If this is a medical emergency, please tap the SOS button or call emergency services immediately. I can also help you identify symptoms — what are you experiencing?';
      if (onEmergencyHelp) {
        const symptoms = userText.split(/[,;and]+/).map(s => s.trim()).filter(Boolean);
        onEmergencyHelp(symptoms);
      }
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      response = 'Hello! I\'m here to help with your health questions. I can explain lab results, remind you about medications, or help you prepare for appointments.';
    } else {
      response = 'I understand. I can help summarize your health history, explain lab results, check medication interactions, or assist with emergency guidance. What would you like to explore?';
    }

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'asis', text: response }]);
      setTyping(false);
    }, 600);
  }

  return (
    <>
      <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity style={styles.avatar} onPress={() => setExpanded(true)}>
          <Text style={styles.avatarText}>🤖</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={expanded} animationType="slide" transparent onRequestClose={() => setExpanded(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.chatContainer}>
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                <Text style={styles.chatAvatar}>🤖</Text>
                <View>
                  <Text style={styles.chatTitle}>ASIS Health</Text>
                  <Text style={styles.chatStatus}>{typing ? 'typing...' : 'Online'}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setExpanded(false)}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.messages} contentContainerStyle={styles.messagesContent}>
              {messages.map((m, i) => (
                <View key={i} style={[styles.messageBubble, m.role === 'user' ? styles.userBubble : styles.asisBubble]}>
                  <Text style={[styles.messageText, m.role === 'user' ? styles.userText : styles.asisText]}>{m.text}</Text>
                </View>
              ))}
              {typing && (
                <View style={styles.typingIndicator}>
                  <Text style={styles.typingText}>ASIS is thinking...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask ASIS about your health..."
                placeholderTextColor="#666"
                value={input}
                onChangeText={setInput}
                onSubmitEditing={sendMessage}
                multiline
              />
              <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                <Text style={styles.sendText}>→</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatarContainer: { position: 'absolute', bottom: 24, right: 24, zIndex: 1000 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#007AFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 },
  avatarText: { fontSize: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  chatContainer: { backgroundColor: '#1a1a1a', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '70%', overflow: 'hidden' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a2a' },
  chatHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatAvatar: { fontSize: 28 },
  chatTitle: { color: '#fff', fontSize: 16, fontWeight: '600' },
  chatStatus: { color: '#34C759', fontSize: 12 },
  closeBtn: { color: '#888', fontSize: 20 },
  messages: { flex: 1, padding: 16 },
  messagesContent: { gap: 10 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#007AFF', borderBottomRightRadius: 4 },
  asisBubble: { alignSelf: 'flex-start', backgroundColor: '#2a2a2a', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, lineHeight: 20 },
  userText: { color: '#fff' },
  asisText: { color: '#ccc' },
  typingIndicator: { alignSelf: 'flex-start', padding: 8 },
  typingText: { color: '#666', fontSize: 12, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: '#2a2a2a', gap: 8 },
  chatInput: { flex: 1, backgroundColor: '#2a2a2a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, maxHeight: 80 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#007AFF', justifyContent: 'center', alignItems: 'center' },
  sendText: { color: '#fff', fontSize: 18 },
});
