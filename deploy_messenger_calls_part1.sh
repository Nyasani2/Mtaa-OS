#!/bin/bash
# ============================================
# MTAA OS — MESSENGER + CALLS DEPLOYMENT
# Phase: Core Communication Layer
# SQL + React Components
# Run from: ~/MTAA_OS_V10
# ============================================

cd ~/MTAA_OS_V10

# ============================================
# STEP 1 — CREATE DIRECTORIES
# ============================================

mkdir -p app/\(messenger\)
mkdir -p app/\(calls\)
mkdir -p app/\(messenger\)/chat
mkdir -p app/\(messenger\)/contacts
mkdir -p app/\(messenger\)/groups
mkdir -p app/\(messenger\)/channels
mkdir -p app/\(messenger\)/settings
mkdir -p app/\(calls\)/history
mkdir -p app/\(calls\)/dialer
mkdir -p app/\(calls\)/voicemail
mkdir -p components/messenger
mkdir -p components/calls
mkdir -p lib/messenger
mkdir -p lib/calls
mkdir -p backend/sql

# ============================================
# STEP 2 — SQL SCHEMA (Messenger + Calls Tables)
# ============================================

cat << 'EOF' > backend/sql/061_messenger_calls.sql
-- MTAA OS — MESSENGER + CALLS FULL SCHEMA
-- 18 Tables + RLS + Indexes + Triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. CONVERSATIONS (Threads)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('direct', 'group', 'channel')),
  title TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  is_encrypted BOOLEAN DEFAULT TRUE,
  disappearing_timer INTEGER DEFAULT 0, -- seconds, 0 = off
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_sender_id UUID,
  unread_count INTEGER DEFAULT 0,
  pinned_message_id UUID,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CONVERSATION PARTICIPANTS
CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ,
  is_muted BOOLEAN DEFAULT FALSE,
  mute_until TIMESTAMPTZ,
  notification_settings JSONB DEFAULT '{"all": true}',
  UNIQUE(conversation_id, user_id)
);

-- 3. MESSAGES
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('text', 'image', 'video', 'audio', 'voice', 'file', 'location', 'contact', 'poll', 'system')),
  content TEXT,
  content_encrypted TEXT, -- E2E encrypted content blob
  media_urls JSONB DEFAULT '[]',
  file_metadata JSONB, -- {name, size, mime_type}
  reply_to_message_id UUID REFERENCES messages(id),
  forwarded_from_message_id UUID REFERENCES messages(id),
  forwarded_from_conversation_id UUID,
  reactions JSONB DEFAULT '{}', -- {user_id: emoji}
  mentions JSONB DEFAULT '[]', -- [user_id]
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMPTZ,
  disappearing_started_at TIMESTAMPTZ,
  read_by JSONB DEFAULT '[]', -- [user_id]
  delivered_to JSONB DEFAULT '[]', -- [user_id]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MESSAGE REACTIONS (Expanded)
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, emoji)
);

-- 5. MESSAGE READ RECEIPTS
CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- 6. PINNED MESSAGES
CREATE TABLE pinned_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  pinned_by UUID NOT NULL,
  pinned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(conversation_id, message_id)
);

-- 7. USER PRESENCE / ONLINE STATUS
CREATE TABLE user_presence (
  user_id UUID PRIMARY KEY,
  status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'away', 'busy', 'offline', 'invisible')),
  last_seen_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  is_typing_in UUID REFERENCES conversations(id),
  typing_started_at TIMESTAMPTZ,
  device_status JSONB DEFAULT '{}', -- {device_id, platform, client_version}
  custom_status TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONTACTS / ADDRESS BOOK
CREATE TABLE user_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL,
  contact_user_id UUID,
  phone_number TEXT,
  name TEXT NOT NULL,
  avatar_url TEXT,
  is_blocked BOOLEAN DEFAULT FALSE,
  block_reason TEXT,
  is_muted BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  contact_source TEXT DEFAULT 'manual', -- manual, sync, qr, share
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_id, contact_user_id)
);

