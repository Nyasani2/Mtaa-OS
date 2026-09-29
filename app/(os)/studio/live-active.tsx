// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Video, VideoOff, MessageSquare, Heart, X, Settings } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');

export default function LiveActiveScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Stream ID
  const { user } = useAuthStore();
  
  const [isLive, setIsLive] = useState(false);
  const [viewers, setViewers] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [recentTip, setRecentTip] = useState<any>(null);
  const [showChat, setShowChat] = useState(true);

  useEffect(() => {
    // Simulate going live immediately for the host
    setIsLive(true);
    
    // Subscribe to chat and tips for this stream
    const channel = supabase.channel('live_host_' + id)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_stream_messages', filter: 'stream_id=eq.' + id }, (payload) => {
        setComments(prev => [payload.new, ...prev].slice(0, 50));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_stream_tips', filter: 'stream_id=eq.' + id }, (payload) => {
        // Show floating tip notification
        setRecentTip({ amount: payload.new.amount, user: 'A Viewer' });
        setTimeout(() => setRecentTip(null), 3000); // Hide after 3 seconds
        
        // Also add to chat
        setComments(prev => [{ id: Date.now(), user_id: 'system', content: `💎 Received KES ${payload.new.amount} tip!`, is_tip: true }, ...prev].slice(0, 50));
      })
      .subscribe();

    // Mock viewer count increment (replace with LiveKit presence later)
    const viewerInterval = setInterval(() => {
      setViewers(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(viewerInterval);
    };
  }, [id]);

  const handleEndStream = () => {
    Alert.alert('End Stream', 'Are you sure you want to end this broadcast?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: async () => {
        await supabase.from('live_streams').update({ status: 'ended', ended_at: new Date().toISOString() }).eq('id', id);
        router.back();
      }}
    ]);
  };

  return (
    <View style={styles.container}>
      {/* 1. Camera Preview Area (Placeholder for LiveKit Local Video Track) */}
      <View style={styles.cameraPreview}>
        <View style={styles.cameraPlaceholder}>
          <Video size={64} color="#475569" />
          <Text style={styles.cameraText}>Camera Active</Text>
          <Text style={styles.cameraSubtext}>LiveKit publisher will render here</Text>
        </View>
        
        {/* Floating Tip Notification */}
        {recentTip && (
          <View style={styles.tipNotification}>
            <Heart size={16} color="#fff" fill="#ff2d55" />
            <Text style={styles.tipText}>{recentTip.user} sent KES {recentTip.amount}!</Text>
          </View>
        )}
      </View>

      {/* 2. Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity onPress={() => router.back()} style={styles.controlBtn}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
          <View style={styles.viewerBadge}>
            <Text style={styles.viewerText}>{viewers}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.controlBtn}>
          <Settings size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 3. Bottom Controls & Chat */}
      <View style={styles.bottomArea}>
        {showChat && (
          <View style={styles.chatOverlay}>
            {comments.map((c, i) => (
              <View key={i} style={styles.chatBubble}>
                {c.is_tip ? (
                  <Text style={styles.tipChatText}>{c.content}</Text>
                ) : (
                  <Text style={styles.chatText}>
                    <Text style={styles.chatUser}>{c.user_profiles?.full_name || 'User'}: </Text>
                    {c.content}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowChat(!showChat)}>
            <MessageSquare size={24} color={showChat ? "#fff" : "#94a3b8"} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.flipBtn}>
            <VideoOff size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.endBtn} onPress={handleEndStream}>
            <X size={24} color="#fff" />
            <Text style={styles.endText}>END</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  // Camera Preview
  cameraPreview: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  cameraPlaceholder: { alignItems: 'center' },
  cameraText: { color: '#94a3b8', fontSize: 16, fontWeight: '600', marginTop: 12 },
  cameraSubtext: { color: '#475569', fontSize: 12, marginTop: 4 },
  
  // Tip Notification
  tipNotification: { position: 'absolute', top: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 45, 85, 0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, gap: 8 },
  tipText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Top Controls
  topControls: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16 },
  controlBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff2d55' },
  liveText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  viewerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  viewerText: { color: '#fff', fontSize: 11, fontWeight: '700' },

  // Bottom Area
  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: Platform.OS === 'ios' ? 30 : 10 },
  chatOverlay: { height: 200, paddingHorizontal: 16, justifyContent: 'flex-end', marginBottom: 12 },
  chatBubble: { backgroundColor: 'rgba(0,0,0,0.4)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 16, marginBottom: 6, maxWidth: '85%' },
  chatUser: { color: '#0ea5e9', fontSize: 13, fontWeight: '700' },
  chatText: { color: '#fff', fontSize: 13 },
  tipChatText: { color: '#fbbf24', fontSize: 13, fontWeight: '700' },

  // Action Row
  actionRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 10 },
  actionBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  flipBtn: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#475569' },
  endBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ff2d55', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 25, gap: 8 },
  endText: { color: '#fff', fontSize: 14, fontWeight: '800' },
});
