import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Image, Pressable, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getUserPosts, followUser, isFollowing, getFollowCounts } from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { StreetsPost } from '@/lib/services/streets-service';

const W = Dimensions.get('window').width;
const GS = (W - 4) / 3;

function fmt(n: number): string { if (!n||n<=0) return '0'; if (n>=1e6) return (n/1e6).toFixed(1)+'M'; if (n>=1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }

export default function CreatorProfileScreen() {
  const { userId } = useLocalSearchParams<{userId:string}>();
  const router = useRouter(); const insets = useSafeAreaInsets();
  const currentUser = useAuthStore(s=>s.user);
  const [posts,setPosts] = useState<StreetsPost[]>([]); const [loading,setLoading] = useState(true); const [refreshing,setRefreshing] = useState(false);
  const [error,setError] = useState<string|null>(null); const [tab,setTab] = useState<'all'|'pics'|'videos'>('all');
  const [isFollowingUser,setIsFollowingUser] = useState(false); const [followLoading,setFollowLoading] = useState(false);
  const [followCounts,setFollowCounts] = useState({followers:0,following:0}); const [profile,setProfile] = useState<any>(null);
  const [page,setPage] = useState(0); const [hasMore,setHasMore] = useState(true); const [loadingMore,setLoadingMore] = useState(false);
  const isOwn = currentUser?.id === userId;

  const load = useCallback(async (refresh=false) => {
    if (!userId) return;
    if (!refresh) setLoading(true); setError(null);
    try {
      const result = await getUserPosts(userId, 0, 30);
      setPosts(result.posts); setHasMore(result.hasMore); setPage(0);
      if (!isOwn) { const f = await isFollowing(userId); setIsFollowingUser(f); }
      const counts = await getFollowCounts(userId); setFollowCounts(counts);
      if (result.posts.length>0 && result.posts[0].creator) setProfile(result.posts[0].creator);
      else { const {supabase} = await import('@/lib/supabase'); const {data} = await supabase.from('user_profiles').select('id,display_name,avatar_url,is_verified,bio').eq('id',userId).single(); setProfile(data); }
    } catch(e:any){ setError(e.message||'Failed to load'); } finally { setLoading(false); setRefreshing(false); }
  }, [userId, isOwn]);
  useEffect(()=>{ load(); },[load]);
  const onRefresh = useCallback(()=>{ setRefreshing(true); load(true); },[load]);

  const handleFollow = useCallback(async () => { if (isOwn) return; setFollowLoading(true); try { const r = await followUser(userId); setIsFollowingUser(r.following); const c = await getFollowCounts(userId); setFollowCounts(c); } finally { setFollowLoading(false); } }, [userId, isOwn]);
  const loadMore = useCallback(async () => { if (loadingMore||!hasMore) return; setLoadingMore(true); try { const np = page+1; const r = await getUserPosts(userId, np, 30); setPosts(prev=>{ const ids=new Set(prev.map(p=>p.id)); return [...prev,...r.posts.filter(p=>!ids.has(p.id))]; }); setHasMore(r.hasMore); setPage(np); } finally { setLoadingMore(false); } }, [userId, page, hasMore, loadingMore]);

  const filtered = posts.filter(p => tab==='all'?true:tab==='pics'?(p.media_type==='image'||p.media_type==='text'):p.media_type==='video');

  const renderItem = useCallback(({item}:{item:StreetsPost})=> (
    <Pressable style={styles.gridItem} onPress={()=>router.push(`/(os)/streets/post/${item.id}`)}>
      {item.media_url && item.media_type!=='text' ? <Image source={{uri:item.media_url}} style={styles.gridImg}/>
      : <View style={[styles.gridImg,styles.textGrid]}><Text style={styles.textGridContent} numberOfLines={4}>{item.content||item.caption}</Text></View>}
      {item.media_type==='video'&&<View style={styles.videoBadge}><Ionicons name="videocam" size={14} color="#fff"/></View>}
      <View style={styles.gridOverlay}><Ionicons name="heart" size={12} color="#fff"/><Text style={styles.gridStat}>{fmt(item.likes_count||0)}</Text></View>
    </Pressable>
  ),[router]);

  if (loading) return <View style={[styles.container,{paddingTop:insets.top,justifyContent:'center',alignItems:'center'}]}><ActivityIndicator size="large" color="#FF2D55"/><Text style={styles.loadingText}>Loading...</Text></View>;
  if (error) return <View style={[styles.container,{paddingTop:insets.top,justifyContent:'center',alignItems:'center'}]}><Ionicons name="warning" size={64} color="#666"/><Text style={styles.errorTitle}>Failed to load</Text><Text style={styles.errorSub}>{error}</Text><Pressable style={styles.retryBtn} onPress={()=>load()}><Text style={styles.retryText}>Try Again</Text></Pressable></View>;

  return (
    <View style={[styles.container,{paddingTop:insets.top}]}>
      <View style={styles.header}>
        <Pressable onPress={()=>router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></Pressable>
        <Text style={styles.hTitle}>{profile?.display_name||'Creator'}</Text>
        <Pressable onPress={()=>router.push('/(os)/streets/settings')} style={styles.backBtn}><Ionicons name="settings-outline" size={24} color="#fff"/></Pressable>
      </View>
      <FlatList data={filtered} keyExtractor={i=>i.id} renderItem={renderItem} numColumns={3} contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff"/>}
        onEndReached={hasMore&&!loadingMore?loadMore:undefined} onEndReachedThreshold={0.5}
        ListHeaderComponent={
          <View>
            <View style={styles.profileHeader}>
              <Image source={{uri:profile?.avatar_url||'https://placehold.co/100x100/333/fff?text=U'}} style={styles.profileAvatar}/>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}><Text style={styles.profileName}>{profile?.display_name||'Anonymous'}</Text>{profile?.is_verified&&<Ionicons name="checkmark-circle" size={16} color="#3897F0"/>}</View>
                <Text style={styles.handle}>@{profile?.display_name?.toLowerCase().replace(/\s+/g,'')||'user'}</Text>
                {profile?.bio&&<Text style={styles.bio}>{profile.bio}</Text>}
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statNum}>{fmt(posts.length)}</Text><Text style={styles.statLabel}>Posts</Text></View>
              <View style={styles.stat}><Text style={styles.statNum}>{fmt(followCounts.followers)}</Text><Text style={styles.statLabel}>Followers</Text></View>
              <View style={styles.stat}><Text style={styles.statNum}>{fmt(followCounts.following)}</Text><Text style={styles.statLabel}>Following</Text></View>
            </View>
            <View style={styles.actions}>
              {isOwn ? <Pressable style={styles.editBtn} onPress={()=>router.push('/(os)/profile')}><Text style={styles.editText}>Edit Profile</Text></Pressable>
              : <Pressable style={[styles.followBtn,isFollowingUser&&styles.followingBtn,followLoading&&styles.followLoading]} onPress={handleFollow} disabled={followLoading}>
                  {followLoading?<ActivityIndicator size="small" color="#fff"/>:<Text style={[styles.followText,isFollowingUser&&styles.followingText]}>{isFollowingUser?'Following':'Follow'}</Text>}
                </Pressable>}
              <Pressable style={styles.msgBtn} onPress={()=>router.push(`/(os)/streets/chat/${userId}`)}><Ionicons name="chatbubble" size={18} color="#fff"/></Pressable>
            </View>
            {isOwn&&<Pressable style={styles.newPostBtn} onPress={()=>router.push('/(os)/streets/create')}><Ionicons name="add" size={20} color="#000"/><Text style={styles.newPostText}>New Post</Text></Pressable>}
            <View style={styles.tabs}>
              {(['all','pics','videos'] as const).map(t=> (
                <Pressable key={t} style={[styles.tab,tab===t&&styles.tabActive]} onPress={()=>setTab(t)}>
                  <Text style={[styles.tabText,tab===t&&styles.tabTextActive]}>{t==='all'?'All':t==='pics'?'Pics':'Videos'}</Text>
                  <Text style={[styles.tabCount,tab===t&&styles.tabCountActive]}>{t==='all'?posts.length:t==='pics'?posts.filter(p=>p.media_type==='image'||p.media_type==='text').length:posts.filter(p=>p.media_type==='video').length}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="images" size={48} color="#333"/><Text style={styles.emptyTitle}>No posts yet</Text><Text style={styles.emptySub}>{isOwn?'Create your first post!':'This creator has not posted yet.'}</Text>{isOwn&&<Pressable style={styles.createBtn} onPress={()=>router.push('/(os)/streets/create')}><Text style={styles.createText}>Create Post</Text></Pressable>}</View>}
        ListFooterComponent={loadingMore?<View style={styles.loadMore}><ActivityIndicator color="#FF2D55"/></View>:null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#000'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#222'},
  backBtn:{padding:4}, hTitle:{color:'#fff',fontSize:18,fontWeight:'700'},
  loadingText:{color:'#888',marginTop:16,fontSize:16},
  errorTitle:{color:'#fff',fontSize:20,fontWeight:'700',marginTop:16},
  errorSub:{color:'#888',fontSize:14,textAlign:'center',marginTop:8,paddingHorizontal:40},
  retryBtn:{marginTop:24,backgroundColor:'#FF2D55',paddingHorizontal:24,paddingVertical:12,borderRadius:8},
  retryText:{color:'#fff',fontSize:16,fontWeight:'600'},
  profileHeader:{flexDirection:'row',alignItems:'center',gap:16,paddingHorizontal:16,paddingVertical:20},
  profileAvatar:{width:80,height:80,borderRadius:40,borderWidth:2,borderColor:'#fff'},
  profileInfo:{flex:1,gap:4},
  nameRow:{flexDirection:'row',alignItems:'center',gap:6},
  profileName:{color:'#fff',fontSize:20,fontWeight:'700'},
  handle:{color:'#888',fontSize:14},
  bio:{color:'#ccc',fontSize:14,lineHeight:20,marginTop:4},
  statsRow:{flexDirection:'row',justifyContent:'space-around',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#222'},
  stat:{alignItems:'center',gap:2},
  statNum:{color:'#fff',fontSize:18,fontWeight:'700'},
  statLabel:{color:'#888',fontSize:13},
  actions:{flexDirection:'row',gap:12,paddingHorizontal:16,paddingVertical:12},
  followBtn:{flex:1,backgroundColor:'#FF2D55',paddingVertical:10,borderRadius:8,alignItems:'center'},
  followingBtn:{backgroundColor:'transparent',borderWidth:1,borderColor:'#666'},
  followLoading:{backgroundColor:'#333'},
  followText:{color:'#fff',fontSize:15,fontWeight:'600'},
  followingText:{color:'#888'},
  editBtn:{flex:1,backgroundColor:'#222',paddingVertical:10,borderRadius:8,alignItems:'center'},
  editText:{color:'#fff',fontSize:15,fontWeight:'600'},
  msgBtn:{width:44,height:44,backgroundColor:'#222',borderRadius:8,justifyContent:'center',alignItems:'center'},
  newPostBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',gap:8,backgroundColor:'#00D4FF',paddingVertical:12,borderRadius:8,marginHorizontal:16,marginBottom:12},
  newPostText:{color:'#000',fontSize:15,fontWeight:'700'},
  tabs:{flexDirection:'row',borderBottomWidth:1,borderBottomColor:'#222',marginTop:8},
  tab:{flex:1,alignItems:'center',paddingVertical:12,gap:2},
  tabActive:{borderBottomWidth:2,borderBottomColor:'#FF2D55'},
  tabText:{color:'#888',fontSize:14,fontWeight:'500'},
  tabTextActive:{color:'#fff',fontWeight:'600'},
  tabCount:{color:'#666',fontSize:12},
  tabCountActive:{color:'#fff'},
  grid:{padding:1},
  gridItem:{width:GS,height:GS,margin:1,position:'relative'},
  gridImg:{width:'100%',height:'100%',backgroundColor:'#111'},
  textGrid:{justifyContent:'center',padding:8},
  textGridContent:{color:'#fff',fontSize:10,lineHeight:14},
  videoBadge:{position:'absolute',top:4,right:4,backgroundColor:'rgba(0,0,0,0.6)',borderRadius:4,padding:2},
  gridOverlay:{position:'absolute',bottom:0,left:0,right:0,flexDirection:'row',alignItems:'center',gap:4,padding:4,backgroundColor:'rgba(0,0,0,0.5)'},
  gridStat:{color:'#fff',fontSize:11},
  empty:{alignItems:'center',paddingVertical:60},
  emptyTitle:{color:'#fff',fontSize:18,fontWeight:'600',marginTop:12},
  emptySub:{color:'#888',fontSize:14,textAlign:'center',marginTop:4,paddingHorizontal:40},
  createBtn:{marginTop:16,backgroundColor:'#FF2D55',paddingHorizontal:24,paddingVertical:10,borderRadius:8},
  createText:{color:'#fff',fontSize:15,fontWeight:'600'},
  loadMore:{paddingVertical:20,alignItems:'center'},
});
