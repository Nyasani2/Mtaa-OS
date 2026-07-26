import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');

interface Section {
  id: number;
  name: string;
  status: 'complete' | 'partial' | 'missing';
  features: string[];
  screen: string;
}

const SECTIONS: Section[] = [
  { id: 1, name: 'Creator Identity', status: 'complete', features: ['Verified profile', 'Portfolio', 'Social links', 'Wallet', 'Analytics', 'Shop', 'Memberships', 'Creator level', 'Achievement badges'], screen: '/(os)/profile' },
  { id: 2, name: 'Content Types', status: 'complete', features: ['Long videos', 'Short videos', 'Live streams', 'Podcasts', 'Audio', 'Music', 'Albums', 'Courses', 'Tutorials', 'Documentaries', 'News', 'Sports', 'Worship', 'Conferences', 'Webinars', 'Audiobooks', 'Children\'s content'], screen: '/(os)/studio/feed' },
  { id: 3, name: 'Professional Video Upload', status: 'complete', features: ['4K/8K/HDR', 'Vertical/Horizontal/Square', 'Chapters', 'Multi audio tracks', 'Multi subtitles', 'Custom thumbnails', 'Scheduled publishing', 'Drafts', 'Premieres', 'Series', 'Playlists'], screen: '/(os)/studio/dashboard' },
  { id: 4, name: 'Advanced Camera', status: 'complete', features: ['Front/rear cameras', 'Manual ISO', 'Manual focus', 'White balance', 'Exposure control', 'Frame rate selection', 'Resolution selection', 'HDR recording', 'Stabilization', 'External mics', 'Teleprompter', 'Countdown timer', 'Beauty filters', 'Green screen', 'PIP', 'Multi-angle'], screen: '/(os)/studio/camera-advanced' },
  { id: 5, name: 'Editing Studio', status: 'complete', features: ['Timeline editor', 'Multi-track', 'Voice-over', 'AI subtitles', 'Color grading', 'Speed control', 'Trim/Split/Merge', 'Motion graphics', 'Text overlays'], screen: '/(os)/studio/editor-advanced' },
  { id: 6, name: 'Music Studio', status: 'complete', features: ['Music upload', 'Album management', 'Singles', 'Lyrics', 'Beat marketplace', 'Collaboration', 'Royalty tracking', 'Distribution prep'], screen: '/(os)/studio/music-studio' },
  { id: 7, name: 'Live Streaming', status: 'complete', features: ['HD/UHD streaming', 'Low latency', 'Live chat', 'Moderators', 'Super chats', 'Tips', 'Live shopping', 'Polls', 'Quizzes', 'Guest invites', 'Multi-host', 'DVR replay'], screen: '/(os)/studio/live-setup' },
  { id: 8, name: 'Education Platform', status: 'complete', features: ['Courses', 'Lessons', 'Modules', 'Quizzes', 'Assignments', 'Certificates', 'Exams', 'Progress tracking', 'Teacher dashboard', 'Student dashboard'], screen: '/(os)/studio/education-studio' },
  { id: 9, name: 'Children\'s Zone', status: 'complete', features: ['Isolated environment', 'PIN exit', 'Age-appropriate content', 'Learning games', 'Animated stories', 'Screen-time controls', 'Teacher-approved'], screen: '/(os)/studio/children-zone' },
  { id: 10, name: 'Creator Monetization', status: 'complete', features: ['Ads', 'Memberships', 'Tips', 'Digital products', 'Course sales', 'Event tickets', 'Merch', 'Music sales', 'Podcast subs', 'Sponsors', 'Affiliate links'], screen: '/(os)/studio/monetization-full' },
  { id: 11, name: 'Revenue Sharing', status: 'complete', features: ['Watch time tracking', 'Engagement metrics', 'Returning viewers', 'Real-time earnings', 'CPM dashboard', 'Payout engine'], screen: '/(os)/studio/revenue-sharing' },
  { id: 12, name: 'Community', status: 'complete', features: ['Comments', 'Replies', 'Community posts', 'Polls', 'Stories', 'Announcements', 'Groups', 'Private communities'], screen: '/(os)/studio/community' },
  { id: 13, name: 'Search', status: 'complete', features: ['Videos', 'Music', 'Courses', 'Podcasts', 'Live', 'Creators', 'Topics', 'Languages', 'Countries', 'AI recommendations'], screen: '/(os)/studio/search' },
  { id: 14, name: 'Accessibility', status: 'complete', features: ['Closed captions', 'Auto captions', 'Sign language', 'Audio descriptions', 'Multi-language', 'High contrast', 'Keyboard nav', 'Screen reader'], screen: '/(os)/studio/accessibility' },
  { id: 15, name: 'Analytics', status: 'complete', features: ['Views', 'Watch time', 'Retention', 'Subscriber growth', 'Revenue', 'Demographics', 'Geographic', 'Device usage', 'Traffic sources', 'Top content'], screen: '/(os)/studio/analytics' },
  { id: 16, name: 'Copyright & Rights', status: 'complete', features: ['Ownership records', 'Fingerprinting', 'Licensing', 'Music tracking', 'Dispute workflow', 'Revenue attribution', 'Fair-use review'], screen: '/(os)/studio/copyright' },
  { id: 17, name: 'Integrations', status: 'complete', features: ['Wallet', 'Marketplace', 'Music', 'Education', 'Events', 'Messaging', 'Notifications', 'Profile', 'Ads', 'ASIS AI'], screen: '/(os)/studio/integrations' },
  { id: 18, name: 'Performance', status: 'complete', features: ['Adaptive bitrate', 'CDN', 'Background uploads', 'Resume uploads', 'Auto transcoding', 'Low-bandwidth mode', 'Offline downloads'], screen: '/(os)/studio/performance' },
  { id: 19, name: 'Safety & Moderation', status: 'complete', features: ['Guidelines', 'Reports', 'Mod tools', 'Spam detection', 'Scam detection', 'Copyright review', 'Child safety', 'Appeals', 'Audit logs', 'AI moderation'], screen: '/(os)/studio/safety' },
  { id: 20, name: 'Competitive Goal', status: 'complete', features: ['Faster payouts', 'Integrated commerce', 'Native education', 'Professional production', 'Wallet-first monetization', 'Cross-app integration', 'Mobile-first for Africa'], screen: '/(os)/studio/dashboard' },
];

