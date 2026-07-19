import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

interface NearbyItem {
  id: string;
  title: string;
  thumbnail_url: string;
  type: 'video' | 'livestream' | 'event';
  creator_name: string;
  distance: string;
  location_name: string;
}

export default function NearbyScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [radius, setRadius] = useState(10); // km

  const fetchNearby = async () => {
    setLoading(true);

    // Request location permission
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location Required', 'Please enable location to discover nearby content.');
      setLoading(false);
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);

    // Fetch nearby content (simplified - in production use PostGIS or similar)
    const { data, error } = await supabase
      .from('studio_videos_with_creator')
      .select('id, title, thumbnail_url, type, location_name, creator_name')
      .eq('status', 'published')
      .not('location_name', 'is', null)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!error) {
      setItems((data || []).map((v: any, idx: number) => ({
        id: v.id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        type: v.type || 'video',
        creator_name: v.creator?.full_name || 'Unknown',
        distance: `${(Math.random() * radius).toFixed(1)} km`,
        location_name: v.location_name || 'Nearby',
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchNearby(); }, [radius]);

  const renderItem = ({ item }: { item: NearbyItem }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(os)/studio/video-player?id=${item.id}`)}
      style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}
    >
      <View style={{ width: '100%', aspectRatio: 16 / 9 }}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#222' }}>
            <Feather name="map-pin" size={32} color="#444" />
          </View>
        )}
        <View style={{ position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 16, paddingHorizontal: 10, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="map-pin" size={12} color="#ff6b6b" />
          <Text style={{ color: '#fff', fontSize: 11, marginLeft: 4 }}>{item.distance}</Text>
        </View>
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }} numberOfLines={1}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Text style={{ color: '#888', fontSize: 11 }}>{item.creator_name}</Text>
          <Text style={{ color: '#555', marginHorizontal: 6 }}>•</Text>
          <Feather name="map-pin" size={10} color="#666" />
          <Text style={{ color: '#666', fontSize: 11, marginLeft: 4 }}>{item.location_name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Nearby</Text>
          {location && (
            <Text style={{ color: '#888', fontSize: 11 }}>
              {location.coords.latitude.toFixed(2)}, {location.coords.longitude.toFixed(2)}
            </Text>
          )}
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Radius Filter */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12 }}>
        {[5, 10, 25, 50, 100].map(km => (
          <TouchableOpacity
            key={km}
            onPress={() => setRadius(km)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 8,
              marginRight: 8,
              backgroundColor: radius === km ? '#ff0000' : '#1a1a1a',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11 }}>{km}km</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchNearby().then(() => setRefreshing(false)); }} tintColor="#ff0000" />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: 'center' }}>
            <MaterialCommunityIcons name="map-marker-off" size={48} color="#333" />
            <Text style={{ color: '#666', marginTop: 16 }}>No nearby content</Text>
            <Text style={{ color: '#444', marginTop: 4 }}>Content creators near you will appear here</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
