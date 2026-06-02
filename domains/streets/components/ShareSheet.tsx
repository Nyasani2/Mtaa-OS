import React from 'react';
import { View, Text, Pressable, StyleSheet, Share as RNShare } from 'react-native';
import { useShare } from '../hooks/useShare';

interface ShareSheetProps {
  postId: string;
  visible: boolean;
  onClose: () => void;
}

export function ShareSheet({ postId, visible, onClose }: ShareSheetProps) {
  const { copyLink, shareTo, shareToStory } = useShare(postId);

  if (!visible) return null;

  const handleNativeShare = async () => {
    try {
      await RNShare.share({ message: `Check this out on MTAA Streets!`, url: `https://mtaa.app/streets/${postId}` });
    } catch (e) {
      console.log('Share cancelled');
    }
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <Text style={styles.title}>Share</Text>
        <View style={styles.options}>
          <Pressable style={styles.option} onPress={() => shareTo('chat')}>
            <Text style={styles.optionIcon}>💬</Text>
            <Text style={styles.optionLabel}>Message</Text>
          </Pressable>
          <Pressable style={styles.option} onPress={() => shareTo('whatsapp')}>
            <Text style={styles.optionIcon}>📱</Text>
            <Text style={styles.optionLabel}>WhatsApp</Text>
          </Pressable>
          <Pressable style={styles.option} onPress={() => shareTo('telegram')}>
            <Text style={styles.optionIcon}>✈️</Text>
            <Text style={styles.optionLabel}>Telegram</Text>
          </Pressable>
          <Pressable style={styles.option} onPress={handleNativeShare}>
            <Text style={styles.optionIcon}>📤</Text>
            <Text style={styles.optionLabel}>More</Text>
          </Pressable>
        </View>
        <Pressable style={styles.storyBtn} onPress={shareToStory}>
          <Text style={styles.storyText}>📖 Add to Story</Text>
        </Pressable>
        <Pressable style={styles.linkBtn} onPress={copyLink}>
          <Text style={styles.linkText}>🔗 Copy Link</Text>
        </Pressable>
        <Pressable style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: '#fff', padding: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 16 },
  options: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  option: { alignItems: 'center' },
  optionIcon: { fontSize: 32, marginBottom: 4 },
  optionLabel: { fontSize: 12, color: '#555' },
  storyBtn: { padding: 14, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  storyText: { fontSize: 16 },
  linkBtn: { padding: 14, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center' },
  linkText: { fontSize: 16, color: '#333' },
  cancelBtn: { padding: 14, borderTopWidth: 1, borderTopColor: '#eee', alignItems: 'center', marginTop: 8 },
  cancelText: { fontSize: 16, color: '#E91E63', fontWeight: '600' },
});
