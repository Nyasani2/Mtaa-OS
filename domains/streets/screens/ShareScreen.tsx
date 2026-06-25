import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share as RNShare,
  Clipboard,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const SHARE_OPTIONS = [
  { icon: 'chatbubbles', label: 'Messenger', color: '#2196F3', action: 'messenger' },
  { icon: 'people', label: 'Tribes', color: '#4CAF50', action: 'tribes' },
  { icon: 'logo-whatsapp', label: 'WhatsApp', color: '#25D366', action: 'whatsapp' },
  { icon: 'logo-twitter', label: 'X / Twitter', color: '#1DA1F2', action: 'twitter' },
  { icon: 'copy', label: 'Copy Link', color: '#aaa', action: 'copy' },
  { icon: 'qr-code', label: 'QR Share', color: '#FF9800', action: 'qr' },
  { icon: 'mail', label: 'Email', color: '#EA4335', action: 'email' },
  { icon: 'share', label: 'More', color: '#9C27B0', action: 'more' },
];

export default function ShareScreen() {
  const router = useRouter();
  const { postId, content } = useLocalSearchParams<{ postId?: string; content?: string }>();
  const { user } = useAuthStore();

  const shareUrl = `https://mtaa.app/streets/post/${postId || 'unknown'}`;
  const shareMessage = content ? String(content).slice(0, 100) : 'Check out this post on MTAA Streets!';

  const handleShare = useCallback(async (action: string) => {
    switch (action) {
      case 'copy':
        Clipboard.setString(shareUrl);
        Alert.alert('Copied', 'Link copied to clipboard');
        break;
      case 'qr':
        Alert.alert('QR Share', `QR code for: ${shareUrl}`);
        break;
      case 'messenger':
        router.push('/(os)/messages');
        break;
      case 'tribes':
        router.push('/(os)/tribes');
        break;
      case 'more':
        try {
          await RNShare.share({
            message: `${shareMessage} ${shareUrl}`,
            url: shareUrl,
            title: 'Share on MTAA Streets',
          });
        } catch { /* user cancelled */ }
        break;
      default:
        try {
          await RNShare.share({ message: `${shareMessage} ${shareUrl}` });
        } catch { /* user cancelled */ }
    }
  }, [shareUrl, shareMessage, router]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.preview}>
        <View style={styles.previewIcon}>
          <Ionicons name="share-social" size={32} color="#2196F3" />
        </View>
        <Text style={styles.previewText} numberOfLines={2}>
          {shareMessage}
        </Text>
        <Text style={styles.previewUrl}>{shareUrl}</Text>
      </View>

      <View style={styles.grid}>
        {SHARE_OPTIONS.map((opt, idx) => (
          <TouchableOpacity key={idx} style={styles.gridItem} onPress={() => handleShare(opt.action)}>
            <View style={[styles.iconCircle, { backgroundColor: opt.color + '20' }]}>
              <Ionicons name={opt.icon as any} size={26} color={opt.color} />
            </View>
            <Text style={styles.gridLabel}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  preview: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0d1f33',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewText: { color: '#fff', fontSize: 15, textAlign: 'center', lineHeight: 22 },
  previewUrl: { color: '#888', fontSize: 12, marginTop: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
    justifyContent: 'center',
  },
  gridItem: { alignItems: 'center', width: 72 },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  gridLabel: { color: '#ccc', fontSize: 12, textAlign: 'center' },
});
