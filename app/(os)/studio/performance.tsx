import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function PerformanceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [adaptiveBitrate, setAdaptiveBitrate] = useState(true);
  const [backgroundUpload, setBackgroundUpload] = useState(true);
  const [resumeUpload, setResumeUpload] = useState(true);
  const [autoTranscode, setAutoTranscode] = useState(true);
  const [lowBandwidth, setLowBandwidth] = useState(false);
  const [offlineDownload, setOfflineDownload] = useState(true);
  const [cdnEnabled, setCdnEnabled] = useState(true);
  const [qualityPreference, setQualityPreference] = useState<'auto' | 'hd' | 'sd' | 'data-saver'>('auto');

  const stats = {
    uploadSpeed: '4.2 Mbps',
    cdnLatency: '45ms',
    cacheHit: '94%',
    activeStreams: '1.2M',
    transcodingQueue: 3,
    bandwidthSaved: '2.4 TB',
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Performance</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Live Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Feather name="upload-cloud" size={20} color="#10b981" />
            <Text style={styles.statValue}>{stats.uploadSpeed}</Text>
            <Text style={styles.statLabel}>Upload Speed</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="zap" size={20} color="#6366f1" />
            <Text style={styles.statValue}>{stats.cdnLatency}</Text>
            <Text style={styles.statLabel}>CDN Latency</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="database" size={20} color="#f59e0b" />
            <Text style={styles.statValue}>{stats.cacheHit}</Text>
            <Text style={styles.statLabel}>Cache Hit</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="users" size={20} color="#ec4899" />
            <Text style={styles.statValue}>{stats.activeStreams}</Text>
            <Text style={styles.statLabel}>Active Streams</Text>
          </View>
        </View>

        {/* Streaming Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Streaming</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="activity" size={18} color="#6366f1" />
              <View>
                <Text style={styles.settingName}>Adaptive Bitrate</Text>
                <Text style={styles.settingDesc}>Auto-adjust quality based on connection</Text>
              </View>
            </View>
            <Switch value={adaptiveBitrate} onValueChange={setAdaptiveBitrate} trackColor={{ false: '#333', true: '#6366f1' }} thumbColor={adaptiveBitrate ? '#fff' : '#666'} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="wifi" size={18} color="#10b981" />
              <View>
                <Text style={styles.settingName}>Low Bandwidth Mode</Text>
                <Text style={styles.settingDesc}>Optimize for slow connections</Text>
              </View>
            </View>
            <Switch value={lowBandwidth} onValueChange={setLowBandwidth} trackColor={{ false: '#333', true: '#10b981' }} thumbColor={lowBandwidth ? '#fff' : '#666'} />
          </View>

          <Text style={styles.subLabel}>Default Quality</Text>
          <View style={styles.qualityRow}>
            {[
              { id: 'auto', label: 'Auto', desc: 'Best for your connection' },
              { id: 'hd', label: 'HD', desc: '720p - 1080p' },
              { id: 'sd', label: 'SD', desc: '480p' },
              { id: 'data-saver', label: 'Data Saver', desc: '360p' },
            ].map(q => (
              <TouchableOpacity key={q.id} onPress={() => setQualityPreference(q.id as any)} style={[styles.qualityBtn, qualityPreference === q.id && styles.qualityBtnActive]}>
                <Text style={[styles.qualityLabel, qualityPreference === q.id && styles.qualityLabelActive]}>{q.label}</Text>
                <Text style={[styles.qualityDesc, qualityPreference === q.id && styles.qualityDescActive]}>{q.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upload Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upload Optimization</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="cloud" size={18} color="#f59e0b" />
              <View>
                <Text style={styles.settingName}>Background Upload</Text>
                <Text style={styles.settingDesc}>Continue uploading when app is closed</Text>
              </View>
            </View>
            <Switch value={backgroundUpload} onValueChange={setBackgroundUpload} trackColor={{ false: '#333', true: '#f59e0b' }} thumbColor={backgroundUpload ? '#fff' : '#666'} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="refresh-cw" size={18} color="#ec4899" />
              <View>
                <Text style={styles.settingName}>Resume Interrupted Uploads</Text>
                <Text style={styles.settingDesc}>Pick up where you left off</Text>
              </View>
            </View>
            <Switch value={resumeUpload} onValueChange={setResumeUpload} trackColor={{ false: '#333', true: '#ec4899' }} thumbColor={resumeUpload ? '#fff' : '#666'} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="film" size={18} color="#8b5cf6" />
              <View>
                <Text style={styles.settingName}>Auto Transcoding</Text>
                <Text style={styles.settingDesc}>Convert to multiple formats automatically</Text>
              </View>
            </View>
            <Switch value={autoTranscode} onValueChange={setAutoTranscode} trackColor={{ false: '#333', true: '#8b5cf6' }} thumbColor={autoTranscode ? '#fff' : '#666'} />
          </View>
        </View>

        {/* CDN & Distribution */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Global Distribution</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="globe" size={18} color="#06b6d4" />
              <View>
                <Text style={styles.settingName}>CDN Enabled</Text>
                <Text style={styles.settingDesc}>Content delivered from nearest edge server</Text>
              </View>
            </View>
            <Switch value={cdnEnabled} onValueChange={setCdnEnabled} trackColor={{ false: '#333', true: '#06b6d4' }} thumbColor={cdnEnabled ? '#fff' : '#666'} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="download" size={18} color="#10b981" />
              <View>
                <Text style={styles.settingName}>Offline Downloads</Text>
                <Text style={styles.settingDesc}>Download videos for offline viewing</Text>
              </View>
            </View>
            <Switch value={offlineDownload} onValueChange={setOfflineDownload} trackColor={{ false: '#333', true: '#10b981' }} thumbColor={offlineDownload ? '#fff' : '#666'} />
          </View>
        </View>

        {/* Infrastructure Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Infrastructure</Text>
          <View style={styles.infraCard}>
            <View style={styles.infraRow}>
              <Text style={styles.infraLabel}>Transcoding Queue</Text>
              <Text style={styles.infraValue}>{stats.transcodingQueue} jobs</Text>
            </View>
            <View style={styles.infraRow}>
              <Text style={styles.infraLabel}>Bandwidth Saved</Text>
              <Text style={styles.infraValue}>{stats.bandwidthSaved}</Text>
            </View>
            <View style={styles.infraRow}>
              <Text style={styles.infraLabel}>Edge Locations</Text>
              <Text style={styles.infraValue}>12 across Africa</Text>
            </View>
            <View style={styles.infraRow}>
              <Text style={styles.infraLabel}>Storage Used</Text>
              <Text style={styles.infraValue}>847 GB</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 16 },
  statCard: { width: '47%', backgroundColor: '#141414', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 8 },
  statLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '600', marginTop: 2 },

  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  settingDesc: { color: '#666', fontSize: 12, marginTop: 2, lineHeight: 18 },
  subLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 8, textTransform: 'uppercase' },

  qualityRow: { flexDirection: 'row', gap: 8 },
  qualityBtn: { flex: 1, alignItems: 'center', backgroundColor: '#1f1f1f', padding: 10, borderRadius: 8 },
  qualityBtnActive: { borderWidth: 1, borderColor: '#6366f1' },
  qualityLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  qualityLabelActive: { color: '#6366f1' },
  qualityDesc: { color: '#666', fontSize: 10, marginTop: 2 },
  qualityDescActive: { color: '#6366f1' },

  infraCard: { backgroundColor: '#141414', borderRadius: 12, padding: 16 },
  infraRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  infraLabel: { color: '#9ca3af', fontSize: 13 },
  infraValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
