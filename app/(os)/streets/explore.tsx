import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Search, ArrowLeft, TrendingUp } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ExploreScreen() {
  const router = useRouter();
  const { tag } = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const cols = isWeb ? (width > 1200 ? 4 : width > 800 ? 3 : 2) : 3;
  const itemW = (width - (cols + 1) * 2) / cols;

  const [posts, setPosts] = useState<any[]>([]);
  const [query, setQuery] = useState(tag ? `#${tag}` : '');
  const [trending, setTrending] = useState<string[]>(['mtaa','kenya','nairobi','fyp','viral','trending','music','comedy','food','fashion']);

  useEffect(() => { if (tag) searchPosts(`#${tag}`); else loadTrending(); }, [tag]);

  async function loadTrending() {
    const { data } = await supabase.from('streets_posts').select('id,media_url,thumbnail_url,likes_count').order('likes_count',{ascending:false}).limit(30);
    if (data) setPosts(data);
  }

  async function searchPosts(q: string) {
    const clean = q.replace(/^#/, '');
    const { data } = await supabase.from('streets_posts').select('id,media_url,thumbnail_url,likes_count').contains('hashtags',[clean]).order('likes_count',{ascending:false}).limit(50);
    if (data) setPosts(data);
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>router.back()} style={styles.backBtn}><ArrowLeft size={22} color="#fff"/></TouchableOpacity>
        <View style={styles.searchBox}>
          <Search size={16} color="#888"/>
          <TextInput style={styles.searchInput} placeholder="Search hashtags..." placeholderTextColor="#555" value={query} onChangeText={setQuery} onSubmitEditing={()=>searchPosts(query)}/>
        </View>
      </View>

      {!tag && (
        <View style={styles.trendingBox}>
          <Text style={styles.trendingTitle}><TrendingUp size={14} color="#ff2d55"/> Trending</Text>
          <View style={styles.tagRow}>
            {trending.map((t: any) =><TouchableOpacity key={t} style={styles.tagChip} onPress={()=>{setQuery(`#${t}`);searchPosts(t);}}><Text style={styles.tagText}>#{t}</Text></TouchableOpacity>)}
          </View>
        </View>
      )}

      <FlatList
        data={posts}
        numColumns={cols}
        keyExtractor={p=>p.id}
        renderItem={({item})=> (
          <TouchableOpacity onPress={()=>router.push(`/streets/post/${item.id}` as any)} style={[styles.gridItem,{width:itemW,height:itemW}]}>
            <Image source={{uri:item.thumbnail_url||item.media_url}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.center}><Text style={styles.empty}>{tag?`No posts found for #${tag}`:'Search for hashtags or browse trending'}</Text></View>}
      />
    </View>
  );
}

import { TextInput } from 'react-native';

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#000'},
  header:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:12,paddingTop:Platform.OS==='ios'?50:16,paddingBottom:10,backgroundColor:'#000',borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  backBtn:{width:36,height:36,borderRadius:18,backgroundColor:'#1a1a1a',justifyContent:'center',alignItems:'center'},
  searchBox:{flex:1,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#1a1a1a',borderRadius:20,paddingHorizontal:12,height:40},
  searchInput:{flex:1,color:'#fff',fontSize:14},
  trendingBox:{padding:12},
  trendingTitle:{color:'#fff',fontSize:14,fontWeight:'700',flexDirection:'row',alignItems:'center',gap:6,marginBottom:8},
  tagRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  tagChip:{backgroundColor:'#1a1a1a',borderRadius:16,paddingVertical:6,paddingHorizontal:12},
  tagText:{color:'#3897f0',fontSize:13,fontWeight:'600'},
  gridItem:{padding:1},
  center:{flex:1,justifyContent:'center',alignItems:'center',padding:40},
  empty:{color:'#888',fontSize:14,textAlign:'center'},
});
