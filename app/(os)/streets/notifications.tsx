// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, FlatList, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationRead } from '@/lib/services/streets-service';

interface Notif { id:string; type:string; actor_id:string; actor_name:string; actor_avatar:string|null; post_id?:string; message:string; is_read:boolean; created_at:string; }

function ago(d:string):string{ const diff=Date.now()-new Date(d).getTime(); const s=Math.floor(diff/1000),m=Math.floor(s/60),h=Math.floor(m/60),days=Math.floor(h/24); if(s<60)return'Just now';if(m<60)return`${m}m`;if(h<24)return`${h}h`;return`${days}d`; }
function icon(t:string):string{ const map:Record<string,string>={like:'heart',comment:'chatbubble',follow:'person-add',mention:'at',share:'share-social',live:'videocam'}; return map[t]||'notifications'; }
function color(t:string):string{ const map:Record<string,string>={like:'#FF2D55',comment:'#3897F0',follow:'#34C759',mention:'#FF9500',share:'#AF52DE',live:'#FF3B30'}; return map[t]||'#888'; }

export default function NotificationsScreen() {
  const router = useRouter(); const insets = useSafeAreaInsets();
  const [notifs,setNotifs] = useState<Notif[]>([]); const [loading,setLoading] = useState(true); const [refreshing,setRefreshing] = useState(false); const [error,setError] = useState<string|null>(null);

  const load = useCallback(async () => { try { setError(null); const data = await getNotifications(); setNotifs(data||[]); } catch(e:any){ setError(e.message||'Failed to load'); } finally { setLoading(false); setRefreshing(false); } }, []);
  useEffect(()=>{ load(); },[load]);
  const onRefresh = useCallback(()=>{ setRefreshing(true); load(); },[load]);

  const handlePress = useCallback(async (item:Notif) => {
    if(!item.is_read){ try{await markNotificationRead(item.id);}catch{} }
    if(item.post_id) router.push(`/(os)/streets/post/${item.post_id}`);
    else if(item.type==='follow') router.push(`/(os)/streets/creator/${item.actor_id}`);
  },[router]);

  const renderItem = useCallback(({item}:{item:Notif})=> (
    <Pressable style={[styles.item,!item.is_read&&styles.itemUnread]} onPress={()=>handlePress(item)}>
      <Image source={{uri:item.actor_avatar||'https://placehold.co/100x100/333/fff?text=U'}} style={styles.avatar}/>
      <View style={styles.content}>
        <Text style={styles.msg}><Text style={styles.actor}>{item.actor_name||'Someone'}</Text> {item.message}</Text>
        <Text style={styles.time}>{ago(item.created_at)}</Text>
      </View>
      <View style={[styles.badge,{backgroundColor:color(item.type)+'20'}]}><Ionicons name={icon(item.type) as any} size={18} color={color(item.type)}/></View>
      {!item.is_read&&<View style={styles.dot}/>}
    </Pressable>
  ),[handlePress]);

  if (loading) return <View style={[styles.container,{paddingTop:insets.top,justifyContent:'center',alignItems:'center'}]}><ActivityIndicator size="large" color="#FF2D55"/><Text style={styles.loadingText}>Loading...</Text></View>;

  return (
    <View style={[styles.container,{paddingTop:insets.top}]}>
      <View style={styles.header}>
        <Pressable onPress={()=>router.back()} style={styles.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></Pressable>
        <Text style={styles.hTitle}>Notifications</Text><View style={{width:32}}/>
      </View>
      {error ? <View style={styles.center}><Ionicons name="warning" size={64} color="#666"/><Text style={styles.errorTitle}>{error}</Text><Pressable style={styles.retryBtn} onPress={load}><Text style={styles.retryText}>Try Again</Text></Pressable></View>
      : notifs.length===0 ? <View style={styles.center}><Ionicons name="notifications-off" size={64} color="#333"/><Text style={styles.emptyTitle}>No notifications yet</Text><Text style={styles.emptySub}>When someone likes, comments, or follows you, you'll see it here.</Text></View>
      : <FlatList data={notifs} keyExtractor={i=>i.id} renderItem={renderItem} contentContainerStyle={styles.list} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff"/>}/>}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#000'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#222'},
  backBtn:{padding:4}, hTitle:{color:'#fff',fontSize:18,fontWeight:'700'},
  loadingText:{color:'#888',marginTop:16,fontSize:16},
  center:{flex:1,justifyContent:'center',alignItems:'center',padding:40},
  errorTitle:{color:'#fff',fontSize:18,fontWeight:'600',marginTop:16,textAlign:'center'},
  retryBtn:{marginTop:24,backgroundColor:'#FF2D55',paddingHorizontal:24,paddingVertical:12,borderRadius:8},
  retryText:{color:'#fff',fontSize:16,fontWeight:'600'},
  emptyTitle:{color:'#fff',fontSize:20,fontWeight:'700',marginTop:16},
  emptySub:{color:'#888',fontSize:14,textAlign:'center',marginTop:8,lineHeight:20},
  list:{paddingVertical:8},
  item:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#222'},
  itemUnread:{backgroundColor:'rgba(255,45,85,0.05)'},
  avatar:{width:44,height:44,borderRadius:22},
  content:{flex:1,gap:2},
  msg:{color:'#fff',fontSize:14,lineHeight:20},
  actor:{fontWeight:'700'},
  time:{color:'#888',fontSize:12},
  badge:{width:36,height:36,borderRadius:18,justifyContent:'center',alignItems:'center'},
  dot:{width:8,height:8,borderRadius:4,backgroundColor:'#FF2D55',marginLeft:4},
});
