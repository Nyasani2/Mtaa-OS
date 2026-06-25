import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function SettingsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [autoplay, setAutoplay] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [hdVideo, setHdVideo] = useState(false);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(true);
  const [allowDownload, setAllowDownload] = useState(true);
  const [allowGifts, setAllowGifts] = useState(true);
  const [allowTips, setAllowTips] = useState(true);
  const [moderatorMode, setModeratorMode] = useState(false);
  const [creatorFund, setCreatorFund] = useState(false);
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [adsEnabled, setAdsEnabled] = useState(false);

  const renderToggle = (icon: string, label: string, value: boolean, onValueChange: (v: boolean) => void) => (
    <View key={label} style={styles.row}>
      <Ionicons name={icon as any} size={20} color="#aaa" style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#333', true: '#2196F3' }}
      />
    </View>
  );

  const renderNav = (icon: string, label: string, onPress: () => void) => (
    <TouchableOpacity key={label} style={styles.row} onPress={onPress}>
      <Ionicons name={icon as any} size={20} color="#aaa" style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#555" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Streets Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Content Preferences</Text>
        {renderToggle('play-circle', 'Autoplay Videos', autoplay, setAutoplay)}
        {renderToggle('volume-high', 'Sound On by Default', soundOn, setSoundOn)}
        {renderToggle('videocam', 'HD Video Upload', hdVideo, setHdVideo)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Controls</Text>
        {renderToggle('lock-closed', 'Private Account', privateAccount, setPrivateAccount)}
        {renderToggle('eye-off', 'Hide Like Counts', hideLikes, setHideLikes)}
        {renderToggle('chatbubble', 'Allow Comments', allowComments, setAllowComments)}
        {renderToggle('git-compare', 'Allow Duets', allowDuet, setAllowDuet)}
        {renderToggle('download', 'Allow Downloads', allowDownload, setAllowDownload)}
        {renderNav('shield-checkmark', 'Blocked Accounts', () => router.push('/(os)/settings/blocked'))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Settings</Text>
        {renderToggle('gift', 'Allow Live Gifts', allowGifts, setAllowGifts)}
        {renderToggle('cash', 'Allow Live Tips', allowTips, setAllowTips)}
        {renderToggle('hammer', 'Moderator Mode', moderatorMode, setModeratorMode)}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monetization</Text>
        {renderToggle('trophy', 'Creator Fund', creatorFund, setCreatorFund)}
        {renderToggle('wallet', 'Tips Enabled', tipsEnabled, setTipsEnabled)}
        {renderToggle('megaphone', 'Ads Enabled', adsEnabled, setAdsEnabled)}
        {renderNav('card', 'Payout Settings', () => router.push('/(os)/wallet'))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Creator</Text>
        {renderNav('checkmark-circle', 'Request Verification', () =>
          Alert.alert('Verification', 'Your request has been submitted for review.')
        )}
        {renderNav('analytics', 'Creator Dashboard', () => router.push('/(os)/analytics'))}
        {renderNav('qr-code', 'QR Profile Share', () =>
          Alert.alert('QR Code', 'QR code copied to clipboard.')
        )}
      </View>

      <TouchableOpacity
        style={styles.osBtn}
        onPress={() => router.push('/(os)/settings')}
      >
        <Ionicons name="settings" size={20} color="#fff" />
        <Text style={styles.osBtnText}>Open MTAA OS Settings</Text>
      </TouchableOpacity>
    </ScrollView>
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
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: {
    color: '#888',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  rowIcon: { marginRight: 12 },
  rowLabel: { flex: 1, color: '#fff', fontSize: 15 },
  osBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2196F3',
    margin: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 40,
    gap: 8,
  },
  osBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
