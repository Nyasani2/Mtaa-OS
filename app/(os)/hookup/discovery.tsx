import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, Image, TouchableOpacity, Dimensions,
  ActivityIndicator, Animated, PanResponder, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width, height } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const CARD_HEIGHT = height * 0.65;

interface ProfileCard {
  user_id: string;
  bio: string;
  gender: string;
  looking_for: string;
  photos: string[];
  interests: string[];
  intent: string;
  relationship_type: string;
}

export default function DiscoveryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profiles, setProfiles] = useState<ProfileCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [noMoreProfiles, setNoMoreProfiles] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  const pan = useState(new Animated.ValueXY())[0];
  const rotate = pan.x.interpolate({
    inputRange: [-width / 2, 0, width / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  useEffect(() => {
    if (user?.id) checkProfile();
  }, [user]);

  const checkProfile = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('hookup_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();
    setHasProfile(!!data);
    if (data) {
      fetchProfiles();
    } else {
      setLoading(false);
      setNoMoreProfiles(true);
    }
  };

  const fetchProfiles = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get already swiped profiles
      const { data: swiped } = await supabase
        .from('hookup_swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id);
      const swipedIds = (swiped || []).map((s: any) => s.swiped_id);
      swipedIds.push(user.id);

      // Fetch profiles
      const query = supabase
        .from('hookup_profiles')
        .select('user_id, bio, gender, looking_for, photos, interests, intent, relationship_type')
        .not('user_id', 'in', `(${swipedIds.join(',')})`)
        .limit(20);

      const { data, error } = await query;
      if (error) throw error;

      const cards: ProfileCard[] = (data || []).map((p: any) => ({
        user_id: p.user_id,
        bio: p.bio || '',
        gender: p.gender || '',
        looking_for: p.looking_for || '',
        photos: p.photos || [],
        interests: p.interests || [],
        intent: p.intent || '',
        relationship_type: p.relationship_type || '',
      }));

      setProfiles(cards);
      setNoMoreProfiles(cards.length === 0);
    } catch (err) {
      console.error('Discovery fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const panResponder = useState(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        pan.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > 120) {
          swipeRight();
        } else if (gesture.dx < -120) {
          swipeLeft();
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  )[0];

  const swipeRight = () => {
    Animated.timing(pan, {
      toValue: { x: width + 100, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => handleLike());
  };

  const swipeLeft = () => {
    Animated.timing(pan, {
      toValue: { x: -width - 100, y: 0 },
      duration: 300,
      useNativeDriver: true,
    }).start(() => handlePass());
  };

  const handleLike = async () => {
    const profile = profiles[currentIndex];
    if (!profile || !user?.id) return;

    await supabase.from('hookup_swipes').insert({
      swiper_id: user.id,
      swiped_id: profile.user_id,
      direction: 'like',
    });

    // Check for mutual like
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
      Alert.alert("It's a Match!", `You and a user liked each other!`, [
        { text: 'Keep Browsing', style: 'cancel' },
        { text: 'Message', onPress: () => router.push(`/(os)/messages?recipientId=${profile.user_id}`) },
      ]);
    }

    nextCard();
  };

  const handlePass = async () => {
    const profile = profiles[currentIndex];
    if (!profile || !user?.id) return;
    await supabase.from('hookup_swipes').insert({
      swiper_id: user.id,
      swiped_id: profile.user_id,
      direction: 'pass',
    });
    nextCard();
  };

  const handleSuperLike = async () => {
    const profile = profiles[currentIndex];
    if (!profile || !user?.id) return;
    await supabase.from('hookup_swipes').insert({
      swiper_id: user.id,
      swiped_id: profile.user_id,
      direction: 'super_like',
    });
    nextCard();
  };

  const nextCard = () => {
    pan.setValue({ x: 0, y: 0 });
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= profiles.length) {
        setNoMoreProfiles(true);
      }
      return next;
    });
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff3366" />
        <Text style={{ color: '#888', marginTop: 16 }}>Finding people nearby...</Text>
      </SafeAreaView>
    );
  }

  if (!hasProfile) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <Feather name="user-plus" size={64} color="#ff3366" />
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 24, textAlign: 'center' }}>Set Up Your Profile</Text>
        <Text style={{ color: '#888', fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>
          Complete your Hookup profile to start discovering people nearby.
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/(os)/hookup/profile-setup')}
          style={{ backgroundColor: '#ff3366', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14, marginTop: 24 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Create Profile</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (noMoreProfiles) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <TouchableOpacity onPress={() => router.push('/(os)/hookup/profile-setup')}>
            <Feather name="user" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Discover</Text>
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={() => router.push('/(os)/hookup/likes')}>
              <Feather name="heart" size={24} color="#ff3366" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(os)/hookup/matches')}>
              <Feather name="message-circle" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Feather name="search" size={64} color="#333" />
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginTop: 24 }}>No More Profiles</Text>
          <TouchableOpacity onPress={fetchProfiles} style={{ backgroundColor: '#ff3366', borderRadius: 16, paddingHorizontal: 24, paddingVertical: 12, marginTop: 20 }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
        <TouchableOpacity onPress={() => router.push('/(os)/hookup/profile-setup')}>
          <Feather name="user" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Discover</Text>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={() => router.push('/(os)/hookup/likes')}>
            <Feather name="heart" size={24} color="#ff3366" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(os)/hookup/matches')}>
            <Feather name="message-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {currentProfile && (
          <Animated.View
            {...panResponder.panHandlers}
            style={{
              width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 20, overflow: 'hidden', backgroundColor: '#1a1a1a',
              transform: [{ translateX: pan.x }, { translateY: pan.y }, { rotate }],
            }}
          >
            <Image
              source={{ uri: currentProfile.photos[0] || undefined }}
              style={{ width: CARD_WIDTH, height: CARD_HEIGHT * 0.75 }}
              resizeMode="cover"
            />
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: CARD_HEIGHT * 0.5 }} />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 }}>
              <Text style={{ color: '#fff', fontSize: 26, fontWeight: 'bold' }}>User</Text>
              {currentProfile.intent ? (
                <View style={{ backgroundColor: '#2a1a1a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'flex-start', marginTop: 10, borderWidth: 1, borderColor: '#ff336620' }}>
                  <Text style={{ color: '#ff3366', fontSize: 13 }}>{currentProfile.intent}</Text>
                </View>
              ) : null}
              {currentProfile.bio ? (
                <Text style={{ color: '#aaa', fontSize: 14, marginTop: 8, lineHeight: 20 }} numberOfLines={2}>{currentProfile.bio}</Text>
              ) : null}
              {currentProfile.interests.length > 0 && (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
                  {currentProfile.interests.slice(0, 4).map((interest, i) => (
                    <View key={i} style={{ backgroundColor: '#ff336630', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6 }}>
                      <Text style={{ color: '#ff3366', fontSize: 11 }}>{interest}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
            <Animated.View style={{ position: 'absolute', top: 40, left: 20, opacity: pan.x.interpolate({ inputRange: [-width/2, -80], outputRange: [1, 0], extrapolate: 'clamp' }), transform: [{ rotate: '-20deg' }], borderWidth: 4, borderColor: '#ff4444', borderRadius: 12, padding: 8 }}>
              <Text style={{ color: '#ff4444', fontSize: 32, fontWeight: 'bold' }}>NOPE</Text>
            </Animated.View>
            <Animated.View style={{ position: 'absolute', top: 40, right: 20, opacity: pan.x.interpolate({ inputRange: [80, width/2], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ rotate: '20deg' }], borderWidth: 4, borderColor: '#44ff88', borderRadius: 12, padding: 8 }}>
              <Text style={{ color: '#44ff88', fontSize: 32, fontWeight: 'bold' }}>LIKE</Text>
            </Animated.View>
          </Animated.View>
        )}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, paddingVertical: 20 }}>
        <TouchableOpacity onPress={swipeLeft} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ff4444' }}>
          <Feather name="x" size={28} color="#ff4444" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSuperLike} style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#4488ff' }}>
          <Feather name="star" size={22} color="#4488ff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={swipeRight} style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#44ff88' }}>
          <Feather name="heart" size={28} color="#44ff88" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
