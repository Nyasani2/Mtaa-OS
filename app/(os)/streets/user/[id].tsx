import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Grid, Heart, Bookmark } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import FollowButton from '@/domains/streets/components/follow-button';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const cols = isWeb ? (width > 1000 ? 4 : 3) : 3;
  const itemW = (width - (cols + 1) * 2) / cols;

  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [tab, setTab] = useState<'posts'|'likes'|'saved'>('posts');

  const targetId = id === 'me' ? user?.id : id;

  useEffect(() => { if (targetId) loadProfile(); }, [targetId]);

  async function loadProfile() {
    const { data: p } = await supabase.from('user_profiles').select('*').eq('user_id',targetId).single();
    if (p) setProfile(p);
    const { data: pp } = await supabase.from('streets_posts').select('id,media_url,thumbnail_url,likes_count').eq('creator_id',targetId).order('created_at',{ascending:false});
    if (pp) setPosts(pp);
    const { count: fc } = await supabase.from('streets_follows').select('id',{count:'exact',head:true}).eq('following_id',targetId);
    setFollowers(fc||0);
    const { count: fg } = await supabase.from('streets_follows').select('id',{count:'exact',head:true}).eq('follower_id',targetId);
    setFollowing(fg||0);
  }

  if (!profile) return <View style={styles.center}><Text style={styles.empty}>Loading...</Text></View>;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>router.back()} style={styles.backBtn}><ArrowLeft size={22} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>@{profile.username||'user'}</Text>
        <View style={{width:40}}/>
      </View>

      <View style={styles.profileBox}>
        <Image source={{uri:profile.avatar_url||'https://i.pravatar.cc/150?u='+profile.user_id}} style={styles.avatar}/>
        <View style={styles.statsRow}>
          <View style={styles.stat}><Text style={styles.statNum}>{posts.length}</Text><Text style={styles.statLabel}>Posts</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{followers}</Text><Text style={styles.statLabel}>Followers</Text></View>
          <View style={styles.stat}><Text style={styles.statNum}>{following}</Text><Text style={styles.statLabel}>Following</Text></View>
        </View>
      </View>

      <Text style={styles.name}>{profile.display_name||profile.username||'User'}</Text>
      <Text style={styles.bio}>{profile.bio||''}</Text>
      {targetId !== user?.id && <FollowButton userId={targetId as string} size="md"/>}

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab,tab==='posts'&&styles.tabActive]} onPress={()=>setTab('posts')}><Grid size={20} color={tab==='posts'?'#ff2d55':'#888'}/></TouchableOpacity>
        <TouchableOpacity style={[styles.tab,tab==='likes'&&styles.tabActive]} onPress={()=>setTab('likes')}><Heart size={20} color={tab==='likes'?'#ff2d55':'#888'}/></TouchableOpacity>
        <TouchableOpacity style={[styles.tab,tab==='saved'&&styles.tabActive]} onPress={()=>setTab('saved')}><Bookmark size={20} color={tab==='saved'?'#ff2d55':'#888'}/></TouchableOpacity>
      </View>

      <FlatList
        data={tab==='posts'?posts:[]}
        numColumns={cols}
        keyExtractor={p=>p.id}
        renderItem={({item})=> (
          <TouchableOpacity onPress={()=>router.push(`/streets/post/${item.id}` as any)} style={[styles.gridItem,{width:itemW,height:itemW}]}>
            <Image source={{uri:item.thumbnail_url||item.media_url}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No posts yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#000'},
  center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000'},
  empty:{color:'#888',fontSize:14},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:Platform.OS==='ios'?50:16,paddingBottom:10,backgroundColor:'#000',borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  backBtn:{width:40,height:40,borderRadius:20,backgroundColor:'#1a1a1a',justifyContent:'center',alignItems:'center'},
  headerTitle:{color:'#fff',fontSize:16,fontWeight:'700'},
  profileBox:{flexDirection:'row',alignItems:'center',padding:16,gap:20},
  avatar:{width:80,height:80,borderRadius:40,borderWidth:2,borderColor:'#ff2d55'},
  statsRow:{flex:1,flexDirection:'row',justifyContent:'space-around'},
  stat:{alignItems:'center'},
  statNum:{color:'#fff',fontSize:18,fontWeight:'700'},
  statLabel:{color:'#888',fontSize:12,marginTop:2},
  name:{color:'#fff',fontSize:16,fontWeight:'700',paddingHorizontal:16},
  bio:{color:'#aaa',fontSize:13,paddingHorizontal:16,marginTop:2,marginBottom:12},
  tabRow:{flexDirection:'row',borderTopWidth:1,borderTopColor:'#1a1a1a'},
  tab:{flex:1,alignItems:'center',paddingVertical:12},
  tabActive:{borderBottomWidth:2,borderBottomColor:'#ff2d55'},
  gridItem:{padding:1,backgroundColor:'#111'},
});
