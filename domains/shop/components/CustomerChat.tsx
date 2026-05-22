import React, { useState } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { useShopMessages } from '../hooks/useMarketplace';

interface Props {
  shopId: string;
  customerId?: string;
  userId: string;
}

export default function CustomerChat({ shopId, customerId, userId }: Props) {
  const { messages, loading, sendMessage } = useShopMessages(shopId, customerId);
  const [text, setText] = useState('');

  const handleSend = async () => {
    if (!text.trim()) return;
    await sendMessage(text, userId);
    setText('');
  };

  return (
    <View style={styles.container}>
      {loading && <Text>Loading messages...</Text>}
      <FlatList
        data={messages}
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) => (
          <View style={[styles.message, item.sender_id === userId ? styles.myMessage : styles.theirMessage]}>
            <Text>{item.content}</Text>
            <Text style={styles.time}>{new Date(item.created_at).toLocaleTimeString()}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="Type a message..." />
        <Button title="Send" onPress={handleSend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 8 },
  message: { padding: 10, borderRadius: 8, marginVertical: 4, maxWidth: '80%' },
  myMessage: { backgroundColor: '#dcf8c6', alignSelf: 'flex-end' },
  theirMessage: { backgroundColor: '#f0f0f0', alignSelf: 'flex-start' },
  time: { fontSize: 10, color: '#999', marginTop: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 }
});
