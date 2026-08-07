import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, TextInput, FlatList, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Heart, Eye, Radio } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function LiveWatchScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { width, height } = useWindowDimensions();
  const [stream, setStream] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    loadStream();
    const sub = supabase.channel('live_'+id).on('postgres_changes',{event:'INSERT',schema:'public',table:'streets_live_comments',filter:'stream_id=eq.'+id},(payload)=>{
      setComments(prev=>[payload.new as any,...prev].slice(0,100));
    }).subscribe();
    return () => { sub.unsubscribe(); };
  }, [id]);

  async function loadStream() {
    const { data } = await supabase.from('streets_live_streams').select('*,creator:user_id(username,avatar_url)').eq('id',id).single();
    if (data) setStream(data);
  }

  async function sendComment() {
    if (!commentText.trim() || !user) return;
    await supabase.from('streets_live_comments').insert({ stream_id: id, user_id: user.id, content: commentText.trim() });
    setCommentText('');
  }

  if (!stream) return <View style={styles.center}><Text style={styles.empty}>Loading stream...</Text></View>;

  return (
    <View style={styles.root}>
      <View style={[styles.videoArea,{width,height:height*0.6}]}>
        <Image source={{uri:stream.thumbnail_url||'https://via.placeholder.com/400x700/111/333?text=LIVE'}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
        <View style={styles.overlay}>
          <TouchableOpacity onPress={()=>router.back()} style={styles.backBtn}><ArrowLeft size={22} color="#fff"/></TouchableOpacity>
          <View style={styles.liveBadge}><Radio size={12} color="#fff"/><Text style={styles.liveText}>LIVE</Text></View>
          <View style={styles.streamerInfo}>
            <Image source={{uri:stream.creator?.avatar_url||'https://i.pravatar.cc/150?u='+stream.user_id}} style={styles.streamerAvatar}/>
            <Text style={styles.streamerName}>@{stream.creator?.username||'user'}</Text>
          </View>
          <View style={styles.viewerBadge}><Eye size={14} color="#fff"/><Text style={styles.viewerText}>{stream.viewer_count||0}</Text></View>
        </View>
      </View>

      <View style={styles.chatArea}>
        <FlatList
          data={comments}
          inverted
          keyExtractor={c=>c.id}
          renderItem={({item})=> (
            <View style={styles.chatRow}>
              <Text style={styles.chatUser}>@{item.user_id?.slice(0,8)}</Text>
              <Text style={styles.chatText}>{item.content}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyChat}>No comments yet. Say hello!</Text>}
        />
        <View style={styles.inputBar}>
          <TextInput style={styles.chatInput} placeholder="Say something..." placeholderTextColor="#555" value={commentText} onChangeText={setCommentText}/>
          <TouchableOpacity onPress={sendComment} style={styles.sendBtn}><Send size={18} color="#ff2d55"/></TouchableOpacity>
          <TouchableOpacity style={styles.heartBtn}><Heart size={20} color="#ff2d55"/></TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#000'},
  center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000'},
  empty:{color:'#888',fontSize:14},
  videoArea:{position:'relative',backgroundColor:'#111'},
  overlay:{...StyleSheet.absoluteFillObject,justifyContent:'space-between',padding:16},
  backBtn:{width:40,height:40,borderRadius:20,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center'},
  liveBadge:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'#ff2d55',borderRadius:4,paddingHorizontal:8,paddingVertical:4},
  liveText:{color:'#fff',fontSize:12,fontWeight:'700'},
  streamerInfo:{flexDirection:'row',alignItems:'center',gap:8},
  streamerAvatar:{width:32,height:32,borderRadius:16,borderWidth:1,borderColor:'#fff'},
  streamerName:{color:'#fff',fontSize:14,fontWeight:'700'},
  viewerBadge:{alignSelf:'flex-end',flexDirection:'row',alignItems:'center',gap:4,backgroundColor:'rgba(0,0,0,0.5)',borderRadius:12,paddingHorizontal:10,paddingVertical:4},
  viewerText:{color:'#fff',fontSize:12},
  chatArea:{flex:1,paddingHorizontal:12},
  chatRow:{flexDirection:'row',gap:6,paddingVertical:3},
  chatUser:{color:'#3897f0',fontSize:13,fontWeight:'700'},
  chatText:{color:'#fff',fontSize:13},
  emptyChat:{color:'#555',fontSize:13,textAlign:'center',marginTop:20},
  inputBar:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:10,borderTopWidth:1,borderTopColor:'#1a1a1a'},
  chatInput:{flex:1,height:40,backgroundColor:'#1a1a1a',borderRadius:20,paddingHorizontal:14,color:'#fff',fontSize:14},
  sendBtn:{width:36,height:36,borderRadius:18,backgroundColor:'#1a1a1a',justifyContent:'center',alignItems:'center'},
  heartBtn:{width:36,height:36,borderRadius:18,backgroundColor:'rgba(255,45,85,0.15)',justifyContent:'center',alignItems:'center'},
});
