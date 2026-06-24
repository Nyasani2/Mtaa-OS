import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Image,
  Modal, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface ShareTarget {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

interface MessengerShareProps {
  postId?: string;
  liveStreamId?: string;
  visible: boolean;
  onClose: () => void;
}

export default function MessengerShare({ postId, liveStreamId, visible, onClose }: MessengerShareProps) {
  const [recentChats, setRecentChats] = useState<ShareTarget[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecentChats = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('messenger_conversations')
        .select(`
          id,
          participant:user_profiles!messenger_conversations_participant_id_fkey(id, display_name, avatar_url)
        `)
        .eq('user_id', user.id)
        .limit(20);

      setRecentChats((data || []).map((c: any) => ({
        id: c.participant?.id,
        display_name: c.participant?.display_name || 'Unknown',
        avatar_url: c.participant?.avatar_url || null,
      })).filter((c: any) => c.id));
    } catch (e) {
      console.error('Messenger share error:', e);
    } finally {
      setLoading(false);
    }
  };

  const shareToChat = async (targetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let content = '';
      if (postId) content = `Check out this post: /streets/post/${postId}`;
      if (liveStreamId) content = `Join this live stream: /streets/live/${liveStreamId}`;

      await supabase.from('messenger_messages').insert({
        conversation_id: targetId,
        sender_id: user.id,
        content,
        message_type: 'share',
      });

      Alert.alert('Shared!', 'Sent to Messenger.');
      onClose();
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: 500 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Share to Messenger</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={recentChats}
            keyExtractor={c => c.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => shareToChat(item.id)}
                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}
              >
                {item.avatar_url ? (
                  <Image source={{ uri: item.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="person" size={20} color="#fff" />
                  </View>
                )}
                <Text style={{ color: '#fff', fontSize: 15, marginLeft: 12, flex: 1 }}>{item.display_name}</Text>
                <Ionicons name="send" size={20} color="#00d4ff" />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={{ paddingVertical: 30, alignItems: 'center' }}>
                <Ionicons name="chatbubbles" size={48} color="#333" />
                <Text style={{ color: '#666', marginTop: 12 }}>No recent chats</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}
