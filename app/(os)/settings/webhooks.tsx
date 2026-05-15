import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, Alert, TextInput, Switch 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Webhook {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  last_triggered: string | null;
}

export default function WebhooksScreen() {
  const { user } = useAuthStore();
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['transaction']);
  const [creating, setCreating] = useState(false);

  const eventOptions = [
    'payment.received', 'payment.sent', 'kyc.updated', 'subscription.created'
  ];

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setWebhooks([]);
      return;
    }

    if (data) {
      setWebhooks(data.map((w: any) => ({
        id: w.id,
        url: w.url,
        events: w.events || [],
        is_active: w.is_active !== false,
        created_at: w.created_at,
        last_triggered: w.last_triggered,
      })));
    }
  };

  const handleCreate = async () => {
    if (!newUrl.trim() || !newUrl.startsWith('https://')) {
      Alert.alert('Invalid URL', 'Please enter a valid HTTPS URL');
      return;
    }

    setCreating(true);
    const { error } = await supabase
      .from('webhooks')
      .insert({
        user_id: user?.id,
        url: newUrl.trim(),
        events: selectedEvents,
        is_active: true,
        created_at: new Date().toISOString(),
      });

    setCreating(false);
    setShowCreate(false);
    setNewUrl('');
    setSelectedEvents(['transaction']);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      fetchWebhooks();
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from('webhooks')
      .update({ is_active: !current })
      .eq('id', id);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setWebhooks(webhooks.map(w => w.id === id ? { ...w, is_active: !current } : w));
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Webhook',
      'This webhook will stop receiving events immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('webhooks')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setWebhooks(webhooks.filter(w => w.id !== id));
            }
          }
        }
      ]
    );
  };

  const toggleEvent = (event: string) => {
    if (selectedEvents.includes(event)) {
      setSelectedEvents(selectedEvents.filter(e => e !== event));
    } else {
      setSelectedEvents([...selectedEvents, event]);
    }
  };

  const renderItem = ({ item }: { item: Webhook }) => (
    <View style={styles.webhookCard}>
      <View style={styles.webhookHeader}>
        <Text style={styles.webhookUrl} numberOfLines={1}>{item.url}</Text>
        <Switch
          value={item.is_active}
          onValueChange={() => handleToggle(item.id, item.is_active)}
          trackColor={{ false: '#333', true: '#6366f1' }}
          thumbColor={item.is_active ? '#fff' : '#888'}
        />
      </View>
      <View style={styles.eventsRow}>
        {item.events.map(e => (
          <View key={e} style={styles.eventBadge}>
            <Text style={styles.eventText}>{e}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.webhookMeta}>
        Created: {new Date(item.created_at).toLocaleDateString()}
        {item.last_triggered && ` • Last: ${new Date(item.last_triggered).toLocaleDateString()}`}
      </Text>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Webhooks</Text>

      {showCreate ? (
        <View style={styles.createBox}>
          <TextInput
            style={styles.createInput}
            placeholder="https://your-server.com/webhook"
            placeholderTextColor="#888"
            autoCapitalize="none"
            keyboardType="url"
            value={newUrl}
            onChange={setNewUrl}
          />
          <Text style={styles.eventsLabel}>Events</Text>
          <View style={styles.eventsGrid}>
            {eventOptions.map(e => (
              <TouchableOpacity
                key={e}
                style={[
                  styles.eventOption,
                  selectedEvents.includes(e) && styles.eventOptionActive
                ]}
                onPress={() => toggleEvent(e)}
              >
                <Text style={[
                  styles.eventOptionText,
                  selectedEvents.includes(e) && styles.eventOptionTextActive
                ]}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.createActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createBtn, creating && styles.createBtnDisabled]} 
              onPress={handleCreate}
              disabled={creating}
            >
              <Text style={styles.createBtnText}>{creating ? 'Creating...' : 'Create'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(true)}>
          <Text style={styles.addButtonText}>+ Add Webhook</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={webhooks}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No webhooks configured</Text>
              <Text style={styles.emptySub}>Add a webhook to receive real-time events</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  createBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  createInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  eventsLabel: { color: '#888', fontSize: 12, marginBottom: 8, textTransform: 'uppercase' },
  eventsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  eventOption: {
    backgroundColor: '#0a0a0a',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  eventOptionActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  eventOptionText: { color: '#888', fontSize: 11 },
  eventOptionTextActive: { color: '#fff' },
  createActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontSize: 14 },
  createBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  webhookCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  webhookHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  webhookUrl: { color: '#fff', fontSize: 13, fontFamily: 'monospace', flex: 1, marginRight: 8 },
  eventsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  eventBadge: {
    backgroundColor: '#6366f120',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  eventText: { color: '#6366f1', fontSize: 11 },
  webhookMeta: { color: '#888', fontSize: 12, marginBottom: 8 },
  deleteBtn: { alignSelf: 'flex-start' },
  deleteText: { color: '#ef4444', fontSize: 13 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8 },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