-- 9. CALLS
CREATE TABLE calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video', 'conference')),
  initiated_by UUID NOT NULL,
  conversation_id UUID REFERENCES conversations(id),
  status TEXT DEFAULT 'ringing' CHECK (status IN ('ringing', 'connected', 'ended', 'missed', 'declined', 'busy', 'failed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  was_recorded BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  recording_consent JSONB DEFAULT '{}', -- {user_id: boolean}
  quality_metrics JSONB DEFAULT '{}', -- {mos, jitter, packet_loss, rtt}
  ended_reason TEXT,
  is_encrypted BOOLEAN DEFAULT TRUE,
  sfu_room_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CALL PARTICIPANTS
CREATE TABLE call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT FALSE,
  is_video_enabled BOOLEAN DEFAULT TRUE,
  is_screen_sharing BOOLEAN DEFAULT FALSE,
  is_host BOOLEAN DEFAULT FALSE,
  device_info JSONB DEFAULT '{}',
  network_info JSONB DEFAULT '{}' -- {ip, ice_candidate, connection_type}
);

-- 11. CALL HISTORY / LOGS
CREATE TABLE call_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing', 'missed')),
  contact_name TEXT,
  contact_avatar TEXT,
  is_video BOOLEAN DEFAULT FALSE,
  duration_seconds INTEGER DEFAULT 0,
  status TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. VOICEMAIL
CREATE TABLE voicemails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  call_id UUID REFERENCES calls(id),
  audio_url TEXT NOT NULL,
  duration_seconds INTEGER,
  transcript TEXT,
  is_listened BOOLEAN DEFAULT FALSE,
  listened_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. STORIES / STATUS UPDATES
CREATE TABLE stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'text')),
  content TEXT,
  media_url TEXT,
  background_color TEXT,
  font_style TEXT,
  viewers JSONB DEFAULT '[]',
  expires_at TIMESTAMPTZ NOT NULL,
  is_archived BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. STORY VIEWS
CREATE TABLE story_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES stories(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  reaction TEXT,
  UNIQUE(story_id, viewer_id)
);

-- 15. POLL OPTIONS
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_multiple_choice BOOLEAN DEFAULT FALSE,
  is_anonymous BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. POLL VOTES
CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_index INTEGER NOT NULL,
  user_id UUID NOT NULL,
  voted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id, option_index)
);

-- 17. MESSAGE SEARCH INDEX
CREATE TABLE message_search_index (
  message_id UUID PRIMARY KEY REFERENCES messages(id) ON DELETE CASCADE,
  search_vector TSVECTOR,
  content_text TEXT,
  conversation_id UUID,
  sender_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. CALL QUALITY TELEMETRY
CREATE TABLE call_quality_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  mos_score NUMERIC(3,2), -- Mean Opinion Score 1.0-5.0
  jitter_ms NUMERIC(8,2),
  packet_loss_pct NUMERIC(5,2),
  rtt_ms NUMERIC(8,2),
  bandwidth_kbps NUMERIC(10,2),
  resolution TEXT,
  fps INTEGER,
  codec TEXT,
  ice_state TEXT,
  network_type TEXT
);

-- INDEXES
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_calls_initiator ON calls(initiated_by);
CREATE INDEX idx_call_history_user ON call_history(user_id, created_at DESC);
CREATE INDEX idx_contacts_owner ON user_contacts(owner_id);
CREATE INDEX idx_stories_user ON stories(user_id, expires_at);
CREATE INDEX idx_stories_expires ON stories(expires_at);
CREATE INDEX idx_search_vector ON message_search_index USING GIN(search_vector);
CREATE INDEX idx_presence_status ON user_presence(status);
CREATE INDEX idx_voicemails_recipient ON voicemails(recipient_id, created_at DESC);
CREATE INDEX idx_call_quality_call ON call_quality_logs(call_id, timestamp DESC);

-- RLS POLICIES
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE voicemails ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversations participant read" ON conversations FOR SELECT USING (
  id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Conversations participant write" ON conversations FOR ALL USING (
  id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid() AND role IN ('owner', 'admin'))
);
CREATE POLICY "Messages participant read" ON messages FOR SELECT USING (
  conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Messages sender write" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND conversation_id IN (SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Calls participant read" ON calls FOR SELECT USING (
  id IN (SELECT call_id FROM call_participants WHERE user_id = auth.uid())
);
CREATE POLICY "Call history user read" ON call_history FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Contacts owner read" ON user_contacts FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Contacts owner write" ON user_contacts FOR ALL USING (owner_id = auth.uid());
CREATE POLICY "Stories friends read" ON stories FOR SELECT USING (
  user_id = auth.uid() OR user_id IN (SELECT contact_user_id FROM user_contacts WHERE owner_id = auth.uid() AND is_blocked = FALSE)
);
CREATE POLICY "Voicemails recipient read" ON voicemails FOR SELECT USING (recipient_id = auth.uid());

-- TRIGGERS
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations SET
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    last_message_sender_id = NEW.sender_id,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_last_message AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION update_conversation_last_message();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_presence_updated_at BEFORE UPDATE ON user_presence FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Search index trigger
CREATE OR REPLACE FUNCTION update_message_search_index()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO message_search_index (message_id, search_vector, content_text, conversation_id, sender_id)
  VALUES (NEW.id, to_tsvector('english', COALESCE(NEW.content, '')), NEW.content, NEW.conversation_id, NEW.sender_id)
  ON CONFLICT (message_id) DO UPDATE SET
    search_vector = to_tsvector('english', COALESCE(NEW.content, '')),
    content_text = NEW.content,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER message_search_index_trigger AFTER INSERT OR UPDATE ON messages
FOR EACH ROW EXECUTE FUNCTION update_message_search_index();

SELECT 'MESSENGER + CALLS SCHEMA COMPLETE — 18 tables, indexes, RLS, triggers created' AS status;
EOF

# ============================================
# STEP 3 — MESSENGER LAYOUT
# ============================================

cat << 'EOF' > app/\(messenger\)/_layout.tsx
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function MessengerLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="chat/[id]" />
        <Stack.Screen name="contacts/index" />
        <Stack.Screen name="groups/index" />
        <Stack.Screen name="channels/index" />
        <Stack.Screen name="settings/index" />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
EOF

# ============================================
# STEP 4 — MESSENGER HOME (Conversation List)
# ============================================

cat << 'EOF' > app/\(messenger\)/index.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Ionicons } from '@expo/vector-icons';

