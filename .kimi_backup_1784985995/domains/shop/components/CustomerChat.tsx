// domains/shop/components/CustomerChat.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useShopMessages } from '../hooks/useMarketplace';

interface Props {
  shopId: string;
  customerId: string;
}

export default function CustomerChat({ shopId, customerId }: Props) {
  const { messages, sendMessage } = useShopMessages();
  const [text, setText] = useState('');

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(text.trim(), customerId);
    setText('');
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === customerId ? styles.me : styles.them]}>
            <Text style={styles.msgText}>{item.text}</Text>
            <Text style={styles.time}>{new Date(item.timestamp).toLocaleTimeString()}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#888"
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  bubble: { margin: 8, padding: 12, borderRadius: 12, maxWidth: '80%' },
  me: { alignSelf: 'flex-end', backgroundColor: '#10B981' },
  them: { alignSelf: 'flex-start', backgroundColor: '#1f1f1f' },
  msgText: { color: '#fff', fontSize: 14 },
  time: { color: '#888', fontSize: 10, marginTop: 4 },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1f1f1f' },
  input: { flex: 1, backgroundColor: '#1f1f1f', borderRadius: 20, paddingHorizontal: 16, color: '#fff' },
  sendBtn: { marginLeft: 8, backgroundColor: '#10B981', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '600' },
});
