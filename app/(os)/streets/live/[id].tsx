import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  FlatList, Alert, ActivityIndicator, TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';

interface LiveRoom {
  id: string;
  host_id: string;
  host_name: string;
  title: string;
  viewer_count: number;
  is_live: boolean;
  ticket_price: number;
  is_private: boolean;
  co_hosts: string[];
  gifts_enabled: boolean;
  created_at: string;
}

interface LiveMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  gift_amount: number | null;
  created_at: string;
}

export default function LiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [room, setRoom] = useState<LiveRoom | null>(null);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (id) {
      loadRoom();
      subscribeToMessages();
    }
  }, [id]);

  const loadRoom = async () => {
    try {
      const { data, error } = await supabase
        .from('live_rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRoom(data);
      setIsHost(data.host_id === user?.id);
      setIsJoined(true);

      // Increment viewer count
      await supabase.from('live_rooms').update({
        viewer_count: data.viewer_count + 1,
      }).eq('id', id);
    } catch (err) {
      console.error('Live room error:', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`live:${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_messages',
        filter: `room_id=eq.${id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as LiveMessage]);
        flatListRef.current?.scrollToEnd({ animated: true });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    await supabase.from('live_messages').insert({
      room_id: id,
      sender_id: user.id,
      sender_name: user.user_metadata?.display_name || 'User',
      text: newMessage.trim(),
    });

    setNewMessage('');
  };

  const handleGift = async (amount: number) => {
    if (!user) return;
    // Deduct from wallet
    const { error } = await supabase.rpc('send_gift', {
      sender_id: user.id,
      recipient_id: room?.host_id,
      amount,
      room_id: id,
    });

    if (!error) {
      await supabase.from('live_messages').insert({
        room_id: id,
        sender_id: user.id,
        sender_name: user.user_metadata?.display_name || 'User',
        text: `sent a gift of KES ${amount}`,
        gift_amount: amount,
      });
    }
  };

  const handleRaiseHand = async () => {
    setHandRaised(!handRaised);
    await supabase.from('live_hand_raises').insert({
      room_id: id,
      user_id: user?.id,
      status: handRaised ? 'lowered' : 'raised',
    });
  };

  const handleInviteCoHost = async (userId: string) => {
    await supabase.from('live_co_host_invites').insert({
      room_id: id,
      invited_user_id: userId,
      status: 'pending',
    });
  };

  const handleEndLive = async () => {
    Alert.alert('End Live', 'Are you sure you want to end this live session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('live_rooms').update({ is_live: false }).eq('id', id);
          router.back();
        },
      },
    ]);
  };

  const handleLeave = async () => {
    if (room) {
      await supabase.from('live_rooms').update({
        viewer_count: Math.max(0, room.viewer_count - 1),
      }).eq('id', id);
    }
    router.back();
  };

  const renderMessage = ({ item }: { item: LiveMessage }) => (
    <View style={styles.messageRow}>
      <Text style={styles.messageSender}>{item.sender_name}</Text>
      <Text style={item.gift_amount ? styles.giftText : styles.messageText}>
        {item.gift_amount ? `🎁 ${item.text}` : item.text}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#ef4444" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Live Header */}
      <View style={styles.liveHeader}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
        <View style={styles.viewerCount}>
          <Ionicons name="eye-outline" size={14} color="#fff" />
          <Text style={styles.viewerText}>{room?.viewer_count || 0}</Text>
        </View>
        <TouchableOpacity onPress={handleLeave}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Host Info */}
      <View style={styles.hostInfo}>
        <View style={styles.hostAvatar}>
          <Text style={styles.hostAvatarText}>
            {room?.host_name?.charAt(0).toUpperCase() || 'H'}
          </Text>
        </View>
        <View>
          <Text style={styles.hostName}>{room?.host_name}</Text>
          <Text style={styles.roomTitle}>{room?.title}</Text>
        </View>
        {!isHost && (
          <TouchableOpacity style={styles.followBtn} onPress={() => {}}>
            <Text style={styles.followText}>Follow</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Gift Panel */}
      <View style={styles.giftPanel}>
        <TouchableOpacity style={styles.giftBtn} onPress={() => handleGift(50)}>
          <Text style={styles.giftEmoji}>🌹</Text>
          <Text style={styles.giftAmount}>50</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.giftBtn} onPress={() => handleGift(100)}>
          <Text style={styles.giftEmoji}>🎁</Text>
          <Text style={styles.giftAmount}>100</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.giftBtn} onPress={() => handleGift(500)}>
          <Text style={styles.giftEmoji}>💎</Text>
          <Text style={styles.giftAmount}>500</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.giftBtn} onPress={() => handleGift(1000)}>
          <Text style={styles.giftEmoji}>👑</Text>
          <Text style={styles.giftAmount}>1K</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TextInput
          style={styles.messageInput}
          placeholder="Say something..."
          placeholderTextColor="#64748b"
          value={newMessage}
          onChangeText={setNewMessage}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity onPress={handleSendMessage}>
          <Ionicons name="send" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRaiseHand}>
          <Ionicons name="hand-left-outline" size={24} color={handRaised ? '#f59e0b' : '#f8fafc'} />
        </TouchableOpacity>
        {isHost && (
          <TouchableOpacity onPress={handleEndLive}>
            <Ionicons name="stop-circle" size={28} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  liveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  viewerCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  viewerText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  hostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hostAvatarText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  hostName: { fontSize: 15, fontWeight: '700', color: '#f8fafc' },
  roomTitle: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  followBtn: {
    marginLeft: 'auto',
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  followText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  messagesList: { padding: 16, paddingBottom: 200 },
  messageRow: { marginBottom: 6 },
  messageSender: { fontSize: 13, fontWeight: '700', color: '#3b82f6' },
  messageText: { fontSize: 13, color: '#e2e8f0' },
  giftText: { fontSize: 13, color: '#f59e0b', fontWeight: '600' },
  giftPanel: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  giftBtn: { alignItems: 'center' },
  giftEmoji: { fontSize: 24 },
  giftAmount: { fontSize: 11, color: '#f59e0b', fontWeight: '600' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  messageInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
});