interface Conversation {
  id: string;
  type: string;
  title: string;
  avatar_url: string;
  last_message_preview: string;
  last_message_at: string;
  last_message_sender_id: string;
  unread_count: number;
  is_encrypted: boolean;
  participants: Array<{ user_id: string; role: string }>;
}

export default function MessengerHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'direct' | 'group' | 'channel'>('all');

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('conversation_participants')
      .select('*, conversation:conversations(*)')
      .eq('user_id', user.id)
      .order('conversation.last_message_at', { ascending: false });

    const mapped = (data || []).map((p: any) => ({
      ...p.conversation,
      participants: p.conversation?.participants || []
    }));
    setConversations(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  }, [fetchConversations]);

  const filtered = conversations.filter(c => {
    const matchesFilter = filter === 'all' || c.type === filter;
    const matchesSearch = !searchQuery || c.title?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusColor = (type: string) => {
    const colors: Record<string, string> = { direct: '#10B981', group: '#3B82F6', channel: '#8B5CF6' };
    return colors[type] || '#6B7280';
  };

  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      onPress={() => router.push(`/messenger/chat/${item.id}`)}
      className="flex-row items-center p-4 bg-white border-b border-gray-100 active:bg-gray-50"
    >
      <View className="relative">
        <Image
          source={{ uri: item.avatar_url || 'https://via.placeholder.com/56' }}
          className="w-14 h-14 rounded-full"
        />
        {item.is_encrypted && (
          <View className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
            <Ionicons name="lock-closed" size={10} color="white" />
          </View>
        )}
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-center">
          <Text className="font-semibold text-gray-900 text-base">{item.title || 'Untitled'}</Text>
          <Text className="text-xs text-gray-400">
            {item.last_message_at ? new Date(item.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </Text>
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <Text className="text-sm text-gray-500 flex-1" numberOfLines={1}>
            {item.last_message_preview || 'No messages yet'}
          </Text>
          {item.unread_count > 0 && (
            <View className="bg-blue-600 rounded-full min-w-[20px] h-5 items-center justify-center ml-2">
              <Text className="text-white text-xs font-bold px-1.5">{item.unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-blue-900 px-4 pt-12 pb-4">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-white text-2xl font-bold">Messages</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity onPress={() => router.push('/messenger/contacts')}>
              <Ionicons name="people" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/calls')}>
              <Ionicons name="call" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
        <View className="flex-row items-center bg-white/20 rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color="white" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            className="flex-1 ml-2 text-white"
          />
        </View>
      </View>

      <View className="flex-row px-4 py-3 bg-white border-b border-gray-200">
        {[{ key: 'all', label: 'All' }, { key: 'direct', label: 'Direct' }, { key: 'group', label: 'Groups' }, { key: 'channel', label: 'Channels' }].map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFilter(f.key as any)}
            className={`px-4 py-1.5 rounded-full mr-2 ${filter === f.key ? 'bg-blue-600' : 'bg-gray-100'}`}
          >
            <Text className={`text-sm font-medium ${filter === f.key ? 'text-white' : 'text-gray-600'}`}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View className="items-center py-20">
            <Ionicons name="chatbubbles" size={64} color="#E5E7EB" />
            <Text className="text-gray-400 mt-4 text-lg">No conversations yet</Text>
            <TouchableOpacity
              onPress={() => router.push('/messenger/contacts')}
              className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Start a conversation</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <TouchableOpacity
        onPress={() => router.push('/messenger/contacts')}
        className="absolute bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg"
      >
        <Ionicons name="create" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
EOF

# ============================================
# STEP 5 — CHAT SCREEN (Full Conversation)
# ============================================

cat << 'EOF' > app/\(messenger\)/chat/\[id\].tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/stores/auth-store';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  sender_id: string;
  type: string;
  content: string;
  media_urls: string[];
  reactions: Record<string, string>;
  reply_to_message_id: string;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  read_by: string[];
  sender_name?: string;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversation, setConversation] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*, sender:users(full_name)')
      .eq('conversation_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    const mapped = (data || []).map((m: any) => ({
      ...m,
      sender_name: m.sender?.full_name || 'Unknown'
    }));
    setMessages(mapped);
  }, [id]);

  const fetchConversation = useCallback(async () => {
    const { data } = await supabase
      .from('conversations')
      .select('*, participants:conversation_participants(*)')
      .eq('id', id)
      .single();
    setConversation(data);
  }, [id]);

  useEffect(() => {
    fetchMessages();
    fetchConversation();

    const subscription = supabase
      .channel(`conversation:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${id}` }, (payload) => {
        setMessages(prev => [...prev, { ...payload.new, sender_name: 'Loading...' }]);
      })
      .subscribe();

    return () => { supabase.removeChannel(subscription); };
  }, [id, fetchMessages, fetchConversation]);

  const sendMessage = async () => {
    if (!inputText.trim() || !user) return;
    const { error } = await supabase.from('messages').insert({
      conversation_id: id,
      sender_id: user.id,
      type: 'text',
      content: inputText.trim(),
      reply_to_message_id: replyingTo?.id || null
    });
    if (!error) {
      setInputText('');
      setReplyingTo(null);
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    await supabase.from('message_reactions').upsert({
      message_id: messageId,
      user_id: user?.id,
      emoji
    }, { onConflict: 'message_id,user_id,emoji' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    return (
      <View className={`flex-row ${isMe ? 'justify-end' : 'justify-start'} mb-3 px-3`}>
        {!isMe && (
          <Image
            source={{ uri: 'https://via.placeholder.com/32' }}
            className="w-8 h-8 rounded-full mr-2 self-end"
          />
        )}
        <View className={`max-w-[75%] ${isMe ? 'bg-blue-600' : 'bg-white'} rounded-2xl px-4 py-2.5 shadow-sm`}>
          {!isMe && <Text className="text-xs text-gray-500 mb-1">{item.sender_name}</Text>}
          {item.reply_to_message_id && (
            <View className="bg-black/10 rounded-lg p-2 mb-2">
              <Text className="text-xs text-gray-600 italic">Replying to message...</Text>
            </View>
          )}
          <Text className={`text-sm ${isMe ? 'text-white' : 'text-gray-800'}`}>{item.content}</Text>
          <View className="flex-row items-center justify-end mt-1">
            <Text className={`text-xs ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
              {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {isMe && (
              <Ionicons
                name={item.read_by?.length > 0 ? "checkmark-done" : "checkmark"}
                size={14}
                color={item.read_by?.length > 0 ? '#60A5FA' : '#93C5FD'}
                className="ml-1"
              />
            )}
          </View>
          {Object.keys(item.reactions || {}).length > 0 && (
            <View className="flex-row flex-wrap mt-1 -mb-1">
              {Object.entries(item.reactions).map(([uid, emoji]) => (
                <Text key={uid} className="text-sm mr-1">{emoji}</Text>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-100"
    >
      <View className="bg-blue-900 px-4 pt-12 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Image
          source={{ uri: conversation?.avatar_url || 'https://via.placeholder.com/40' }}
          className="w-10 h-10 rounded-full"
        />
        <View className="flex-1 ml-3">
          <Text className="text-white font-semibold text-base">{conversation?.title || 'Chat'}</Text>
          <Text className="text-blue-300 text-xs">
            {conversation?.is_encrypted ? '🔒 End-to-end encrypted' : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={() => router.push(`/calls?conversation=${id}`)}>
          <Ionicons name="call" size={22} color="white" className="mr-4" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Ionicons name="videocam" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        className="flex-1"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />

      {replyingTo && (
        <View className="bg-white px-4 py-2 border-t border-gray-200 flex-row items-center">
          <View className="flex-1">
            <Text className="text-xs text-gray-500">Replying to</Text>
            <Text className="text-sm text-gray-800" numberOfLines={1}>{replyingTo.content}</Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <Ionicons name="close" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      )}

      <View className="bg-white px-4 py-3 flex-row items-center border-t border-gray-200">
        <TouchableOpacity className="mr-2">
          <Ionicons name="add-circle" size={28} color="#6B7280" />
        </TouchableOpacity>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message..."
          multiline
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 max-h-24 text-gray-800"
        />
        <TouchableOpacity onPress={sendMessage} className="ml-2 w-10 h-10 bg-blue-600 rounded-full items-center justify-center">
          <Ionicons name="send" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
EOF

echo "Part 1 complete: SQL Schema + Messenger Layout + Home + Chat Screen"
