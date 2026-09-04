// @ts-nocheck
import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, FlatList, Image, ActivityIndicator, Keyboard, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStreets } from '@/lib/hooks/useStreets';

type SearchTab = 'posts' | 'users' | 'hashtags';

const TRENDING = [
  { tag: 'mtaa', count: 12500 }, { tag: 'streets', count: 8900 },
  { tag: 'africa', count: 6700 }, { tag: 'music', count: 5400 },
  { tag: 'dance', count: 4300 }, { tag: 'comedy', count: 3200 },
  { tag: 'fashion', count: 2800 }, { tag: 'food', count: 2100 },
];

export default function SearchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { searchPosts, searchUsers, searchHashtags } = useStreets();

  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('posts');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [history, setHistory] = useState<string[]>(['mtaa','streets','africa','music']);
  const inputRef = useRef<TextInput>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setSearching(true); setHasSearched(true); Keyboard.dismiss();
    try {
      let data: any[] = [];
      switch (activeTab) {
        case 'posts': data = await searchPosts(q); break;
        case 'users': data = await searchUsers(q); break;
        case 'hashtags': data = await searchHashtags(q); break;
      }
      setResults(data);
      setHistory(prev => [q.trim().toLowerCase(), ...prev.filter(h => h !== q.trim().toLowerCase())].slice(0,10));
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, [activeTab, searchPosts, searchUsers, searchHashtags]);

  const renderItem = useCallback(({ item }: { item: any }) => {
    switch (activeTab) {
      case 'posts': return (
        <Pressable style={s.postResult} onPress={() => router.push(`/(os)/streets/post/${item.id}`)}>
          {item.media_url && item.media_type !== 'text'
            ? <Image source={{uri:item.media_url}} style={s.postImg} />
            : <View style={[s.postImg,s.textResult]}><Text style={s.textResultContent} numberOfLines={3}>{item.content||item.caption}</Text></View>
          }
          <View style={s.postInfo}>
            <Text style={s.postCaption} numberOfLines={2}>{item.caption||item.content}</Text>
            <View style={s.postStats}>
              <Ionicons name="heart" size={12} color="#888"/><Text style={s.postStat}>{item.likes_count||0}</Text>
              <Ionicons name="chatbubble" size={12} color="#888"/><Text style={s.postStat}>{item.comments_count||0}</Text>
            </View>
          </View>
        </Pressable>
      );
      case 'users': return (
        <Pressable style={s.userResult} onPress={() => router.push(`/(os)/streets/creator/${item.id}`)}>
          <Image source={{uri:item.avatar_url||'https://placehold.co/100x100/333/fff?text=U'}} style={s.userAvatar}/>
          <View style={s.userInfo}>
            <View style={s.userNameRow}>
              <Text style={s.userName}>{item.display_name||'Anonymous'}</Text>
              {item.is_verified && <Ionicons name="checkmark-circle" size={14} color="#3897F0"/>}
            </View>
            {item.bio && <Text style={s.userBio} numberOfLines={2}>{item.bio}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666"/>
        </Pressable>
      );
      case 'hashtags': return (
        <Pressable style={s.hashResult} onPress={() => router.push(`/(os)/streets/hashtag/${encodeURIComponent(item.tag)}`)}>
          <View style={s.hashIcon}><Ionicons name="search" size={20} color="#3897F0"/></View>
          <View style={s.hashInfo}>
            <Text style={s.hashTag}>#{item.tag}</Text>
            <Text style={s.hashCount}>{item.post_count?.toLocaleString()||'0'} posts</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666"/>
        </Pressable>
      );
      default: return null;
    }
  }, [activeTab, router]);

  return (
    <View style={[s.container,{paddingTop:insets.top}]}>
      <View style={s.header}>
        <Pressable onPress={()=>router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></Pressable>
        <View style={s.inputWrap}>
          <Ionicons name="search" size={18} color="#666" style={s.searchIcon}/>
          <TextInput ref={inputRef} style={s.input} placeholder="Search Streets..." placeholderTextColor="#666"
            value={query} onChangeText={setQuery} onSubmitEditing={()=>performSearch(query)} returnKeyType="search" autoFocus/>
          {query.length>0 && <Pressable onPress={()=>{setQuery('');setResults([]);setHasSearched(false);}}><Ionicons name="close-circle" size={18} color="#666"/></Pressable>}
        </View>
        <Pressable onPress={()=>performSearch(query)} style={s.searchBtn}><Text style={s.searchBtnText}>Search</Text></Pressable>
      </View>
      <View style={s.tabs}>
        {(['posts','users','hashtags'] as SearchTab[]).map(tab=> (
          <Pressable key={tab} style={[s.tab,activeTab===tab&&s.tabActive]} onPress={()=>{setActiveTab(tab);if(query.trim())performSearch(query);}}>
            <Text style={[s.tabText,activeTab===tab&&s.tabTextActive]}>{tab.charAt(0).toUpperCase()+tab.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      {searching ? (
        <View style={s.center}><ActivityIndicator size="large" color="#FF2D55"/><Text style={s.loadingText}>Searching...</Text></View>
      ) : hasSearched ? (
        results.length>0
          ? <FlatList data={results} keyExtractor={(item,i)=>`${activeTab}_${item.id||i}`} renderItem={renderItem} contentContainerStyle={s.resultsList} showsVerticalScrollIndicator={false}/>
          : <View style={s.center}><Ionicons name="search" size={64} color="#333"/><Text style={s.emptyTitle}>No results</Text><Text style={s.emptySub}>Try different keywords</Text></View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {history.length>0 && (
            <View style={s.section}>
              <View style={s.sectionHeader}><Text style={s.sectionTitle}>Recent</Text><Pressable onPress={()=>setHistory([])}><Text style={s.clearText}>Clear</Text></Pressable></View>
              {history.map((term,i)=> (
                <Pressable key={i} style={s.historyItem} onPress={()=>{setQuery(term);performSearch(term);}}>
                  <View style={s.historyLeft}><Ionicons name="time" size={18} color="#666"/><Text style={s.historyText}>{term}</Text></View>
                  <Pressable onPress={()=>setHistory(prev=>prev.filter(h=>h!==term))}><Ionicons name="close" size={18} color="#666"/></Pressable>
                </Pressable>
              ))}
            </View>
          )}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Trending</Text>
            {TRENDING.map((item,i)=> (
              <Pressable key={i} style={s.trendItem} onPress={()=>{setQuery(item.tag);setActiveTab('hashtags');performSearch(item.tag);}}>
                <View style={s.trendRank}><Text style={s.trendRankText}>{i+1}</Text></View>
                <View style={s.trendInfo}><Text style={s.trendTag}>#{item.tag}</Text><Text style={s.trendCount}>{item.count.toLocaleString()} posts</Text></View>
                <Ionicons name="trending-up" size={20} color="#FF2D55"/>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:{flex:1,backgroundColor:'#000'},
  header:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#222'},
  backBtn:{padding:4},
  inputWrap:{flex:1,flexDirection:'row',alignItems:'center',backgroundColor:'#111',borderRadius:10,paddingHorizontal:12,gap:8},
  searchIcon:{marginTop:1},
  input:{flex:1,color:'#fff',fontSize:16,paddingVertical:10},
  searchBtn:{paddingHorizontal:12,paddingVertical:8},
  searchBtnText:{color:'#FF2D55',fontSize:16,fontWeight:'600'},
  tabs:{flexDirection:'row',borderBottomWidth:1,borderBottomColor:'#222'},
  tab:{flex:1,paddingVertical:12,alignItems:'center'},
  tabActive:{borderBottomWidth:2,borderBottomColor:'#FF2D55'},
  tabText:{color:'#888',fontSize:15,fontWeight:'500'},
  tabTextActive:{color:'#fff',fontWeight:'600'},
  center:{flex:1,justifyContent:'center',alignItems:'center',padding:40},
  loadingText:{color:'#888',fontSize:16,marginTop:12},
  resultsList:{padding:16,gap:12},
  postResult:{flexDirection:'row',gap:12,backgroundColor:'#111',borderRadius:12,overflow:'hidden'},
  postImg:{width:100,height:100,backgroundColor:'#222'},
  textResult:{justifyContent:'center',padding:12},
  textResultContent:{color:'#fff',fontSize:12,lineHeight:18},
  postInfo:{flex:1,padding:12,justifyContent:'center',gap:8},
  postCaption:{color:'#fff',fontSize:14,lineHeight:20},
  postStats:{flexDirection:'row',alignItems:'center',gap:8},
  postStat:{color:'#888',fontSize:12},
  userResult:{flexDirection:'row',alignItems:'center',gap:12,padding:12,backgroundColor:'#111',borderRadius:12},
  userAvatar:{width:48,height:48,borderRadius:24},
  userInfo:{flex:1,gap:2},
  userNameRow:{flexDirection:'row',alignItems:'center',gap:4},
  userName:{color:'#fff',fontSize:15,fontWeight:'600'},
  userBio:{color:'#888',fontSize:13,lineHeight:18},
  hashResult:{flexDirection:'row',alignItems:'center',gap:12,padding:12,backgroundColor:'#111',borderRadius:12},
  hashIcon:{width:40,height:40,borderRadius:20,backgroundColor:'#1a1a2e',justifyContent:'center',alignItems:'center'},
  hashInfo:{flex:1},
  hashTag:{color:'#fff',fontSize:15,fontWeight:'600'},
  hashCount:{color:'#888',fontSize:13,marginTop:2},
  emptyTitle:{color:'#fff',fontSize:20,fontWeight:'700',marginTop:16},
  emptySub:{color:'#888',fontSize:14,textAlign:'center',marginTop:8},
  section:{paddingHorizontal:16,paddingTop:20},
  sectionHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:12},
  sectionTitle:{color:'#fff',fontSize:18,fontWeight:'700'},
  clearText:{color:'#FF2D55',fontSize:14},
  historyItem:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#222'},
  historyLeft:{flexDirection:'row',alignItems:'center',gap:12},
  historyText:{color:'#fff',fontSize:15},
  trendItem:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#222'},
  trendRank:{width:28,height:28,borderRadius:14,backgroundColor:'#222',justifyContent:'center',alignItems:'center'},
  trendRankText:{color:'#fff',fontSize:14,fontWeight:'700'},
  trendInfo:{flex:1},
  trendTag:{color:'#fff',fontSize:15,fontWeight:'600'},
  trendCount:{color:'#888',fontSize:13,marginTop:2},
});
