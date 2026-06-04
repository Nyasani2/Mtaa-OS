// hooks/useMessages.ts
import { create } from 'zustand';
import { useIdentity } from '@/hooks/useAuthStore';
import { supabase } from '@/lib/supabase/client';

export interface Conversation {
  id: string;
  participant_ids: string[];
  participant_names: Record<string, string>;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  is_group: boolean;
  group_name?: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'location';
  attachments?: string[];
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface MessageState {
  conversations: Conversation[];
  activeMessages: Message[];
  activeConversationId: string | null;
  isLoading: boolean;
  error: string | null;

  loadConversations: () => Promise<void>;
  loadMessages: (conversationId: string) => Promise<void>;
  sendMessage: (conversationId: string, content: string, type?: Message['type']) => Promise<boolean>;
  createConversation: (participantIds: string[], groupName?: string) => Promise<string | null>;
  markAsRead: (conversationId: string) => Promise<void>;
  getConversationById: (id: string) => Conversation | undefined;
  clearActiveConversation: () => void;
  clearError: () => void;
}

export const useMessages = create<MessageState>((set, get) => ({
  conversations: [],
  activeMessages: [],
  activeConversationId: null,
  isLoading: false,
  error: null,

  loadConversations: async () => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ conversations: [] });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .contains('participant_ids', [user.id])
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      set({ conversations: (data || []) as Conversation[] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadMessages: async (conversationId: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return;

    set({ activeConversationId: conversationId, isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      set({ activeMessages: (data || []) as Message[] });

      // Mark messages as read
      await get().markAsRead(conversationId);
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  sendMessage: async (conversationId: string, content: string, type: Message['type'] = 'text') => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) {
      set({ error: 'Not authenticated' });
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_name: user.user_metadata?.full_name || user.email || 'User',
          content,
          type,
          is_read: false,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      set((state) => ({
        activeMessages: [...state.activeMessages, data as Message],
      }));
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  createConversation: async (participantIds: string[], groupName?: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return null;

    const allParticipants = [...new Set([user.id, ...participantIds])];

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_ids: allParticipants,
          participant_names: {}, // Will be populated by trigger
          is_group: allParticipants.length > 2,
          group_name: groupName,
          unread_count: 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    }
  },

  markAsRead: async (conversationId: string) => {
    const { user, isAuthenticated } = useIdentity.getState();
    if (!isAuthenticated || !user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('sender_id', user.id)
        .eq('is_read', false);
    } catch (err) {
      console.warn('Failed to mark messages as read:', err);
    }
  },

  getConversationById: (id: string) => get().conversations.find(c => c.id === id),
  clearActiveConversation: () => set({ activeConversationId: null, activeMessages: [] }),
  clearError: () => set({ error: null }),
}));

export default useMessages;
