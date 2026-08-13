import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Story { id: string; creator_id: string; media_url: string; created_at: string; viewed?: boolean; creator?: { username: string; avatar_url: string; }; }

export default function StoriesRow() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => { loadStories(); }, []);
  async function loadStories() {
    const since = new Date(Date.now()-24*60*60*1000).toISOString();
    const { data } = await supabase.from('streets_posts').select('id,creator_id,media_url,thumbnail_url,created_at,creator:creator_id(username,avatar_url)').eq('is_story',true).gte('created_at',since).order('created_at',{ascending:false}).limit(20);
    if (data) {
      const seen = new Set();
      setStories(data.filter((s:any)=>{if(seen.has(s.creator_id))return false;seen.add(s.creator_id);return true;}));
    }
  }

  return (
    <View style={[styles.container,isWeb&&{maxWidth:600,alignSelf:'center',width:'100%'}]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.storyItem} onPress={()=>router.push('/streets/create' as any)}>
          <View style={[styles.ring,styles.myRing]}>
            {user?.avatar_url?<Image source={{uri:user.avatar_url}} style={styles.avatar}/>:<View style={[styles.avatar,styles.placeholder]}><Plus size={20} color="#fff"/></View>}
          </View>
          <Text style={styles.label} numberOfLines={1}>Your Story</Text>
        </TouchableOpacity>
        {stories.map((story: any) => (
          <TouchableOpacity key={story.id} style={styles.storyItem} onPress={()=>router.push(`/streets/post/${story.id}` as any)}>
            <View style={[styles.ring,!story.viewed&&styles.unviewedRing]}>
              <Image source={{uri:story.creator?.avatar_url||'https://i.pravatar.cc/150?u='+story.creator_id}} style={styles.avatar}/>
            </View>
            <Text style={styles.label} numberOfLines={1}>{story.creator?.username||'User'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container:{backgroundColor:'#000',borderBottomWidth:1,borderBottomColor:'#1a1a1a',paddingVertical:10},
  scroll:{paddingHorizontal:12,gap:14},
  storyItem:{alignItems:'center',width:64},
  ring:{width:60,height:60,borderRadius:30,borderWidth:2,borderColor:'#333',padding:2,justifyContent:'center',alignItems:'center'},
  myRing:{borderColor:'#3897f0',borderStyle:'dashed'},
  unviewedRing:{borderColor:'#ff2d55',borderWidth:2.5},
  avatar:{width:52,height:52,borderRadius:26,backgroundColor:'#222'},
  placeholder:{justifyContent:'center',alignItems:'center'},
  label:{color:'#fff',fontSize:11,marginTop:4,textAlign:'center',width:64},
});
