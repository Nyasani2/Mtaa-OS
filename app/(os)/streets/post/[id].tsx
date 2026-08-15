import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet, useWindowDimensions, Platform, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, MessageCircle, Bookmark, Share2, ArrowLeft, Send, Zap, Flag } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import FollowButton from '@/domains/streets/components/follow-button';
import BoostModal from '@/domains/streets/components/boost-modal';
import ReportModal from '@/domains/streets/components/report-modal';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';

  const [post, setPost] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [boostPost, setBoostPost] = useState<any>(null);
  const [reportPost, setReportPost] = useState<any>(null);

  useEffect(() => { loadPost(); }, [id]);

  async function loadPost() {
    setLoading(true);
    const { data } = await supabase.from('streets_posts').select('*,creator:creator_id(username,avatar_url,verified)').eq('id',id).single();
    if (data) setPost(data);
    const { data: c } = await supabase.from('streets_comments').select('*,creator:user_id(username,avatar_url)').eq('post_id',id).order('created_at',{ascending:false}).limit(50);
    if (c) setComments(c);
    setLoading(false);
  }

  async function submitComment() {
    if (!commentText.trim() || !user) return;
    await supabase.from('streets_comments').insert({ post_id: id, user_id: user.id, content: commentText.trim() });
    setCommentText('');
    loadPost();
  }

  async function likePost() {
    if (!user || !post) return;
    await supabase.from('streets_post_likes').insert({ post_id: id, user_id: user.id }).select();
    setPost({...post, likes_count: (post.likes_count||0)+1, isLiked: true});
  }

  async function savePost() {
    if (!user || !post) return;
    await supabase.rpc('streets_save_post',{p_user_id:user.id,p_post_id:id});
    setPost({...post, saves_count: (post.saves_count||0)+1, isSaved: true});
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color="#ff2d55"/></View>;
  if (!post) return <View style={styles.center}><Text style={styles.empty}>Post not found</Text></View>;

  const creator = post.creator || {};
  const mediaH = isWeb ? Math.min(width * 0.5, 520) : width * 0.9;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>router.back()} style={styles.backBtn}><ArrowLeft size={22} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{width:40}}/>
      </View>

      <FlatList
        data={comments}
        keyExtractor={c=>c.id}
        ListHeaderComponent={(
          <View>
            <View style={[styles.mediaWrap,{height:mediaH}]}>
              <Image source={{uri:post.media_url||post.thumbnail_url}} style={{width:'100%',height:'100%'}} resizeMode="cover"/>
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={likePost}>
                <Heart size={26} color={post.isLiked?'#ff2d55':'#fff'} fill={post.isLiked?'#ff2d55':'none'}/>
                <Text style={styles.actionCount}>{post.likes_count||0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <MessageCircle size={26} color="#fff"/><Text style={styles.actionCount}>{post.comments_count||0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={savePost}>
                <Bookmark size={26} color={post.isSaved?'#ffd700':'#fff'} fill={post.isSaved?'#ffd700':'none'}/>
                <Text style={styles.actionCount}>{post.saves_count||0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}><Share2 size={26} color="#fff"/><Text style={styles.actionCount}>{post.shares_count||0}</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={()=>setBoostPost(post)}><Zap size={26} color="#ffd700"/><Text style={styles.actionCount}>Boost</Text></TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={()=>setReportPost(post)}><Flag size={24} color="#fff"/><Text style={styles.actionCount}>Report</Text></TouchableOpacity>
            </View>

            <View style={styles.creatorBox}>
              <TouchableOpacity style={styles.creatorRow} onPress={()=>router.push(`/streets/user/${post.creator_id}`)}>
                <Image source={{uri:creator.avatar_url||'https://i.pravatar.cc/150?u='+post.creator_id}} style={styles.avatar}/>
                <View><Text style={styles.username}>@{creator.username||'user'}</Text><Text style={styles.caption}>{post.caption||post.content}</Text></View>
              </TouchableOpacity>
              <FollowButton userId={post.creator_id}/>
            </View>

            <Text style={styles.commentsHeader}>Comments ({comments.length})</Text>
          </View>
        )}
        renderItem={({item})=> (
          <View style={styles.commentRow}>
            <Image source={{uri:item.creator?.avatar_url||'https://i.pravatar.cc/150?u='+item.user_id}} style={styles.commentAvatar}/>
            <View style={styles.commentBody}>
              <Text style={styles.commentUser}>@{item.creator?.username||'user'}</Text>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No comments yet. Be the first!</Text>}
      />

      <View style={styles.commentBar}>
        <TextInput style={styles.commentInput} placeholder="Add a comment..." placeholderTextColor="#555" value={commentText} onChangeText={setCommentText}/>
        <TouchableOpacity onPress={submitComment} style={styles.sendBtn}><Send size={20} color="#ff2d55"/></TouchableOpacity>
      </View>

      <BoostModal visible={!!boostPost} post={boostPost} onClose={()=>setBoostPost(null)}/>
      <ReportModal visible={!!reportPost} post={reportPost} onClose={()=>setReportPost(null)}/>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#000'},
  center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#000'},
  empty:{color:'#888',fontSize:14},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:Platform.OS==='ios'?50:16,paddingBottom:10,backgroundColor:'#000',borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  backBtn:{width:40,height:40,borderRadius:20,backgroundColor:'#1a1a1a',justifyContent:'center',alignItems:'center'},
  headerTitle:{color:'#fff',fontSize:17,fontWeight:'700'},
  mediaWrap:{width:'100%',backgroundColor:'#111'},
  actionRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  actionBtn:{alignItems:'center',gap:2},
  actionCount:{color:'#fff',fontSize:11,fontWeight:'600'},
  creatorBox:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',padding:16,borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  creatorRow:{flexDirection:'row',alignItems:'center',gap:10,flex:1},
  avatar:{width:44,height:44,borderRadius:22},
  username:{color:'#fff',fontSize:14,fontWeight:'700'},
  caption:{color:'#aaa',fontSize:13,marginTop:2},
  commentsHeader:{color:'#fff',fontSize:15,fontWeight:'700',padding:16,paddingBottom:8},
  commentRow:{flexDirection:'row',gap:10,paddingHorizontal:16,paddingVertical:8},
  commentAvatar:{width:32,height:32,borderRadius:16},
  commentBody:{flex:1},
  commentUser:{color:'#fff',fontSize:13,fontWeight:'700'},
  commentText:{color:'#ccc',fontSize:13,marginTop:2},
  commentBar:{flexDirection:'row',alignItems:'center',gap:10,paddingHorizontal:12,paddingVertical:10,borderTopWidth:1,borderTopColor:'#1a1a1a',backgroundColor:'#000'},
  commentInput:{flex:1,height:40,backgroundColor:'#1a1a1a',borderRadius:20,paddingHorizontal:14,color:'#fff',fontSize:14},
  sendBtn:{width:36,height:36,borderRadius:18,backgroundColor:'#1a1a1a',justifyContent:'center',alignItems:'center'},
});