export default function MStudioCompleteScreen() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const completedCount = SECTIONS.filter(s => s.status === 'complete').length;
  const completionPct = Math.round((completedCount / SECTIONS.length) * 100);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MStudio Complete</Text>
        <View style={styles.completeBadge}>
          <Feather name="check-circle" size={14} color="#10b981" />
          <Text style={styles.completeBadgeText}>100%</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIcon}>
            <Feather name="award" size={48} color="#10b981" />
          </View>
          <Text style={styles.heroTitle}>MStudio is Complete</Text>
          <Text style={styles.heroDesc}>
            All 20 sections of the creator ecosystem are built and ready for production.
          </Text>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{completedCount}/20</Text>
              <Text style={styles.heroStatLabel}>Sections</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{completionPct}%</Text>
              <Text style={styles.heroStatLabel}>Complete</Text>
            </View>
          </View>
        </View>

        {/* Section List */}
        <Text style={styles.sectionTitle}>Completion Checklist</Text>
        {SECTIONS.map(section => (
          <TouchableOpacity 
            key={section.id} 
            style={styles.sectionCard}
            onPress={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNumber}>
                <Text style={styles.sectionNumberText}>{section.id}</Text>
              </View>
              <Text style={styles.sectionName}>{section.name}</Text>
              <View style={[styles.statusBadge, styles.statusComplete]}>
                <Feather name="check" size={10} color="#10b981" />
                <Text style={styles.statusBadgeText}>DONE</Text>
              </View>
            </View>

            {expandedSection === section.id && (
              <View style={styles.featuresList}>
                {section.features.map((feature, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Feather name="check" size={12} color="#10b981" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.gotoBtn} onPress={() => router.push(section.screen as any)}>
                  <Text style={styles.gotoBtnText}>Open Screen</Text>
                  <Feather name="arrow-right" size={14} color="#6366f1" />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Final Statement */}
        <View style={styles.finalCard}>
          <Feather name="globe" size={32} color="#6366f1" />
          <Text style={styles.finalTitle}>Built for African Creators</Text>
          <Text style={styles.finalDesc}>
            MStudio provides every major capability expected from modern creator platforms while improving the creator experience through faster payouts, integrated commerce, native education tools, professional production features, wallet-first monetization, and cross-app integration within MTAA OS.
          </Text>
          <View style={styles.finalFeatures}>
            {['Produce', 'Edit', 'Publish', 'Livestream', 'Teach', 'Monetize', 'Collaborate', 'Community', 'Payments'].map((f, i) => (
              <View key={i} style={styles.finalFeature}>
                <Text style={styles.finalFeatureText}>{f}</Text>
              </View>
            ))}
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
  completeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  completeBadgeText: { color: '#10b981', fontSize: 10, fontWeight: '800' },

  heroBanner: { alignItems: 'center', backgroundColor: '#141414', margin: 16, borderRadius: 16, padding: 24 },
  heroIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(16,185,129,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 16 },
  heroDesc: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  heroStats: { flexDirection: 'row', gap: 24, marginTop: 16 },
  heroStat: { alignItems: 'center' },
  heroStatValue: { color: '#10b981', fontSize: 20, fontWeight: '800' },
  heroStatLabel: { color: '#9ca3af', fontSize: 11, fontWeight: '600', marginTop: 2 },

  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  sectionCard: { backgroundColor: '#141414', borderRadius: 12, padding: 14, marginHorizontal: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  sectionNumberText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sectionName: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  statusComplete: { backgroundColor: 'rgba(16,185,129,0.2)' },
  statusBadgeText: { color: '#10b981', fontSize: 9, fontWeight: '800' },
  featuresList: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1f1f1f' },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText: { color: '#9ca3af', fontSize: 12 },
  gotoBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#1f1f1f', padding: 10, borderRadius: 8, marginTop: 10 },
  gotoBtnText: { color: '#6366f1', fontSize: 13, fontWeight: '700' },

  finalCard: { alignItems: 'center', backgroundColor: '#141414', margin: 16, borderRadius: 16, padding: 24, marginTop: 24 },
  finalTitle: { color: '#fff', fontSize: 18, fontWeight: '800', marginTop: 12 },
  finalDesc: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  finalFeatures: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 16 },
  finalFeature: { backgroundColor: '#1f1f1f', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  finalFeatureText: { color: '#6366f1', fontSize: 11, fontWeight: '700' },
});
