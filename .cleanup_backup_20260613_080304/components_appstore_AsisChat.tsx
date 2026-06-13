import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  appId: string;
  appName?: string;
  onClose: () => void;
}

export function AsisChat({ appId, appName, onClose }: Props) {
  const [message, setMessage] = React.useState('');
  const [messages, setMessages] = React.useState<string[]>([]);

  const send = () => {
    if (!message.trim()) return;
    setMessages([...messages, message]);
    setMessage('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ASIS AI — {appName || appId}</Text>
        <TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity>
      </View>
      <ScrollView style={styles.messages}>
        {messages.map((m, i) => <Text key={i} style={styles.msg}>{m}</Text>)}
      </ScrollView>
      <View style={styles.inputRow}>
        <TextInput style={styles.input} value={message} onChangeText={setMessage} placeholder="Ask ASIS..." placeholderTextColor="#666" />
        <TouchableOpacity style={styles.send} onPress={send}><Text style={styles.sendText}>Send</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  close: { color: '#fff', fontSize: 18 },
  messages: { flex: 1, padding: 16 },
  msg: { color: '#ccc', fontSize: 14, marginBottom: 8, padding: 12, backgroundColor: '#1a1a1a', borderRadius: 8 },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#333' },
  input: { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', padding: 12, borderRadius: 8, marginRight: 8 },
  send: { backgroundColor: '#00d26a', paddingHorizontal: 20, justifyContent: 'center', borderRadius: 8 },
  sendText: { color: '#000', fontWeight: '700' },
});

export default AsisChat;
