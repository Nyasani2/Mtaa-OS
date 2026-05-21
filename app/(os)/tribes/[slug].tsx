import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTribe } from '@/lib/tribes/hooks/useTribes';
import { TribeFeed } from '@/lib/tribes/components/TribeFeed';
import { TribeChat } from '@/lib/tribes/components/TribeChat';
import { TribeEventCard } from '@/lib/tribes/components/TribeEventCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tribeService } from '@/lib/tribes/services/tribeService';

type Tab = 'feed' | 'chat' | 'events' | 'heritage' | 'members';

export default function TribeDetailScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { tribe, membership, loading, join } = useTribe(slug as string);
  const [activeTab, setActiveTab] = useState<Tab>('feed');

  if (loading || !tribe) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading tribe...</Text>
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    if (membership?.membership_status !== 'approved') {
      return (
        <View style={styles.locked}>
          <Text style={styles.lockedText}>🔒 Join this tribe to view content</Text>
          <TouchableOpacity style={styles.joinBtnLarge} onPress={join}>
            <Text style={styles.joinBtnText}>Join Tribe</Text>
          </TouchableOpacity>
        </View>
      );
    }
    switch (activeTab) {
      case 'feed': return <TribeFeed tribeId={tribe.id} />;
      case 'chat': return <TribeChat tribeId={tribe.id} />;
      case 'events': return <TribeEventsTab tribeId={tribe.id} />;
      case 'heritage': return <TribeHeritage tribe={tribe} />;
      case 'members': return <TribeMembersTab tribeId={tribe.id} />;
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.headerScroll} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: tribe.cover_url || 'https://via.placeholder.com/400x200' }} style={styles.cover} />
        <View style={styles.headerContent}>
          <Image source={{ uri: tribe.avatar_url || 'https://via.placeholder.com/100' }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{tribe.name}</Text>
            <Text style={styles.meta}>{tribe.category.toUpperCase()} • {tribe.member_count.toLocaleString()} members • {tribe.post_count} posts</Text>
            <Text style={styles.location}>📍 {tribe.location || tribe.region || tribe.country}</Text>
          </View>
        </View>

        {!membership ? (
          <TouchableOpacity style={styles.joinBtn} onPress={join}>
            <Text style={styles.joinBtnText}>Join Tribe</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.memberBadge}>
            <Text style={styles.memberText}>✓ Member • {membership.role}</Text>
          </View>
        )}

        <Text style={styles.description}>{tribe.description}</Text>

        <View style={styles.tabs}>
          {(['feed', 'chat', 'events', 'heritage', 'members'] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.tabContent}>
        {renderTabContent()}
      </View>
    </SafeAreaView>
  );
}

function TribeEventsTab({ tribeId }: { tribeId: string }) {
  const [events, setEvents] = React.useState<any[]>([]);
  React.useEffect(() => { tribeService.getTribeEvents(tribeId).then(setEvents); }, [tribeId]);
  return (
    <ScrollView style={styles.tabScroll}>
      {events.map(e => (
        <TribeEventCard key={e.id} event={e} onPress={() => {}} />
      ))}
    </ScrollView>
  );
}

