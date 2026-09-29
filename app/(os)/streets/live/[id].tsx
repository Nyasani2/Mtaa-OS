// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, FlatList, StyleSheet, Platform, Modal, Alert, Animated, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Heart, Eye, Radio, Gift, X } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { height, width } = Dimensions.get('window');

export default function LiveWatchScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [stream, setStream] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [showTipModal, setShowTipModal] = useState(false);
  const [sendingTip, setSendingTip] = useState(false);
  
  // Floating Hearts Animation State
  const [hearts, setHearts] = useState<any[]>([]);
  const TREASURY_ID = '1bd9723a-cb56-4df0-982c-4ba04f2b08d3'; 

  useEffect(() => {
    loadStream();
    const sub = supabase.channel('live_'+id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_stream_messages', filter: 'stream_id=eq.'+id }, (payload) => {
        setComments(prev => [payload.new as any, ...prev].slice(0, 50)); // Keep last 50 for performance
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_stream_tips', filter: 'stream_id=eq.'+id }, (payload) => {
        // Add a special system message for tips
        const tipMsg = { id: Date.now().toString(), user_id: 'system', content: `💸 Someone sent a tip of KES ${payload.new.amount}!`, is_tip: true };
        setComments(prev => [tipMsg, ...prev].slice(0, 50));
      })
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, [id]);

  async function loadStream() {
    const { data } = await supabase.from('live_streams').select('*, host:user_id(full_name, avatar_url)').eq('id', id).single();
    if (data) setStream(data);
  }

  async function sendComment() {
    if (!commentText.trim() || !user) return;
    await supabase.from('live_stream_messages').insert({ stream_id: id, user_id: user.id, content: commentText.trim() });
    setCommentText('');
  }

  async function handleTip(amount: number) {
    if (!user) return Alert.alert('Login Required');
    setSendingTip(true);
    try {
      const { error } = await supabase.rpc('send_live_stream_tip', {
        p_stream_id: id, p_sender_id: user.id, p_receiver_id: stream.host_id,
        p_amount: amount * 100, // Convert to cents
        p_message: 'Sent a gift!', p_mtaa_treasury_id: TREASURY_ID
      });
      if (error) throw error;
      setShowTipModal(false);
      Alert.alert('Success', `You sent KES ${amount} to the creator!`);
    } catch (e: any) { Alert.alert('Tip Failed', e.message); }
    finally { setSendingTip(false); }
  }

  const triggerHeart = () => {
    const newHeart = { id: Date.now() + Math.random(), x: Math.random() * 50 + 50 };
    setHearts(prev => [...prev, newHeart]);
    setTimeout(() => setHearts(prev => prev.filter(h => h.id !== newHeart.id)), 2000);
  };

  if (!stream) return <View style={styles.center}><Text style={styles.empty}>Loading stream...</Text></View>;

  return (
    <View style={styles.root}>
      {/* 1. Full Screen Video Background */}
      <Image 
        source={{ uri: stream.thumbnail_url || 'https://via.placeholder.com/400x800/111/fff?text=Live+Stream' }} 
        style={styles.videoBackground} 
        resizeMode="cover" 
      />
      <View style={styles.darkOverlay} />

      {/* 2. Top Header (Host Info & Close) */}
      <View style={styles.topHeader}>
        <View style={styles.hostInfo}>
          <Image source={{ uri: stream.host?.avatar_url || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
          <View>
            <Text style={styles.hostName}>{stream.host?.full_name || 'Host'}</Text>
            <View style={styles.liveBadge}><Radio size={10} color="#fff" /><Text style={styles.liveText}>LIVE</Text></View>
          </View>
          <TouchableOpacity style={styles.followBtn}><Text style={styles.followText}>Follow</Text></TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}><X size={24} color="#fff" /></TouchableOpacity>
      </View>

      {/* 3. Floating Hearts (Right Side) */}
      <View style={styles.heartsContainer}>
        {hearts.map(h => (
          <Animated.View key={h.id} style={[styles.floatingHeart, { left: h.x }]}><Heart size={24} color="#ff2d55" fill="#ff2d55" /></Animated.View>
        ))}
      </View>

      {/* 4. Right Side Action Buttons */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={triggerHeart}><Heart size={28} color="#fff" /></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => setShowTipModal(true)}>
          <Gift size={28} color="#fff" />
          <Text style={styles.actionText}>Tip</Text>
        </TouchableOpacity>
        <View style={styles.actionBtn}><Eye size={24} color="#fff" /><Text style={styles.actionText}>{stream.active_cameras || 1}</Text></View>
      </View>

      {/* 5. Bottom Chat Overlay (Transparent) */}
      <View style={styles.bottomArea}>
        <View style={styles.chatOverlay}>
          <FlatList
            data={comments}
            inverted
            keyExtractor={c => c.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.chatBubble}>
                {item.is_tip ? (
                  <Text style={styles.tipText}>{item.content}</Text>
                ) : (
                  <>
                    <Text style={styles.chatUser}>{item.user_profiles?.full_name || 'User'}: </Text>
                    <Text style={styles.chatText}>{item.content}</Text>
                  </>
                )}
              </View>
            )}
          />
        </View>

        {/* Chat Input */}
        <View style={styles.inputRow}>
          <TextInput 
            style={styles.chatInput} placeholder="Say something nice..." placeholderTextColor="#888" 
            value={commentText} onChangeText={setCommentText} onSubmitEditing={sendComment}
          />
          <TouchableOpacity onPress={sendComment} style={styles.sendBtn}><Send size={18} color="#fff" /></TouchableOpacity>
        </View>
      </View>

      {/* 6. Quick Tip Modal (OnlyFans Style) */}
      <Modal visible={showTipModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.tipModal}>
            <Text style={styles.tipTitle}>Send a Gift</Text>
            <Text style={styles.tipSub}>Support the creator directly</Text>
            <View style={styles.tipGrid}>
              {[10, 20, 50, 100, 200, 500].map(amt => (
                <TouchableOpacity key={amt} style={styles.tipChip} onPress={() => handleTip(amt)} disabled={sendingTip}>
                  <Text style={styles.tipChipText}>KES {amt}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowTipModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  empty: { color: '#888' },
  videoBackground: { position: 'absolute', top: 0, left: 0, width, height },
  darkOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.2)' },
  
  // Top Header
  topHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 16 },
  hostInfo: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 20, padding: 6, paddingRight: 12 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8, borderWidth: 1, borderColor: '#ff2d55' },
  hostName: { color: '#fff', fontSize: 13, fontWeight: '700' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff2d55', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  liveText: { color: '#fff', fontSize: 9, fontWeight: '800', marginLeft: 4 },
  followBtn: { backgroundColor: '#ff2d55', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginLeft: 12 },
  followText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },

  // Hearts & Actions
  heartsContainer: { position: 'absolute', right: 20, bottom: 200, height: 300, width: 50 },
  floatingHeart: { position: 'absolute', bottom: 0 },
  rightActions: { position: 'absolute', right: 16, bottom: 120, alignItems: 'center', gap: 20 },
  actionBtn: { alignItems: 'center', marginBottom: 16 },
  actionText: { color: '#fff', fontSize: 11, fontWeight: '700', marginTop: 4 },

  // Bottom Chat
  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: Platform.OS === 'ios' ? 30 : 10 },
  chatOverlay: { height: 250, paddingHorizontal: 16, justifyContent: 'flex-end' },
  chatBubble: { backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 6, maxWidth: '80%' },
  chatUser: { color: '#0ea5e9', fontSize: 13, fontWeight: '700' },
  chatText: { color: '#fff', fontSize: 13 },
  tipText: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },
  
  inputRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10 },
  chatInput: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  sendBtn: { marginLeft: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: '#ff2d55', justifyContent: 'center', alignItems: 'center' },

  // Tip Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  tipModal: { backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  tipTitle: { color: '#fff', fontSize: 20, fontWeight: '800', textAlign: 'center' },
  tipSub: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 20 },
  tipGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 },
  tipChip: { backgroundColor: '#334155', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 16, minWidth: 100, alignItems: 'center', borderWidth: 1, borderColor: '#475569' },
  tipChipText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { marginTop: 20, alignItems: 'center' },
  cancelText: { color: '#94a3b8', fontSize: 16, fontWeight: '600' },
});
