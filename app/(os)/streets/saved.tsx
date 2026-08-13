import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bookmark } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function SavedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const cols = isWeb ? (width > 1000 ? 4 : 3) : 3;
  const itemW = (width - (cols + 1) * 2) / cols;
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => { loadSaved(); }, []);
  async function loadSaved() {
    if (!user) return;
    const { data } = await supabase.from('streets_saves').select('post:post_id(id,media_url,thumbnail_url,likes_count)').eq('user_id',user.id).order('created_at',{ascending:false});
    if (data) setPosts(data.map((d:any)=>d.post).filter(Boolean));
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>router.back()} style={styles.backBtn}><ArrowLeft size={22} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Posts</Text>
        <View style={{width:40}}/>
      </View>
      <FlatList
        data={posts}
        numColumns={cols}
        keyExtractor={p=>p.id}
        renderItem={({item})=> (
          <TouchableOpacity onPress={()=>router.push(`/streets/post/${item.id}` as any)} style={[styles.gridItem,{width:itemW,height:itemW}]}>
            <Image source={{uri:item.thumbnail_url||item.media_url}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
          </TouchableOpacity>
        )}
        ListEmptyComponent={(
          <View style={styles.center}>
            <Bookmark size={48} color="#333"/>
            <Text style={styles.emptyTitle}>No saved posts</Text>
            <Text style={styles.emptySub}>Posts you save will appear here</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#000'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:Platform.OS==='ios'?50:16,paddingBottom:10,backgroundColor:'#000',borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  backBtn:{width:40,height:40,borderRadius:20,backgroundColor:'#1a1a1a',justifyContent:'center',alignItems:'center'},
  headerTitle:{color:'#fff',fontSize:17,fontWeight:'700'},
  gridItem:{padding:1,backgroundColor:'#111'},
  center:{flex:1,justifyContent:'center',alignItems:'center',padding:40},
  emptyTitle:{color:'#fff',fontSize:16,fontWeight:'700',marginTop:16},
  emptySub:{color:'#888',fontSize:13,marginTop:4},
});
