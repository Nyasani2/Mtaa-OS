import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, ScrollView, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

type MusicTab = 'library' | 'upload' | 'albums' | 'beats' | 'collab' | 'royalties';

interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  duration: number;
  cover_url?: string | null;
  audio_url: string;
  plays_count: number;
  genre: string;
  created_at: string;
  lyrics?: string | null;
  is_single: boolean;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  cover_url?: string | null;
  track_count: number;
  release_date: string;
  genre: string;
}

interface Beat {
  id: string;
  title: string;
  producer: string;
  price: number;
  bpm: number;
  genre: string;
  preview_url: string;
  cover_url?: string | null;
  license_type: 'basic' | 'premium' | 'exclusive';
}

interface RoyaltyRecord {
  id: string;
  track_title: string;
  period: string;
  plays: number;
  downloads: number;
  streams: number;
  amount: number;
  status: 'pending' | 'paid';
}

export default function MusicStudioScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<MusicTab>('library');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [beats, setBeats] = useState<Beat[]>([]);
  const [royalties, setRoyalties] = useState<RoyaltyRecord[]>([]);
  const [loading, setLoading] = useState(false);

  // Upload form
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadArtist, setUploadArtist] = useState('');
  const [uploadGenre, setUploadGenre] = useState('');
  const [uploadLyrics, setUploadLyrics] = useState('');
  const [isSingle, setIsSingle] = useState(true);
  const [selectedAlbum, setSelectedAlbum] = useState('');

  // Beat form
  const [beatTitle, setBeatTitle] = useState('');
  const [beatPrice, setBeatPrice] = useState('');
  const [beatBpm, setBeatBpm] = useState('');
  const [beatGenre, setBeatGenre] = useState('');
  const [beatLicense, setBeatLicense] = useState<'basic' | 'premium' | 'exclusive'>('basic');

  const genres = ['Afrobeats', 'Bongo Flava', 'Amapiano', 'Gengetone', 'Gospel', 'Hip Hop', 'R&B', 'Jazz', 'Traditional', 'Electronic', 'Reggae', 'Highlife'];

  useEffect(() => {
    fetchLibrary();
    fetchAlbums();
    fetchBeats();
    fetchRoyalties();
  }, []);

  const fetchLibrary = async () => {
    try {
      const { data } = await supabase
        .from('studio_music_tracks')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });
      setTracks(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchAlbums = async () => {
    try {
      const { data } = await supabase
        .from('studio_music_albums')
        .select('*')
        .eq('creator_id', user?.id)
        .order('created_at', { ascending: false });
      setAlbums(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchBeats = async () => {
    try {
      const { data } = await supabase
        .from('studio_beats')
        .select('*')
        .order('created_at', { ascending: false });
      setBeats(data || []);
    } catch (e) { console.error(e); }
  };

  const fetchRoyalties = async () => {
    try {
      const { data } = await supabase
        .from('studio_music_royalties')
        .select('*')
        .eq('creator_id', user?.id)
        .order('period', { ascending: false });
      setRoyalties(data || []);
    } catch (e) { console.error(e); }
  };

  const uploadTrack = async () => {
    if (!uploadTitle.trim() || !user?.id) return;
    setLoading(true);
    try {
      await supabase.from('studio_music_tracks').insert({
        creator_id: user.id,
        title: uploadTitle,
        artist: uploadArtist || user.user_metadata?.full_name || 'Artist',
        genre: uploadGenre,
        lyrics: uploadLyrics || null,
        is_single: isSingle,
        album_id: selectedAlbum || null,
        audio_url: '', // Upload to storage first
        status: 'draft',
      });
      setUploadTitle(''); setUploadArtist(''); setUploadGenre(''); setUploadLyrics('');
      setActiveTab('library');
      fetchLibrary();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const uploadBeat = async () => {
    if (!beatTitle.trim() || !beatPrice || !user?.id) return;
    try {
      await supabase.from('studio_beats').insert({
        producer_id: user.id,
        title: beatTitle,
        price: parseFloat(beatPrice),
        bpm: parseInt(beatBpm) || 120,
        genre: beatGenre,
        license_type: beatLicense,
        preview_url: '',
      });
      setBeatTitle(''); setBeatPrice(''); setBeatBpm(''); setBeatGenre('');
      setActiveTab('beats');
      fetchBeats();
    } catch (e) { console.error(e); }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const renderLibrary = () => (
    <FlatList
      data={tracks}
      keyExtractor={t => t.id}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Feather name="music" size={48} color="#333" />
          <Text style={styles.emptyText}>No tracks yet</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => setActiveTab('upload')}>
            <Text style={styles.emptyBtnText}>Upload Your First Track</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.trackCard}>
          <View style={styles.trackCover}>
            {item.cover_url ? (
              <Image source={{ uri: item.cover_url }} style={styles.trackCoverImg} />
            ) : (
              <Feather name="music" size={24} color="#6366f1" />
            )}
          </View>
          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle}>{item.title}</Text>
            <Text style={styles.trackMeta}>{item.artist} • {item.genre}</Text>
            <View style={styles.trackStats}>
              <Feather name="play" size={12} color="#666" />
              <Text style={styles.trackStat}>{item.plays_count || 0}</Text>
              {item.is_single && <View style={styles.singleBadge}><Text style={styles.singleText}>SINGLE</Text></View>}
            </View>
          </View>
          <TouchableOpacity style={styles.trackMenu}>
            <Feather name="more-vertical" size={18} color="#666" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    />
  );

  const renderUpload = () => (
    <ScrollView style={styles.uploadContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.uploadTitle}>Upload Track</Text>
      <View style={styles.uploadBox}>
        <Feather name="upload-cloud" size={48} color="#6366f1" />
        <Text style={styles.uploadBoxText}>Tap to upload audio file</Text>
        <Text style={styles.uploadBoxSub}>MP3, WAV, FLAC up to 500MB</Text>
      </View>

      <Text style={styles.formLabel}>Track Title *</Text>
      <TextInput style={styles.formInput} value={uploadTitle} onChangeText={setUploadTitle} placeholder="Song title" placeholderTextColor="#666" />

      <Text style={styles.formLabel}>Artist Name</Text>
      <TextInput style={styles.formInput} value={uploadArtist} onChangeText={setUploadArtist} placeholder="Your artist name" placeholderTextColor="#666" />

      <Text style={styles.formLabel}>Genre</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
        {genres.map((g: any) => (
          <TouchableOpacity key={g} onPress={() => setUploadGenre(g)} style={[styles.genreChip, uploadGenre === g && styles.genreChipActive]}>
            <Text style={[styles.genreChipText, uploadGenre === g && styles.genreChipTextActive]}>{g}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.formLabel}>Release Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity onPress={() => setIsSingle(true)} style={[styles.typeBtn, isSingle && styles.typeBtnActive]}>
          <Feather name="disc" size={18} color={isSingle ? '#6366f1' : '#666'} />
          <Text style={[styles.typeText, isSingle && styles.typeTextActive]}>Single</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsSingle(false)} style={[styles.typeBtn, !isSingle && styles.typeBtnActive]}>
          <Feather name="layers" size={18} color={!isSingle ? '#6366f1' : '#666'} />
          <Text style={[styles.typeText, !isSingle && styles.typeTextActive]}>Album Track</Text>
        </TouchableOpacity>
      </View>

      {!isSingle && (
        <>
          <Text style={styles.formLabel}>Select Album</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {albums.map((a: any) => (
              <TouchableOpacity key={a.id} onPress={() => setSelectedAlbum(a.id)} style={[styles.albumSelect, selectedAlbum === a.id && styles.albumSelectActive]}>
                <Text style={styles.albumSelectText}>{a.title}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.albumSelect}>
              <Feather name="plus" size={14} color="#6366f1" />
              <Text style={styles.albumSelectText}>New Album</Text>
            </TouchableOpacity>
          </ScrollView>
        </>
      )}

      <Text style={styles.formLabel}>Lyrics</Text>
      <TextInput style={[styles.formInput, styles.lyricsInput]} value={uploadLyrics} onChangeText={setUploadLyrics} placeholder="Paste lyrics here..." placeholderTextColor="#666" multiline numberOfLines={6} textAlignVertical="top" />

      <TouchableOpacity style={styles.uploadBtn} onPress={uploadTrack} disabled={loading || !uploadTitle.trim()}>
        <Text style={styles.uploadBtnText}>{loading ? 'Uploading...' : 'Upload Track'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  const renderAlbums = () => (
    <FlatList
      data={albums}
      keyExtractor={a => a.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
      contentContainerStyle={{ paddingVertical: 16 }}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Feather name="disc" size={48} color="#333" />
          <Text style={styles.emptyText}>No albums yet</Text>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.albumCard}>
          <View style={styles.albumCover}>
            {item.cover_url ? (
              <Image source={{ uri: item.cover_url }} style={styles.albumCoverImg} />
            ) : (
              <Feather name="disc" size={40} color="#6366f1" />
            )}
          </View>
          <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.albumMeta}>{item.track_count} tracks • {item.genre}</Text>
        </TouchableOpacity>
      )}
    />
  );

  const renderBeats = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.beatHeader}>
        <TouchableOpacity style={styles.beatUploadBtn} onPress={() => setActiveTab('upload')}>
          <Feather name="plus" size={16} color="#fff" />
          <Text style={styles.beatUploadText}>Sell a Beat</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={beats}
        keyExtractor={b => b.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Feather name="activity" size={48} color="#333" />
            <Text style={styles.emptyText}>No beats in marketplace</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.beatCard}>
            <View style={styles.beatCover}>
              <Feather name="activity" size={28} color="#6366f1" />
            </View>
            <View style={styles.beatInfo}>
              <Text style={styles.beatTitle}>{item.title}</Text>
              <Text style={styles.beatMeta}>{item.producer} • {item.bpm} BPM • {item.genre}</Text>
              <View style={styles.beatLicenseRow}>
                <View style={[styles.licenseBadge, item.license_type === 'exclusive' && styles.licenseExclusive]}>
                  <Text style={styles.licenseText}>{item.license_type.toUpperCase()}</Text>
                </View>
                <Text style={styles.beatPrice}>${item.price}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.beatBuyBtn}>
              <Text style={styles.beatBuyText}>Buy</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );

  const renderCollab = () => (
    <View style={styles.collabContainer}>
      <View style={styles.collabCard}>
        <Feather name="users" size={32} color="#6366f1" />
        <Text style={styles.collabTitle}>Collaboration Hub</Text>
        <Text style={styles.collabDesc}>Find producers, vocalists, and instrumentalists to collaborate on your next track.</Text>
        <TouchableOpacity style={styles.collabBtn}>
          <Text style={styles.collabBtnText}>Find Collaborators</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.collabSection}>Open Collaboration Requests</Text>
      {[
        { role: 'Vocalist needed', genre: 'Afrobeats', budget: '$200', posted: '2h ago' },
        { role: 'Producer wanted', genre: 'Amapiano', budget: '$500', posted: '5h ago' },
        { role: 'Guitarist needed', genre: 'Highlife', budget: '$150', posted: '1d ago' },
      ].map((req, i) => (
        <View key={i} style={styles.collabReq}>
          <View style={styles.collabReqLeft}>
            <Text style={styles.collabReqRole}>{req.role}</Text>
            <Text style={styles.collabReqMeta}>{req.genre} • {req.budget} • {req.posted}</Text>
          </View>
          <TouchableOpacity style={styles.collabReqBtn}>
            <Text style={styles.collabReqBtnText}>Apply</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  const renderRoyalties = () => (
    <View style={styles.royaltyContainer}>
      <View style={styles.royaltySummary}>
        <View style={styles.royaltyCard}>
          <Text style={styles.royaltyLabel}>Total Earnings</Text>
          <Text style={styles.royaltyAmount}>${royalties.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}</Text>
        </View>
        <View style={styles.royaltyCard}>
          <Text style={styles.royaltyLabel}>Pending</Text>
          <Text style={styles.royaltyAmount}>${royalties.filter((r: any) => r.status === 'pending').reduce((sum, r) => sum + r.amount, 0).toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.royaltySection}>Royalty History</Text>
      <FlatList
        data={royalties}
        keyExtractor={r => r.id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Feather name="dollar-sign" size={48} color="#333" />
            <Text style={styles.emptyText}>No royalties yet</Text>
            <Text style={styles.emptySub}>Upload tracks to start earning</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.royaltyItem}>
            <View style={styles.royaltyItemLeft}>
              <Text style={styles.royaltyTrack}>{item.track_title}</Text>
              <Text style={styles.royaltyPeriod}>{item.period}</Text>
              <View style={styles.royaltyStats}>
                <Text style={styles.royaltyStat}>{item.plays} plays</Text>
                <Text style={styles.royaltyStat}>{item.downloads} downloads</Text>
                <Text style={styles.royaltyStat}>{item.streams} streams</Text>
              </View>
            </View>
            <View style={styles.royaltyItemRight}>
              <Text style={styles.royaltyItemAmount}>${item.amount.toFixed(2)}</Text>
              <View style={[styles.royaltyStatus, item.status === 'paid' && styles.royaltyStatusPaid]}>
                <Text style={styles.royaltyStatusText}>{item.status}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Music Studio</Text>
        <TouchableOpacity onPress={() => setActiveTab('upload')}>
          <Feather name="plus" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
        {[
          { id: 'library' as MusicTab, label: 'Library', icon: 'music' },
          { id: 'upload' as MusicTab, label: 'Upload', icon: 'upload-cloud' },
          { id: 'albums' as MusicTab, label: 'Albums', icon: 'disc' },
          { id: 'beats' as MusicTab, label: 'Beats', icon: 'activity' },
          { id: 'collab' as MusicTab, label: 'Collab', icon: 'users' },
          { id: 'royalties' as MusicTab, label: 'Royalties', icon: 'dollar-sign' },
        ].map((t: any) => (
          <TouchableOpacity key={t.id} onPress={() => setActiveTab(t.id)} style={[styles.tabBtn, activeTab === t.id && styles.tabBtnActive]}>
            <Feather name={t.icon as any} size={14} color={activeTab === t.id ? '#6366f1' : '#666'} />
            <Text style={[styles.tabText, activeTab === t.id && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {activeTab === 'library' && renderLibrary()}
        {activeTab === 'upload' && renderUpload()}
        {activeTab === 'albums' && renderAlbums()}
        {activeTab === 'beats' && renderBeats()}
        {activeTab === 'collab' && renderCollab()}
        {activeTab === 'royalties' && renderRoyalties()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  tabScroll: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderWidth: 1, borderColor: '#6366f1' },
  tabText: { color: '#666', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '700' },

  content: { flex: 1 },

  // Library
  trackCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#141414', borderRadius: 12, marginBottom: 8 },
  trackCover: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#1f1f1f', alignItems: 'center', justifyContent: 'center' },
  trackCoverImg: { width: 48, height: 48, borderRadius: 8 },
  trackInfo: { flex: 1 },
  trackTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  trackMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  trackStats: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trackStat: { color: '#666', fontSize: 11 },
  singleBadge: { backgroundColor: 'rgba(99,102,241,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 6 },
  singleText: { color: '#6366f1', fontSize: 8, fontWeight: '800' },
  trackMenu: { padding: 4 },

  // Upload
  uploadContainer: { flex: 1, padding: 16 },
  uploadTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 16 },
  uploadBox: { alignItems: 'center', padding: 30, backgroundColor: '#141414', borderRadius: 16, borderWidth: 2, borderColor: '#1f1f1f', borderStyle: 'dashed', marginBottom: 20 },
  uploadBoxText: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 12 },
  uploadBoxSub: { color: '#666', fontSize: 12, marginTop: 4 },
  formLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase' },
  formInput: { backgroundColor: '#1f1f1f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14 },
  lyricsInput: { minHeight: 120, textAlignVertical: 'top' },
  genreScroll: { marginTop: 4 },
  genreChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  genreChipActive: { backgroundColor: '#6366f1' },
  genreChipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  genreChipTextActive: { fontWeight: '700' },
  typeRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1f1f1f', padding: 12, borderRadius: 8 },
  typeBtnActive: { borderWidth: 1, borderColor: '#6366f1' },
  typeText: { color: '#666', fontSize: 13, fontWeight: '600' },
  typeTextActive: { color: '#6366f1' },
  albumSelect: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1f1f1f', marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  albumSelectActive: { borderWidth: 1, borderColor: '#6366f1' },
  albumSelectText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  uploadBtn: { backgroundColor: '#6366f1', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Albums
  albumCard: { flex: 1, alignItems: 'center', marginBottom: 16 },
  albumCover: { width: '100%', aspectRatio: 1, borderRadius: 8, backgroundColor: '#1f1f1f', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  albumCoverImg: { width: '100%', height: '100%', borderRadius: 8 },
  albumTitle: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  albumMeta: { color: '#666', fontSize: 11, marginTop: 2 },

  // Beats
  beatHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  beatUploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6366f1', padding: 12, borderRadius: 8 },
  beatUploadText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  beatCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, backgroundColor: '#141414', borderRadius: 12, marginBottom: 8 },
  beatCover: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#1f1f1f', alignItems: 'center', justifyContent: 'center' },
  beatInfo: { flex: 1 },
  beatTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  beatMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  beatLicenseRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  licenseBadge: { backgroundColor: '#1f1f1f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  licenseExclusive: { backgroundColor: 'rgba(239,68,68,0.2)' },
  licenseText: { color: '#9ca3af', fontSize: 9, fontWeight: '800' },
  beatPrice: { color: '#10b981', fontSize: 14, fontWeight: '700' },
  beatBuyBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  beatBuyText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Collab
  collabContainer: { padding: 16 },
  collabCard: { alignItems: 'center', backgroundColor: '#141414', borderRadius: 16, padding: 24, marginBottom: 20 },
  collabTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  collabDesc: { color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  collabBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  collabBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  collabSection: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  collabReq: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#141414', padding: 12, borderRadius: 8, marginBottom: 8 },
  collabReqLeft: { flex: 1 },
  collabReqRole: { color: '#fff', fontSize: 14, fontWeight: '600' },
  collabReqMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  collabReqBtn: { backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  collabReqBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Royalties
  royaltyContainer: { flex: 1 },
  royaltySummary: { flexDirection: 'row', gap: 12, padding: 16 },
  royaltyCard: { flex: 1, backgroundColor: '#141414', borderRadius: 12, padding: 16, alignItems: 'center' },
  royaltyLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  royaltyAmount: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 4 },
  royaltySection: { color: '#fff', fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginBottom: 12, marginTop: 8 },
  royaltyItem: { flexDirection: 'row', backgroundColor: '#141414', padding: 12, borderRadius: 8, marginBottom: 8 },
  royaltyItemLeft: { flex: 1 },
  royaltyTrack: { color: '#fff', fontSize: 14, fontWeight: '600' },
  royaltyPeriod: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  royaltyStats: { flexDirection: 'row', gap: 8, marginTop: 4 },
  royaltyStat: { color: '#666', fontSize: 11 },
  royaltyItemRight: { alignItems: 'flex-end', justifyContent: 'center' },
  royaltyItemAmount: { color: '#10b981', fontSize: 16, fontWeight: '700' },
  royaltyStatus: { backgroundColor: '#1f1f1f', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  royaltyStatusPaid: { backgroundColor: 'rgba(16,185,129,0.2)' },
  royaltyStatusText: { color: '#9ca3af', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },

  // Empty
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 16 },
  emptySub: { color: '#666', fontSize: 13, marginTop: 4 },
  emptyBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
