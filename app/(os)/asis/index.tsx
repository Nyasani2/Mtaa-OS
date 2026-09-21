// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ActivityIndicator, ScrollView, Image, Alert, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import { useASIS } from '@/lib/asis-cse/asis-cse-provider';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { ASISSidebar } from '@/components/ASISSidebar';

export default function ASISChatScreen() {
  const [inputText, setInputText] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  
  const { sendMessage, currentConversation, isProcessing, newConversation, switchConversation } = useASIS();
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (scrollViewRef.current) scrollViewRef.current.scrollToEnd({ animated: true });
  }, [currentConversation?.messages]);

  const toggleAttachMenu = () => setShowAttachMenu(!showAttachMenu);

  const pickFromGallery = async () => {
    setShowAttachMenu(false);
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setSelectedMedia({ type: 'image', uri: result.assets[0].uri, name: result.assets[0].fileName || 'image.jpg' });
  };

  const pickFromCamera = async () => {
    setShowAttachMenu(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission Denied', 'Camera access is required');
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!result.canceled && result.assets[0]) setSelectedMedia({ type: 'image', uri: result.assets[0].uri, name: `photo_${Date.now()}.jpg` });
  };

  const pickFile = async () => {
    setShowAttachMenu(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) setSelectedMedia({ type: 'document', uri: result.assets[0].uri, name: result.assets[0].name || 'document.pdf', size: result.assets[0].size });
    } catch (error) { Alert.alert('Error', 'Failed to pick file'); }
  };

  const startRecording = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') return Alert.alert('Permission Required', 'Microphone permission is needed');
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) { Alert.alert('Error', 'Failed to start recording'); }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      if (recording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecording(null);
        Alert.alert('Recording Saved', `Audio saved at: ${uri}`);
        // TODO: Integrate with voice engine to transcribe
      }
    } catch (err) { console.error('Failed to stop recording', err); }
  };

  const toggleRecording = async () => {
    if (isRecording) await stopRecording();
    else await startRecording();
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedMedia) return;
    let messageContent = inputText.trim();
    if (selectedMedia) messageContent += ` [Attached: ${selectedMedia.type} - ${selectedMedia.name}]`;
    await sendMessage(messageContent);
    setInputText('');
    setSelectedMedia(null);
    setShowAttachMenu(false);
  };

  const userName = user?.email?.split('@')[0] || 'User';

  return (
    <View style={styles.container}>
      <ASISSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onNewChat={() => { newConversation(); setSidebarVisible(false); }}
        onSelectConversation={(id) => { switchConversation(id); setSidebarVisible(false); }}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setSidebarVisible(true)} style={styles.menuButton}>
          <Ionicons name="menu" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>ASIS</Text>
          <Text style={styles.headerSub}>Hi, {userName}!</Text>
        </View>
        <View style={styles.headerStatus}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Online</Text>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
        {currentConversation?.messages.map((msg: any) => (
          <View key={msg.id} style={[styles.messageBubble, msg.role === 'user' ? styles.messageUser : styles.messageAssistant]}>
            {msg.role === 'asis' && (
              <View style={styles.avatarContainer}>
                <View style={styles.asisArrayAvatar}><Ionicons name="sparkles" size={12} color="#fff" /></View>
              </View>
            )}
            <View style={[styles.messageContent, msg.role === 'user' && styles.messageUserContent]}>
              <Text style={styles.messageText}>{msg.content}</Text>
              <Text style={styles.messageTime}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
          </View>
        ))}
        {isProcessing && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#8b5cf6" />
            <Text style={styles.typingText}>ASIS is thinking...</Text>
          </View>
        )}
      </ScrollView>

      {selectedMedia && (
        <View style={styles.mediaPreview}>
          {selectedMedia.type === 'image' ? (
            <Image source={{ uri: selectedMedia.uri }} style={styles.mediaImage} />
          ) : (
            <View style={styles.documentPreview}>
              <Ionicons name="document-text-outline" size={32} color="#2563eb" />
              <Text style={styles.documentName} numberOfLines={1}>{selectedMedia.name}</Text>
            </View>
          )}
          <TouchableOpacity onPress={() => setSelectedMedia(null)} style={styles.mediaClear}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      )}

      {showAttachMenu && (
        <View style={styles.menuOverlay} onStartShouldSetResponder={() => { toggleAttachMenu(); return true; }}>
          <View style={styles.attachMenu}>
            <TouchableOpacity style={styles.menuItem} onPress={pickFromGallery}>
              <Ionicons name="images-outline" size={24} color="#60a5fa" />
              <Text style={styles.menuItemText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={pickFromCamera}>
              <Ionicons name="camera-outline" size={24} color="#60a5fa" />
              <Text style={styles.menuItemText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={pickFile}>
              <Ionicons name="document-outline" size={24} color="#60a5fa" />
              <Text style={styles.menuItemText}>File</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton} onPress={toggleAttachMenu}>
            <Ionicons name="add" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <TextInput
            style={styles.input} placeholder="Message ASIS..." placeholderTextColor="#64748b"
            value={inputText} onChangeText={setInputText} multiline maxLength={2000} editable={!isProcessing}
            onSubmitEditing={handleSend} returnKeyType="send" blurOnSubmit={false}
          />
          <TouchableOpacity style={[styles.voiceButton, isRecording && styles.voiceButtonRecording]} onPress={toggleRecording} disabled={isProcessing}>
            <Ionicons name={isRecording ? 'stop' : 'mic'} size={20} color={isRecording ? '#ef4444' : '#94a3b8'} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sendButton, (!inputText.trim() && !selectedMedia) || isProcessing ? styles.sendButtonDisabled : {}]} onPress={handleSend} disabled={(!inputText.trim() && !selectedMedia) || isProcessing}>
            {isProcessing ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
        <Text style={styles.inputHint}>Press Enter to send</Text>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  menuButton: { padding: 4 }, headerCenter: { alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#60a5fa', marginTop: 2 },
  headerStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#00ff88' },
  statusText: { fontSize: 11, color: '#00ff88', fontWeight: '600' },
  messagesContainer: { flex: 1 }, messagesContent: { padding: 16, paddingBottom: 8 },
  messageBubble: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16, gap: 8 },
  messageUser: { justifyContent: 'flex-end' }, messageAssistant: { justifyContent: 'flex-start' },
  avatarContainer: { marginBottom: 4 },
  asisArrayAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  messageContent: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: '#1e293b', borderBottomLeftRadius: 4 },
  messageUserContent: { backgroundColor: '#3b82f6', borderBottomRightRadius: 4, borderBottomLeftRadius: 16 },
  messageText: { color: '#fff', fontSize: 15, lineHeight: 20 },
  messageTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 4, textAlign: 'right' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#1e293b', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomLeftRadius: 4, marginBottom: 8, gap: 8 },
  typingText: { color: '#94a3b8', fontSize: 13 },
  mediaPreview: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155' },
  mediaImage: { width: 60, height: 60, borderRadius: 8 },
  documentPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 8, maxWidth: 250 },
  documentName: { color: '#e2e8f0', fontSize: 13, flex: 1 }, mediaClear: { marginLeft: 8, padding: 4 },
  menuOverlay: { position: 'absolute', bottom: 70, left: 12, right: 12, zIndex: 100 },
  attachMenu: { flexDirection: 'row', backgroundColor: 'rgba(30, 41, 59, 0.95)', borderRadius: 16, padding: 8, borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8, justifyContent: 'space-around' },
  menuItem: { flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12 },
  menuItemText: { color: '#e2e8f0', fontSize: 11, marginTop: 4, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155', gap: 10 },
  attachButton: { padding: 10, marginBottom: 4 },
  input: { flex: 1, backgroundColor: '#0f172a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', fontSize: 15, maxHeight: 120, minHeight: 44, marginBottom: 4 },
  voiceButton: { padding: 10, marginBottom: 4, borderRadius: 20, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155' },
  voiceButtonRecording: { backgroundColor: '#fef2f2', borderColor: '#ef4444' },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  sendButtonDisabled: { backgroundColor: '#334155' },
  inputHint: { textAlign: 'center', fontSize: 11, color: '#64748b', paddingVertical: 6, backgroundColor: '#0f172a' },
});
