import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

const mockMessages: Record<string, ChatMessage[]> = {
  '1': [
    { id: '1', sender: 'them', text: 'System update v2.1.0 is now available', time: '10:00', status: 'read' },
    { id: '2', sender: 'me', text: 'Acknowledged. Scheduling deployment for tonight.', time: '10:15', status: 'read' },
    { id: '3', sender: 'them', text: 'New alert: Backup verification failed on node-3', time: '10:30', status: 'unread' },
  ],
};

export default function MessagesThread() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [reply, setReply] = React.useState('');

  const messages = mockMessages[id as string] || [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <FontAwesome5 name="arrow-left" size={20} color="#334155" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Command Centre</Text>
          <Text style={styles.headerStatus}>Online</Text>
        </View>
        <TouchableOpacity>
          <FontAwesome5 name="ellipsis-v" size={18} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.chatArea} contentContainerStyle={{ padding: 16 }}>
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.sender === 'me' ? styles.myMessage : styles.theirMessage,
            ]}
          >
            <Text style={msg.sender === 'me' ? styles.myText : styles.theirText}>{msg.text}</Text>
            <View style={styles.messageMeta}>
              <Text style={styles.messageTime}>{msg.time}</Text>
              {msg.sender === 'me' && (
                <FontAwesome5
                  name={msg.status === 'read' ? 'check-double' : 'check'}
                  size={10}
                  color={msg.status === 'read' ? '#10B981' : '#94A3B8'}
                />
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={reply}
          onChangeText={setReply}
          placeholderTextColor="#94A3B8"
        />
        <TouchableOpacity style={styles.sendBtn}>
          <FontAwesome5 name="paper-plane" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  headerStatus: { fontSize: 12, color: '#10B981' },
  chatArea: { flex: 1 },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#10B981',
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  myText: { fontSize: 14, color: '#FFFFFF', lineHeight: 20 },
  theirText: { fontSize: 14, color: '#334155', lineHeight: 20 },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 4,
  },
  messageTime: { fontSize: 10, color: '#94A3B8' },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#334155',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
