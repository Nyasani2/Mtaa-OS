// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function MusicPlayerScreen() {
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTracks = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('studio_tracks').select('*').eq('status', 'published').order('created_at', { ascending: false }).limit(50);
      setTracks(data || []);
      if (data && data.length > 0) setCurrentTrack(data[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTracks(); }, []);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const nextTrack = () => {
    if (!currentTrack) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    const next = tracks[(idx + 1) % tracks.length];
    setCurrentTrack(next);
    setIsPlaying(true);
  };
  const prevTrack = () => {
    if (!currentTrack) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack.id);
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length];
    setCurrentTrack(prev);
    setIsPlaying(true);
  };

  const fmtTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return <View style={[s.container, s.center]}><ActivityIndicator size="large" color="#8b5cf6" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.title}>Music Player</Text>

      {currentTrack && (
        <View style={s.playerCard}>
          <View style={s.coverArt}>
            <Ionicons name="musical-notes" size={60} color="#8b5cf6" />
          </View>
          <Text style={s.trackTitle}>{currentTrack.title}</Text>
          <Text style={s.trackArtist}>{currentTrack.artist || 'Unknown Artist'}</Text>
          <View style={s.progressWrap}>
            <View style={s.progressBar} />
          </View>
          <View style={s.timeRow}>
            <Text style={s.timeText}>0:00</Text>
            <Text style={s.timeText}>{fmtTime(currentTrack.duration_seconds || 0)}</Text>
          </View>
          <View style={s.controls}>
            <TouchableOpacity onPress={prevTrack} style={s.ctrlBtn}>
              <Ionicons name="play-skip-back" size={28} color="#0f172a" />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlay} style={s.playBtn}>
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={nextTrack} style={s.ctrlBtn}>
              <Ionicons name="play-skip-forward" size={28} color="#0f172a" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={s.sectionTitle}>All Tracks</Text>
      {tracks.map((t) => (
        <TouchableOpacity key={t.id} style={s.trackItem} onPress={() => { setCurrentTrack(t); setIsPlaying(true); }}>
          <View style={s.trackIcon}>
            <Ionicons name="musical-note" size={24} color="#8b5cf6" />
          </View>
          <View style={s.trackInfo}>
            <Text style={s.trackItemTitle}>{t.title}</Text>
            <Text style={s.trackItemArtist}>{t.artist || 'Unknown'} • {fmtTime(t.duration_seconds || 0)}</Text>
          </View>
          <Ionicons name={currentTrack?.id === t.id && isPlaying ? 'pause-circle' : 'play-circle'} size={28} color="#8b5cf6" />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 16, paddingTop: 48, paddingBottom: 40 },
  center: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 16 },
  playerCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  coverArt: { width: 180, height: 180, borderRadius: 12, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  trackTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  trackArtist: { fontSize: 14, color: '#64748b', marginTop: 4 },
  progressWrap: { width: '100%', height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, marginTop: 20 },
  progressBar: { width: '30%', height: '100%', backgroundColor: '#8b5cf6', borderRadius: 2 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 6 },
  timeText: { fontSize: 12, color: '#64748b' },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16 },
  ctrlBtn: { padding: 10 },
  playBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  trackItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  trackIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#f3e8ff', justifyContent: 'center', alignItems: 'center' },
  trackInfo: { flex: 1 },
  trackItemTitle: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  trackItemArtist: { fontSize: 12, color: '#64748b', marginTop: 2 },
});
