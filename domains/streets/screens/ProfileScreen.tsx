import React, { useState } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ProfileHeader } from '../components/ProfileHeader';
import { FeedCard } from '../components/FeedCard';
import { useProfile } from '../hooks/useProfile';

export default function ProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { profile } = useProfile(userId);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'saved'>('posts');

  const tabs = ['posts', 'likes', 'saved'];

  return (
    <View style={styles.container}>
      <ProfileHeader
        userId={userId}
        onEditPress={() => router.push('/streets/settings')}
        onFollowPress={() => {}}
      />
      <View style={styles.tabs}>
        {tabs.map(tab => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={profile?.[activeTab] || []}
        renderItem={({ item }) => (
          <FeedCard
            post={item}
            onProfilePress={(id) => router.push(`/streets/profile/${id}`)}
            onCommentPress={(id) => router.push(`/streets/comments/${id}`)}
          />
        )}
        keyExtractor={item => item.id}
      />
    </View>
  );
}

import { Pressable, Text } from 'react-native';
import { router } from 'expo-router';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#E91E63' },
  tabText: { fontSize: 14, color: '#888', textTransform: 'capitalize' },
  activeTabText: { color: '#E91E63', fontWeight: '700' },
});
