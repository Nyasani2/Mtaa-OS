import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, TextInput,
  FlatList, Animated, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import {
  Video, MessageCircle, Heart, Share2, X, Send, Users,
  Mic, MicOff, Camera, CameraOff, Monitor, Smartphone,
  DollarSign, Settings, Eye, ChevronUp, ChevronDown,
  Crown, Zap, Gift, Ban, Volume2, VolumeX
} from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const { width, height } = Dimensions.get('window');
const CHAT_HEIGHT = height * 0.4;

interface LiveMessage {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  text: string;
  type: 'chat' | 'super_chat' | 'gift' | 'system';
  amount?: number;
  timestamp: Date;
}

interface ConnectedPhone {
  id: string;
  name: string;
  isActive: boolean;
  battery: number;
  isMain: boolean;
}

export default function LiveStreamActiveScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [permission, requestPermission] = useCameraPermissions();
  const [isLive, setIsLive] = useState(true);
  const [viewerCount, setViewerCount] = useState(1247);
  const [likes, setLikes] = useState(3420);
  const [chatVisible, setChatVisible] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<LiveMessage[]>([
    { id: '1', userId: 'u1', username: 'Wanjiku_MTAA', text: '🔥 This is amazing!', type: 'chat', timestamp: new Date() },
    { id: '2', userId: 'u2', username: 'ChefKevo', text: 'Super Chat: KES 50', type: 'super_chat', amount: 50, timestamp: new Date() },
    { id: '3', userId: 'u3', username: 'NairobiVibes', text: 'Gifted 🎁 Diamond', type: 'gift', amount: 100, timestamp: new Date() },
    { id: '4', userId: 'u4', username: 'System', text: 'User MtaaFan joined the stream', type: 'system', timestamp: new Date() },
  ]);
  const [connectedPhones, setConnectedPhones] = useState<ConnectedPhone[]>([
    { id: 'main', name: 'Main Camera', isActive: true, battery: 85, isMain: true },
    { id: 'phone1', name: 'Phone 1', isActive: true, battery: 72, isMain: false },
    { id: 'phone2', name: 'Phone 2', isActive: true, battery: 60, isMain: false },
  ]);
  const [activePhoneId, setActivePhoneId] = useState('main');
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showPhoneSwitcher, setShowPhoneSwitcher] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [revenue, setRevenue] = useState(1250);
  const [revenueToast, setRevenueToast] = useState<string | null>(null);

  const chatListRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(CHAT_HEIGHT)).current;
  const revenueAnim = useRef(new Animated.Value(0)).current;

  const streamTitle = params.title as string || 'Untitled Live Stream';

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 10) - 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatVisible) {
      Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start();
    } else {
      Animated.timing(slideAnim, { toValue: CHAT_HEIGHT, duration: 300, useNativeDriver: true }).start();
    }
  }, [chatVisible]);

  const showRevenueToast = useCallback((msg: string) => {
    setRevenueToast(msg);
    Animated.sequence([
      Animated.timing(revenueAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(revenueAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setRevenueToast(null));
  }, []);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const newMsg: LiveMessage = {
      id: Date.now().toString(),
      userId: user?.id || 'anon',
      username: user?.display_name || 'You',
      text: chatInput,
      type: 'chat',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMsg]);
    setChatInput('');
    setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendSuperChat = () => {
    Alert.alert('Super Chat', 'Send a paid message (KES 50+)', [
      { text: 'KES 50', onPress: () => { setRevenue(r => r + 50); showRevenueToast('💰 +KES 50 Super Chat!'); } },
      { text: 'KES 100', onPress: () => { setRevenue(r => r + 100); showRevenueToast('💰 +KES 100 Super Chat!'); } },
      { text: 'KES 500', onPress: () => { setRevenue(r => r + 500); showRevenueToast('💰 +KES 500 Super Chat!'); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const sendGift = () => {
    Alert.alert('Send Gift', 'Support the streamer', [
      { text: '🎁 Gift KES 20', onPress: () => { setRevenue(r => r + 20); showRevenueToast('🎁 +KES 20 Gift!'); } },
      { text: '💎 Diamond KES 100', onPress: () => { setRevenue(r => r + 100); showRevenueToast('💎 +KES 100 Diamond!'); } },
      { text: '👑 Crown KES 500', onPress: () => { setRevenue(r => r + 500); showRevenueToast('👑 +KES 500 Crown!'); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const switchPhone = (phoneId: string) => {
    setActivePhoneId(phoneId);
    setConnectedPhones(prev => prev.map(p => ({ ...p, isMain: p.id === phoneId })));
    setShowPhoneSwitcher(false);
  };

  const endStream = () => {
    Alert.alert('End Stream', `Total revenue: KES ${revenue}. End now?`, [
      { text: 'Keep Streaming', style: 'cancel' },
      { text: 'End & Save', onPress: () => router.push('/(os)/studio/drafts') },
    ]);
  };

  const renderMessage = ({ item }: { item: LiveMessage }) => {
    if (item.type === 'system') {
      return (
        <View style={styles.systemMessage}>
          <Text style={styles.systemText}>{item.text}</Text>
        </View>
      );
    }
    if (item.type === 'super_chat') {
      return (
        <View style={styles.superChatBubble}>
          <Crown size={14} color="#FFD700" />
          <Text style={styles.superChatText}>{item.username}: {item.text}</Text>
          <Text style={styles.superChatAmount}>KES {item.amount}</Text>
        </View>
      );
    }
    if (item.type === 'gift') {
      return (
        <View style={styles.giftBubble}>
          <Gift size={14} color="#FF6B9D" />
          <Text style={styles.giftText}>{item.username} {item.text}</Text>
          {item.amount && <Text style={styles.giftAmount}>KES {item.amount}</Text>}
        </View>
      );
    }
    return (
      <View style={styles.chatBubble}>
        <Text style={styles.chatUsername}>{item.username}</Text>
        <Text style={styles.chatText}>{item.text}</Text>
      </View>
    );
  };

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission needed for live stream</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Camera Feed */}
      <CameraView style={styles.camera} facing={activePhoneId === 'main' ? 'back' : 'front'}>
        <View style={styles.overlay}>
          {/* Top Bar */}
          <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconButton}>
              <X size={22} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
            <View style={styles.viewerBadge}>
              <Eye size={14} color="#FFF" />
              <Text style={styles.viewerText}>{viewerCount.toLocaleString()}</Text>
            </View>
            <TouchableOpacity style={styles.iconButton} onPress={() => setShowSettings(!showSettings)}>
              <Settings size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Revenue Toast */}
          {revenueToast && (
            <Animated.View style={[styles.revenueToast, { opacity: revenueAnim, transform: [{ translateY: revenueAnim.interpolate({ inputRange: [0,1], outputRange: [-50,0] }) }] }]}>
              <Zap size={16} color="#FFD700" />
              <Text style={styles.revenueToastText}>{revenueToast}</Text>
            </Animated.View>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <View style={styles.settingsPanel}>
              <TouchableOpacity style={styles.settingsRow} onPress={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX size={18} color="#FFF" /> : <Volume2 size={18} color="#FFF" />}
                <Text style={styles.settingsText}>{isMuted ? 'Unmute Stream' : 'Mute Stream'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Stream Quality', 'Current: 1080p 60fps')}>
                <Monitor size={18} color="#FFF" />
                <Text style={styles.settingsText}>Quality: 1080p 60fps</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsRow} onPress={() => Alert.alert('Report', 'Report this stream?')}>
                <Ban size={18} color="#EF4444" />
                <Text style={[styles.settingsText, { color: '#EF4444' }]}>Report Stream</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Connected Phones Strip */}
          <View style={styles.phoneStrip}>
            {connectedPhones.map(phone => (
              <TouchableOpacity
                key={phone.id}
                style={[styles.phonePill, phone.isMain && styles.phonePillActive]}
                onPress={() => switchPhone(phone.id)}
              >
                <Smartphone size={14} color={phone.isMain ? '#10B981' : '#FFF'} />
                <Text style={[styles.phonePillText, phone.isMain && styles.phonePillTextActive]}>
                  {phone.name} {phone.battery}%
                </Text>
                {phone.isActive && <View style={styles.phoneLiveDot} />}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addPhonePill} onPress={() => router.push('/(os)/studio/pairing')}>
              <Text style={styles.addPhoneText}>+</Text>
            </TouchableOpacity>
          </View>

          {/* Chat Overlay */}
          {chatVisible && (
            <Animated.View style={[styles.chatContainer, { transform: [{ translateY: slideAnim }] }]}>
              <FlatList
                ref={chatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                style={styles.chatList}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() => chatListRef.current?.scrollToEnd({ animated: true })}
              />
            </Animated.View>
          )}

          {/* Bottom Controls */}
          <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.controlRow}>
              <TouchableOpacity style={styles.controlBtn} onPress={() => setIsMicOn(!isMicOn)}>
                {isMicOn ? <Mic size={22} color="#FFF" /> : <MicOff size={22} color="#EF4444" />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={() => setIsCameraOn(!isCameraOn)}>
                {isCameraOn ? <Camera size={22} color="#FFF" /> : <CameraOff size={22} color="#EF4444" />}
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={sendSuperChat}>
                <Crown size={22} color="#FFD700" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={sendGift}>
                <Gift size={22} color="#FF6B9D" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={() => setChatVisible(!chatVisible)}>
                <MessageCircle size={22} color={chatVisible ? '#10B981' : '#FFF'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.controlBtn} onPress={() => Alert.alert('Share', 'Share stream link')}>
                <Share2 size={22} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Chat Input */}
            {chatVisible && (
              <View style={styles.chatInputRow}>
                <TextInput
                  style={styles.chatInput}
                  placeholder="Say something..."
                  placeholderTextColor="#9CA3AF"
                  value={chatInput}
                  onChangeText={setChatInput}
                  onSubmitEditing={sendMessage}
                  returnKeyType="send"
                />
                <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
                  <Send size={18} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.likeBtn} onPress={() => setLikes(l => l + 1)}>
                  <Heart size={18} color="#EF4444" fill="#EF4444" />
                  <Text style={styles.likeCount}>{likes}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* End Stream Button */}
            <TouchableOpacity style={styles.endStreamBtn} onPress={endStream}>
              <Text style={styles.endStreamText}>🔴 END STREAM</Text>
              <Text style={styles.revenueText}>KES {revenue} earned</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.15)' },
  permissionText: { color: '#FFF', fontSize: 16, textAlign: 'center', marginTop: 200 },
  permissionButton: { backgroundColor: '#7C3AED', padding: 16, borderRadius: 12, margin: 40, alignItems: 'center' },
  permissionButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
  },
  iconButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EF4444', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  liveText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 1 },
  viewerBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, gap: 6 },
  viewerText: { color: '#FFF', fontWeight: '600', fontSize: 12 },

  revenueToast: {
    position: 'absolute', top: 80, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
  },
  revenueToastText: { color: '#FFD700', fontWeight: '700', fontSize: 14 },

  settingsPanel: {
    position: 'absolute', top: 70, right: 16,
    backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 12, padding: 12, width: 200, gap: 8,
  },
  settingsRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  settingsText: { color: '#FFF', fontSize: 14, fontWeight: '500' },

  phoneStrip: {
    position: 'absolute', top: 70, left: 16,
    flexDirection: 'row', gap: 8, flexWrap: 'wrap', maxWidth: width * 0.6,
  },
  phonePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  phonePillActive: { backgroundColor: 'rgba(16,185,129,0.3)', borderWidth: 1, borderColor: '#10B981' },
  phonePillText: { color: '#FFF', fontSize: 11, fontWeight: '500' },
  phonePillTextActive: { color: '#10B981', fontWeight: '700' },
  phoneLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  addPhonePill: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(124,58,237,0.6)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#7C3AED', borderStyle: 'dashed',
  },
  addPhoneText: { color: '#7C3AED', fontWeight: '700', fontSize: 18 },

  chatContainer: {
    position: 'absolute', bottom: 180, left: 0, right: 0,
    height: CHAT_HEIGHT, paddingHorizontal: 12,
  },
  chatList: { flex: 1 },
  chatBubble: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 10, marginBottom: 4, alignSelf: 'flex-start' },
  chatUsername: { color: '#10B981', fontWeight: '700', fontSize: 11 },
  chatText: { color: '#FFF', fontSize: 13, marginTop: 2 },
  superChatBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,215,0,0.15)', borderWidth: 1, borderColor: '#FFD700',
    padding: 8, borderRadius: 10, marginBottom: 4, alignSelf: 'flex-start',
  },
  superChatText: { color: '#FFF', fontSize: 13, flex: 1 },
  superChatAmount: { color: '#FFD700', fontWeight: '800', fontSize: 12 },
  giftBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,107,157,0.15)', borderWidth: 1, borderColor: '#FF6B9D',
    padding: 8, borderRadius: 10, marginBottom: 4, alignSelf: 'flex-start',
  },
  giftText: { color: '#FFF', fontSize: 13, flex: 1 },
  giftAmount: { color: '#FF6B9D', fontWeight: '800', fontSize: 12 },
  systemMessage: { alignSelf: 'center', marginVertical: 4 },
  systemText: { color: '#9CA3AF', fontSize: 11, fontStyle: 'italic' },

  bottomControls: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  controlRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  controlBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  chatInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  chatInput: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', color: '#FFF',
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, fontSize: 14,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', alignItems: 'center', justifyContent: 'center' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.2)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  likeCount: { color: '#EF4444', fontWeight: '700', fontSize: 12 },

  endStreamBtn: {
    backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 12,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
  },
  endStreamText: { color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 1 },
  revenueText: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },
});
