import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, StyleSheet,
  Dimensions, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { ChevronLeft, Heart, MessageCircle, Share2, Play } from 'lucide-react-native';

const { width: W } = Dimensions.get('window');

export default function ContentDetailScreen() {
  const { id, table } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!id || !table) return;
    loadItem();
  }, [id, table]);

  async function loadItem() {
    setLoading(true);
    try {
      const tbl = String(table);
      const { data, error } = await supabase.from(tbl).select('*').eq('id', String(id)).single();
      if (error) throw error;
      setItem(data);
    } catch (e) {
      console.error('Content detail error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}><ActivityIndicator size="large" color="#fff" /></View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ color: '#888' }}>Content not found</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
            <Text style={{ color: '#4ade80' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const thumb = item.thumbnail_url || item.thumbnail || null;
  const media = item.video_url || item.media_url || null;
  const title = item.title || item.caption || item.content || 'Untitled';
  const creatorId = item.creator_id || item.user_id || '';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.hBtn}>
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.hTitle} numberOfLines={1}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Media / Thumbnail */}
        <View style={styles.mediaBox}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.mediaImg} resizeMode="cover" />
          ) : (
            <View style={[styles.mediaImg, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
              <Play size={48} color="#555" />
            </View>
          )}
          {media && (
            <TouchableOpacity style={styles.playBtn}>
              <Play size={32} color="#fff" fill="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title}>{title}</Text>
          {item.description && <Text style={styles.desc}>{item.description}</Text>}

          <View style={styles.statsRow}>
            <Text style={styles.stat}>{item.view_count || item.views || 0} views</Text>
            <Text style={styles.stat}>{item.like_count || item.likes_count || 0} likes</Text>
            <Text style={styles.stat}>{item.comment_count || item.comments_count || 0} comments</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actBtn} onPress={() => setLiked(!liked)}>
              <Heart size={22} color={liked ? '#ff4444' : '#fff'} fill={liked ? '#ff4444' : 'transparent'} />
              <Text style={styles.actTxt}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actBtn}>
              <MessageCircle size={22} color="#fff" />
              <Text style={styles.actTxt}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actBtn}>
              <Share2 size={22} color="#fff" />
              <Text style={styles.actTxt}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: '#222' },
  hTitle: { color: '#fff', fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  hBtn: { padding: 6 },
  mediaBox: { width: W, height: W * 0.75, backgroundColor: '#111', position: 'relative' },
  mediaImg: { width: '100%', height: '100%' },
  playBtn: { position: 'absolute', top: '50%', left: '50%', marginLeft: -24, marginTop: -24, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  info: { padding: 16 },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  desc: { color: '#aaa', fontSize: 14, marginTop: 6, lineHeight: 20 },
  statsRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  stat: { color: '#888', fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 20, paddingTop: 16, borderTopWidth: 0.5, borderTopColor: '#222' },
  actBtn: { alignItems: 'center', gap: 4 },
  actTxt: { color: '#fff', fontSize: 12, marginTop: 2 },
});
