// app/(education)/messages/index.tsx — FIXED
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/lib/auth/useAuth';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EducationMessagesScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadMessages();
  }, [user?.id]);

  async function loadMessages() {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('education_messages')
        .select('*, sender:education_teachers(name)')
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false });
      setMessages(data || []);
    } catch (err) {
      console.error('[Edu Messages] Load error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !user) return;
    try {
      await supabase.from('education_messages').insert({
        sender_id: user.id,
        content: newMessage.trim(),
      });
      setNewMessage('');
      loadMessages();
    } catch (err) {
      console.error('[Edu Messages] Send error:', err);
    }
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.emptyTitle}>Sign in to view messages</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/sign-in')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="mail-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.messageCard}>
            <Text style={styles.messageSender}>{item.sender?.name || 'System'}</Text>
            <Text style={styles.messageContent}>{item.content}</Text>
            <Text style={styles.messageDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
          </View>
        )}
      />

      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={newMessage}
          onChangeText={setNewMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 12 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 8 },
  button: { backgroundColor: '#007AFF', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, marginTop: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  messageCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  messageSender: { fontSize: 14, fontWeight: '600', color: '#007AFF', marginBottom: 4 },
  messageContent: { fontSize: 15, color: '#333', lineHeight: 20 },
  messageDate: { fontSize: 12, color: '#999', marginTop: 8 },
  inputBar: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  input: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15 },
  sendBtn: { backgroundColor: '#007AFF', width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
});
