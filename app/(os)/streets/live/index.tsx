import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Radio, Eye, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function LiveListScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [streams, setStreams] = useState<any[]>([]);

  useEffect(() => { loadStreams(); }, []);
  async function loadStreams() {
    const { data } = await supabase.from('streets_live_streams').select('*,creator:user_id(username,avatar_url)').eq('status','live').order('started_at',{ascending:false});
    if (data) setStreams(data);
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>router.back()} style={styles.backBtn}><ArrowLeft size={22} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>LIVE</Text>
        <TouchableOpacity onPress={()=>router.push('/streets/live/create' as any)} style={styles.backBtn}><Plus size={22} color="#fff"/></TouchableOpacity>
      </View>
      <FlatList
        data={streams}
        keyExtractor={s=>s.id}
        renderItem={({item})=> (
          <TouchableOpacity style={styles.card} onPress={()=>router.push(`/streets/live/${item.id}` as any)}>
            <Image source={{uri:item.thumbnail_url||'https://via.placeholder.com/400x225/111/333?text=LIVE'}} style={styles.thumb}/>
            <View style={styles.liveBadge}><Radio size={12} color="#fff"/><Text style={styles.liveText}>LIVE</Text></View>
            <View style={styles.info}>
              <Image source={{uri:item.creator?.avatar_url||'https://i.pravatar.cc/150?u='+item.user_id}} style={styles.avatar}/>
              <View style={styles.infoText}>
                <Text style={styles.title}>{item.title||'Live Stream'}</Text>
                <Text style={styles.name}>@{item.creator?.username||'user'}</Text>
              </View>
              <View style={styles.viewers}><Eye size={14} color="#fff"/><Text style={styles.viewerCount}>{item.viewer_count||0}</Text></View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Radio size={48} color="#333"/>
            <Text style={styles.emptyTitle}>No live streams</Text>
            <Text style={styles.emptySub}>Be the first to go live!</Text>
            <TouchableOpacity style={styles.goLiveBtn} onPress={()=>router.push('/streets/live/create' as any)}>
              <Text style={styles.goLiveText}>Go Live</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#000'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:Platform.OS==='ios'?50:16,paddingBottom:10,backgroundColor:'#000',borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  backBtn:{width:40,height:40,borderRadius:20,backgroundColor:'#1a1a1a',justifyContent:'center',alignItems:'center'},
  headerTitle:{color:'#fff',fontSize:17,fontWeight:'700'},
  card:{marginHorizontal:12,marginVertical:8,borderRadius:12,overflow:'hidden',backgroundColor:'#111'},
  thumb:{width:'100%',height:200,backgroundColor:'#111'},
  liveBadge:{position:'absolute',top:12,left:12,flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#ff2d55',borderRadius:4,paddingHorizontal:8,paddingVertical:4},
  liveText:{color:'#fff',fontSize:12,fontWeight:'700'},
  info:{flexDirection:'row',alignItems:'center',padding:12,gap:10},
  avatar:{width:36,height:36,borderRadius:18},
  infoText:{flex:1},
  title:{color:'#fff',fontSize:14,fontWeight:'700'},
  name:{color:'#888',fontSize:12},
  viewers:{flexDirection:'row',alignItems:'center',gap:4},
  viewerCount:{color:'#fff',fontSize:12},
  center:{flex:1,justifyContent:'center',alignItems:'center',padding:40},
  emptyTitle:{color:'#fff',fontSize:16,fontWeight:'700',marginTop:16},
  emptySub:{color:'#888',fontSize:13,marginTop:4},
  goLiveBtn:{backgroundColor:'#ff2d55',borderRadius:8,paddingVertical:12,paddingHorizontal:32,marginTop:20},
  goLiveText:{color:'#fff',fontSize:14,fontWeight:'700'},
});
