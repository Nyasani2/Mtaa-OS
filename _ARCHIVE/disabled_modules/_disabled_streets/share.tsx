import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Share as RNShare, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/stores/auth-store';
import { supabase } from '@/lib/supabase';

export default function ShareScreen() {
  const { contentId } = useLocalSearchParams<{ contentId: string }>();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [saving, setSaving] = useState(false);

  const shareOptions = [
    {
      label: 'Share to Chat',
      icon: 'chatbubble-outline',
      color: '#3b82f6',
      action: () => router.push(`/chat/share?contentId=${contentId}`),
    },
    {
      label: 'Share to Feed',
      icon: 'share-social-outline',
      color: '#10b981',
      action: () => handleRepost(),
    },
    {
      label: 'WhatsApp',
      icon: 'logo-whatsapp',
      color: '#25D366',
      action: () => handleExternalShare('whatsapp'),
    },
    {
      label: 'Telegram',
      icon: 'paper-plane-outline',
      color: '#0088cc',
      action: () => handleExternalShare('telegram'),
    },
    {
      label: 'Copy Link',
      icon: 'link-outline',
      color: '#f59e0b',
      action: () => handleCopyLink(),
    },
    {
      label: 'Save to Device',
      icon: 'download-outline',
      color: '#8b5cf6',
      action: () => handleSave(),
    },
  ];

  const handleRepost = async () => {
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to repost');
      return;
    }
    try {
      await supabase.from('streets_posts').insert({
        user_id: user.id,
        content_type: 'repost',
        original_content_id: contentId,
        caption: 'Reposted content',
      });
      Alert.alert('Reposted', 'Content shared to your feed');
      router.back();
    } catch (err) {
      Alert.alert('Error', 'Failed to repost');
    }
  };

  const handleExternalShare = async (platform: string) => {
    const url = `https://mtaa.afriq/streets/${contentId}`;
    const message = `Check this out on MTAA Streets! ${url}`;

    try {
      await RNShare.share({
        message,
        url,
      });

      // Track share
      await supabase.from('street_shares').insert({
        content_id: contentId,
        user_id: user?.id,
        platform,
      });
    } catch (err) {
      console.log('Share cancelled');
    }
  };

  const handleCopyLink = () => {
    const url = `https://mtaa.afriq/streets/${contentId}`;
    // Clipboard.setString(url);
    Alert.alert('Copied', 'Link copied to clipboard');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('street_saves').insert({
        content_id: contentId,
        user_id: user?.id,
      });
      Alert.alert('Saved', 'Content saved to your collection');
    } catch (err) {
      Alert.alert('Error', 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Share</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.optionsGrid}>
        {shareOptions.map((option, i) => (
          <TouchableOpacity
            key={i}
            style={styles.optionCard}
            onPress={option.action}
          >
            <View style={[styles.optionIcon, { backgroundColor: option.color + '20' }]}>
              <Ionicons name={option.icon as any} size={28} color={option.color} />
            </View>
            <Text style={styles.optionLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
        <Text style={styles.cancelText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#f8fafc' },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  optionCard: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionLabel: { fontSize: 12, color: '#94a3b8', textAlign: 'center', fontWeight: '500' },
  cancelBtn: {
    marginHorizontal: 16,
    marginTop: 20,
    backgroundColor: '#1e293b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  cancelText: { fontSize: 16, fontWeight: '600', color: '#f8fafc' },
});
