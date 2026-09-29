// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Dimensions, Alert } from 'react-native';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as LiveService from '@/lib/live/live-streaming.service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const TIP_AMOUNTS = [10, 20, 50, 100, 500, 1000];

export function LiveStreamPlayer({ streamId, onClose }: { streamId: string; onClose: () => void }) {
  const { user } = useAuthStore();
  const [stream, setStream] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [tips, setTips] = useState<any[]>([]);
  const [chatText, setChatText] = useState('');
  const [viewerCount, setViewerCount] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    loadStream();
    
    // Subscribe to real-time updates
    const unsubscribe = LiveService.subscribeToLiveStream(streamId, {
      onViewerCount: setViewerCount,
      onTip: (tip) => setTips(prev => [tip, ...prev]),
      onMessage: (msg) => setMessages(prev => [...prev, msg]),
      onStreamEnd: () => {
        Alert.alert('Stream Ended', 'This live stream has ended.');
        onClose();
      }
    });

    return () => unsubscribe();
  }, [streamId]);

  const loadStream = async () => {
    const data = await LiveService.getLiveStream(streamId);
    setStream(data);
    setViewerCount(data.viewer_count);
    const msgs = await LiveService.getLiveMessages(streamId);
    setMessages(msgs.reverse());
    const streamTips = await LiveService.getStreamTips(streamId);
    setTips(streamTips);
    
    // Join as viewer
    if (user?.id) {
      await LiveService.joinLiveStream(streamId, user.id);
    }
  };

  const sendChat = async () => {
    if (!chatText.trim()) return;
    await LiveService.sendLiveMessage(streamId, chatText);
    setChatText('');
  };

  const sendTip = async (amount: number) => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please login to send tips');
      return;
    }

    Alert.alert(
      `Send KES ${amount} Tip`,
      'Add a message with your tip? (Optional)',
      [
        { text: 'Skip', onPress: () => processTip(amount, '') },
        { 
          text: 'Add Message', 
          onPress: () => {
            setIsTyping(true);
            Alert.prompt(
              'Tip Message',
              'Enter your message (optional)',
              (message) => processTip(amount, message || ''),
              'plain-text'
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const processTip = async (amount: number, message: string) => {
    try {
      // TODO: Integrate payment gateway here
      // For now, simulate payment success
      await LiveService.sendTip(streamId, stream.creator_id, amount, message);
      Alert.alert('Success!', `You sent KES ${amount} to ${stream.creator?.full_name}`);
    } catch (e) {
      Alert.alert('Payment Failed', e.message);
    }
  };

  if (!stream) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading stream...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <View style={styles.videoContainer}>
        {/* In production, this would be a WebRTC/RTMP player */}
        <View style={styles.videoPlaceholder}>
          <Ionicons name="videocam" size={64} color="#64748b" />
          <Text style={styles.placeholderText}>Live Stream Video</Text>
          <Text style={styles.placeholderSubtext}>{stream.title}</Text>
        </View>
        
        {/* Live Badge */}
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>

        {/* Viewer Count */}
        <View style={styles.viewerCount}>
          <Ionicons name="eye" size={16} color="#fff" />
          <Text style={styles.viewerText}>{viewerCount}</Text>
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tips & Chat Section */}
      <View style={styles.bottomSection}>
        {/* Recent Tips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipsScroll}>
          {tips.slice(0, 10).map((tip) => (
            <View key={tip.id} style={styles.tipBadge}>
              <Text style={styles.tipAmount}>💰 KES {tip.amount}</Text>
              <Text style={styles.tipSender}>
                {tip.is_anonymous ? 'Anonymous' : tip.sender?.full_name || 'User'}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Tip Buttons */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tipButtons}>
          {TIP_AMOUNTS.map((amount) => (
            <TouchableOpacity 
              key={amount} 
              style={styles.tipBtn}
              onPress={() => sendTip(amount)}
            >
              <Text style={styles.tipBtnText}>KES {amount}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chat */}
        <ScrollView style={styles.chatContainer} ref={chatEndRef}>
          {messages.map((msg) => (
            <View key={msg.id} style={styles.chatMessage}>
              <Text style={styles.chatName}>{msg.user?.full_name || 'User'}</Text>
              <Text style={styles.chatText}>{msg.content}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Chat Input */}
        <View style={styles.chatInputRow}>
          <TextInput
            value={chatText}
            onChangeText={setChatText}
            placeholder="Send a message..."
            placeholderTextColor="#64748b"
            style={styles.chatInput}
          />
          <TouchableOpacity onPress={sendChat} style={styles.sendBtn}>
            <Ionicons name="send" size={20} color="#0ea5e9" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16 },
  
  videoContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  videoPlaceholder: { alignItems: 'center' },
  placeholderText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  placeholderSubtext: { color: '#94a3b8', fontSize: 14, marginTop: 4 },
  
  liveBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: 6 },
  liveText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  
  viewerCount: {
    position: 'absolute',
    top: 16,
    right: 70,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewerText: { color: '#fff', fontSize: 14, marginLeft: 4 },
  
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  bottomSection: {
    height: 400,
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  
  tipsScroll: { maxHeight: 60, marginBottom: 12 },
  tipBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    alignItems: 'center',
  },
  tipAmount: { color: '#fbbf24', fontWeight: '700', fontSize: 12 },
  tipSender: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
  
  tipButtons: { marginBottom: 12 },
  tipBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  tipBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  
  chatContainer: { flex: 1, marginBottom: 12 },
  chatMessage: { marginBottom: 8 },
  chatName: { color: '#0ea5e9', fontWeight: '600', fontSize: 12 },
  chatText: { color: '#cbd5e1', fontSize: 13, marginTop: 2 },
  
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chatInput: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
