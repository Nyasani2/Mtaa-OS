import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

export default function SupportScreen() {
  const { user } = useAuthStore();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', user.id);

    setTickets(data || []);
    setLoading(false);
  };

  const create = async () => {
    if (!subject || !message) return;

    await supabase.from('support_tickets').insert({
      user_id: user?.id,
      subject,
      message,
      status: 'open'
    });

    setSubject('');
    setMessage('');
    load();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Support</Text>

      <TextInput value={subject} onChangeText={setSubject} placeholder="Subject" placeholderTextColor="#888" style={styles.input} />
      <TextInput value={message} onChangeText={setMessage} placeholder="Message" placeholderTextColor="#888" style={styles.input} />

      <TouchableOpacity onPress={create} style={styles.btn}>
        <Text style={{ color: '#fff' }}>Submit</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color="#6366f1" /> : (
        <FlatList
          data={tickets}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={{ color: '#fff' }}>{item.subject}</Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ color: '#6366f1', marginTop: 20 }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  title: { color: '#fff', fontSize: 22, marginBottom: 12 },
  input: { backgroundColor: '#1a1a1a', color: '#fff', padding: 12, marginBottom: 10, borderRadius: 8 },
  btn: { backgroundColor: '#6366f1', padding: 12, borderRadius: 8, alignItems: 'center' },
  card: { padding: 12, backgroundColor: '#1a1a1a', marginBottom: 8, borderRadius: 8 }
});
