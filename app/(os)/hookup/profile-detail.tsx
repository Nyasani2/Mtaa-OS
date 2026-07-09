import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, TouchableOpacity, ScrollView,
  ActivityIndicator, Dimensions, Alert
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface FullProfile {
  user_id: string;
  bio: string;
  gender: string;
  looking_for: string;
  photos: string[];
  videos: string[];
  interests: string[];
  intent: string;
  relationship_type: string;
  role_preference: string;
  openness: string;
  is_match: boolean;
  has_liked: boolean;
}

export default function ProfileDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id || !user?.id) return;
    fetchProfile();
  }, [id, user]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: pData, error: pErr } = await supabase
        .from('hookup_profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (pErr) throw pErr;

      // Check if already matched
      const [uA, uB] = user!.id < id ? [user!.id, id] : [id, user!.id];
      const { data: matchData } = await supabase
        .from('hookup_matches')
        .select('id')
        .eq('user_a', uA)
        .eq('user_b', uB)
        .maybeSingle();

      // Check if current user has liked them
      const { data: likeData } = await supabase
        .from('hookup_swipes')
        .select('id')
        .eq('swiper_id', user!.id)
        .eq('swiped_id', id)
        .eq('direction', 'like')
        .maybeSingle();

      setProfile({
        user_id: pData.user_id,
        bio: pData.bio || 'No bio yet',
        gender: pData.gender || '',
        looking_for: pData.looking_for || '',
        photos: pData.photos || [],
        videos: pData.videos || [],
        interests: pData.interests || [],
        intent: pData.intent || '',
        relationship_type: pData.relationship_type || '',
        role_preference: pData.role_preference || '',
        openness: pData.openness || '',
        is_match: !!matchData,
        has_liked: !!likeData,
      });
    } catch (err) {
      console.error('Profile detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!profile || !user?.id || actionLoading) return;
    setActionLoading(true);

    await supabase.from('hookup_swipes').insert({
      swiper_id: user.id,
      swiped_id: profile.user_id,
      direction: 'like',
    });

    const { data: mutual } = await supabase
      .from('hookup_swipes')
      .select('*')
      .eq('swiper_id', profile.user_id)
      .eq('swiped_id', user.id)
      .eq('direction', 'like')
      .maybeSingle();

    if (mutual) {
      const [uA, uB] = user.id < profile.user_id ? [user.id, profile.user_id] : [profile.user_id, user.id];
      await supabase.from('hookup_matches').insert({ user_a: uA, user_b: uB });
      Alert.alert("It's a Match!", "You liked each other!", [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'Message', onPress: () => router.push(`/(os)/messages?recipientId=${profile.user_id}`) },
      ]);
      setProfile(prev => prev ? { ...prev, is_match: true } : null);
    }

    setProfile(prev => prev ? { ...prev, has_liked: true } : null);
    setActionLoading(false);
  };

  const handleReport = () => {
    Alert.alert('Report User', 'Why are you reporting?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Fake Profile', onPress: () => submitReport('fake') },
      { text: 'Harassment', onPress: () => submitReport('harassment') },
      { text: 'Inappropriate', onPress: () => submitReport('inappropriate') },
    ]);
  };

  const submitReport = async (reason: string) => {
    if (!profile || !user?.id) return;
    await supabase.from('hookup_reports').insert({ reporter_id: user.id, reported_id: profile.user_id, reason });
    Alert.alert('Reported', 'Thank you. Our team will review.');
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff3366" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: '#fff' }}>Profile not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Profile</Text>
        <TouchableOpacity onPress={handleReport}>
          <Feather name="flag" size={22} color="#ff4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
          {profile.photos.map((photo, i) => (
            <Image key={i} source={{ uri: photo }} style={{ width, height: width * 1.1, backgroundColor: '#1a1a1a' }} resizeMode="cover" />
          ))}
        </ScrollView>

        <View style={{ padding: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
            <Text style={{ color: '#fff', fontSize: 28, fontWeight: 'bold' }}>User</Text>
            {profile.gender ? <Text style={{ color: '#888', fontSize: 16, marginLeft: 8 }}>{profile.gender}</Text> : null}
          </View>

          {profile.intent ? (
            <View style={{ backgroundColor: '#2a1a1a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 10, borderWidth: 1, borderColor: '#ff336620' }}>
              <Text style={{ color: '#ff3366', fontSize: 13 }}>{profile.intent}</Text>
            </View>
          ) : null}

          {profile.bio ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>About</Text>
              <Text style={{ color: '#ccc', fontSize: 15, lineHeight: 22 }}>{profile.bio}</Text>
            </View>
          ) : null}

          <View style={{ marginTop: 20 }}>
            <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Details</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {profile.looking_for ? <DetailChip icon="user" label="Looking For" value={profile.looking_for} /> : null}
              {profile.relationship_type ? <DetailChip icon="heart" label="Relationship" value={profile.relationship_type} /> : null}
              {profile.openness ? <DetailChip icon="unlock" label="Openness" value={profile.openness} /> : null}
              {profile.role_preference ? <DetailChip icon="shield" label="Role" value={profile.role_preference} /> : null}
            </View>
          </View>

          {profile.interests.length > 0 && (
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Interests</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {profile.interests.map((interest, i) => (
                  <View key={i} style={{ backgroundColor: '#2a2a2a', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: '#333' }}>
                    <Text style={{ color: '#ccc', fontSize: 12 }}>{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12, marginTop: 28, marginBottom: 20 }}>
            {profile.is_match ? (
              <TouchableOpacity onPress={() => router.push(`/(os)/messages?recipientId=${profile.user_id}`)}
                style={{ flex: 1, backgroundColor: '#ff3366', borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                <Feather name="message-circle" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Message</Text>
              </TouchableOpacity>
            ) : profile.has_liked ? (
              <View style={{ flex: 1, backgroundColor: '#2a2a2a', borderRadius: 16, padding: 16, alignItems: 'center' }}>
                <Text style={{ color: '#888', fontWeight: 'bold' }}>Liked</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={handleLike} disabled={actionLoading}
                style={{ flex: 1, backgroundColor: '#44ff88', borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                {actionLoading ? <ActivityIndicator color="#0a0a0a" /> : (
                  <>
                    <Feather name="heart" size={20} color="#0a0a0a" />
                    <Text style={{ color: '#0a0a0a', fontWeight: 'bold', fontSize: 16, marginLeft: 8 }}>Like</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, flex: 1, minWidth: width * 0.42 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        <Feather name={icon as any} size={14} color="#666" />
        <Text style={{ color: '#666', fontSize: 11, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
      </View>
      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{value}</Text>
    </View>
  );
}