function TribeMembersTab({ tribeId }: { tribeId: string }) {
  const [members, setMembers] = React.useState<any[]>([]);
  React.useEffect(() => { tribeService.getTribeMembers(tribeId).then(setMembers); }, [tribeId]);
  return (
    <ScrollView style={styles.tabScroll}>
      {members.map(m => (
        <View key={m.id} style={styles.memberRow}>
          <Image source={{ uri: m.profile?.avatar_url || 'https://via.placeholder.com/40' }} style={styles.memberAvatar} />
          <View>
            <Text style={styles.memberName}>{m.profile?.full_name || 'Member'}</Text>
            <Text style={styles.memberRole}>{m.role}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

function TribeHeritage({ tribe }: { tribe: any }) {
  return (
    <ScrollView style={styles.heritageContainer}>
      {tribe.history && (
        <View style={styles.heritageSection}>
          <Text style={styles.heritageTitle}>📜 History</Text>
          <Text style={styles.heritageText}>{tribe.history}</Text>
        </View>
      )}
      {tribe.religion && (
        <View style={styles.heritageSection}>
          <Text style={styles.heritageTitle}>🙏 Religion & Beliefs</Text>
          <Text style={styles.heritageText}>{tribe.religion}</Text>
        </View>
      )}
      {tribe.traditions?.length > 0 && (
        <View style={styles.heritageSection}>
          <Text style={styles.heritageTitle}>🎭 Traditions</Text>
          {tribe.traditions.map((t: any, i: number) => (
            <Text key={i} style={styles.heritageItem}>• {t.name || t}</Text>
          ))}
        </View>
      )}
      {tribe.cuisine?.length > 0 && (
        <View style={styles.heritageSection}>
          <Text style={styles.heritageTitle}>🍲 Cuisine</Text>
          {tribe.cuisine.map((c: any, i: number) => (
            <Text key={i} style={styles.heritageItem}>• {c.name || c}</Text>
          ))}
        </View>
      )}
      {tribe.notable_figures?.length > 0 && (
        <View style={styles.heritageSection}>
          <Text style={styles.heritageTitle}>⭐ Notable Figures</Text>
          {tribe.notable_figures.map((f: any, i: number) => (
            <Text key={i} style={styles.heritageItem}>• {f.name || f}</Text>
          ))}
        </View>
      )}
      {tribe.language_phrases?.length > 0 && (
        <View style={styles.heritageSection}>
          <Text style={styles.heritageTitle}>🗣️ Language Phrases</Text>
          {tribe.language_phrases.map((p: any, i: number) => (
            <Text key={i} style={styles.heritageItem}>• {p.phrase || p} — {p.meaning || ''}</Text>
          ))}
        </View>
      )}
      {tribe.artifacts?.length > 0 && (
        <View style={styles.heritageSection}>
          <Text style={styles.heritageTitle}>🏺 Artifacts</Text>
          {tribe.artifacts.map((a: any, i: number) => (
            <Text key={i} style={styles.heritageItem}>• {a.name || a}</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f23' },
  loadingText: { color: '#fff', textAlign: 'center', marginTop: 50 },
  headerScroll: { maxHeight: 400 },
  cover: { width: '100%', height: 180 },
  headerContent: { flexDirection: 'row', padding: 20, marginTop: -40 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 4, borderColor: '#0f0f23' },
  headerInfo: { marginLeft: 16, flex: 1, justifyContent: 'center' },
  name: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  meta: { color: '#e94560', fontSize: 12, marginTop: 4 },
  location: { color: '#a0a0a0', fontSize: 13, marginTop: 4 },
  joinBtn: { backgroundColor: '#e94560', marginHorizontal: 20, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  joinBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  joinBtnLarge: { backgroundColor: '#e94560', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 16 },
  memberBadge: { backgroundColor: '#1a5f2a', marginHorizontal: 20, padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  memberText: { color: '#4ade80', fontWeight: 'bold' },
  description: { color: '#a0a0a0', fontSize: 14, lineHeight: 20, padding: 20, paddingTop: 12 },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#2a2a4a', paddingHorizontal: 20 },
  tab: { paddingVertical: 12, marginRight: 20 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#e94560' },
  tabText: { color: '#666', fontSize: 14, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  tabContent: { flex: 1 },
  tabScroll: { padding: 16 },
  locked: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  lockedText: { color: '#666', fontSize: 16, marginBottom: 16 },
  heritageContainer: { padding: 20 },
  heritageSection: { marginBottom: 24 },
  heritageTitle: { color: '#e94560', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  heritageText: { color: '#ccc', fontSize: 14, lineHeight: 22 },
  heritageItem: { color: '#aaa', fontSize: 14, marginBottom: 6 },
  memberRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#2a2a4a' },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  memberName: { color: '#fff', fontWeight: 'bold' },
  memberRole: { color: '#a0a0a0', fontSize: 12, marginTop: 2 }
});
