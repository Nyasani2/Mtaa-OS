import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Match {
  id: string;
  match_id: string;
  photos: string[];
  created_at: string;
}

export default function MatchesScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.id) fetchMatches();
  }, [user]);

  const fetchMatches = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('hookup_matches')
        .select('*')
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched: Match[] = [];
      for (const match of (data || [])) {
        const otherId = match.user_a === user.id ? match.user_b : match.user_a;
        const { data: profile } = await supabase
          .from('hookup_profiles')
          .select('user_id, photos')
          .eq('user_id', otherId)
          .single();

        enriched.push({
          id: match.id,
          match_id: otherId,
          photos: profile?.photos || [],
          created_at: match.created_at,
        });
      }

      setMatches(enriched);
    } catch (err) {
      console.error('Matches fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };

  const openConversation = (matchId: string) => {
    router.push(`/(os)/messages?recipientId=${matchId}` as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff3366" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Matches</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff3366" />}>
        {matches.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Feather name="heart" size={48} color="#333" />
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 16 }}>No Matches Yet</Text>
            <Text style={{ color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' }}>Start swiping in Discover to find your matches!</Text>
            <TouchableOpacity onPress={() => router.push('/(os)/hookup/discovery' as any)} style={{ backgroundColor: '#ff3366', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go to Discover</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ padding: 16 }}>
            {matches.map((match) => (
              <TouchableOpacity key={match.id} onPress={() => openConversation(match.match_id)}
                style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 16, padding: 14, marginBottom: 12 }}>
                <Image source={{ uri: match.photos[0] || undefined }} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#2a2a2a' }} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>User</Text>
                  <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Matched recently</Text>
                </View>
                <TouchableOpacity onPress={() => openConversation(match.match_id)} style={{ backgroundColor: '#ff3366', borderRadius: 20, padding: 10 }}>
                  <Feather name="message-circle" size={18} color="#fff" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
