import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, Image, Pressable, StyleSheet, ScrollView,
  TextInput, ActivityIndicator, Alert, Share as RNShare,
  KeyboardAvoidingView, Platform, RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { usePostDetail } from '@/lib/hooks/useStreets';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';

function formatTimeAgo(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const s = Math.floor(diff/1000), m = Math.floor(s/60), h = Math.floor(m/60), days = Math.floor(h/24);
  if (s<60) return 'Just now'; if (m<60) return `${m}m`; if (h<24) return `${h}h`; if (days<7) return `${days}d`;
  return `${Math.floor(days/7)}w`;
}
function fmt(n: number): string { if (!n||n<=0) return '0'; if (n>=1e6) return (n/1e6).toFixed(1)+'M'; if (n>=1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{postId:string}>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const currentUser = useAuthStore(s=>s.user);
  const {
    post, loading, error, comments, commentsLoading, loadPost,
    likePost, savePost, addComment, deleteComment, sharePost, deletePost, reportPost
  } = usePostDetail(postId);

  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const commentInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);

  const isOwnPost = currentUser?.id === post?.creator_id;

  const handleLike = useCallback(async () => { try { await likePost(); } catch(e:any) { Alert.alert('Error', e.message); } }, [likePost]);
  const handleSave = useCallback(async () => { try { await savePost(); } catch(e:any) { Alert.alert('Error', e.message); } }, [savePost]);
  const handleShare = useCallback(async () => {
    try { await sharePost(); const url=`https://mtaa.app/streets/post/${postId}`;
      await RNShare.share({message:`${post?.caption||post?.content||'Check this out'}\n\n${url}`,url,title:'Share Post'});
    } catch(e:any) { if (!e.message?.includes('cancel')) Alert.alert('Error','Failed to share'); }
  }, [sharePost, postId, post]);

  // FIX: Comment button scrolls to input and focuses it
  const handleCommentPress = useCallback(() => {
    scrollRef.current?.scrollToEnd({animated:true});
    setTimeout(() => commentInputRef.current?.focus(), 300);
  }, []);

  const handleAddComment = useCallback(async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try { await addComment(commentText.trim()); setCommentText(''); }
    catch(e:any) { Alert.alert('Error', e.message||'Failed to add comment'); }
    finally { setSubmitting(false); }
  }, [commentText, addComment]);

  const handleDeleteComment = useCallback((id:string) => {
    Alert.alert('Delete Comment','Are you sure?',[
      {text:'Cancel',style:'cancel'},
      {text:'Delete',style:'destructive',onPress:async()=>{ try{await deleteComment(id);}catch(e:any){Alert.alert('Error',e.message);} }}
    ]);
  }, [deleteComment]);

  const handleReport = useCallback((reason:string) => {
    Alert.alert('Confirm Report','Report this post?',[
      {text:'Cancel',style:'cancel'},
      {text:'Report',style:'destructive',onPress:async()=>{ try{await reportPost(reason);Alert.alert('Reported','We will review this.');}catch(e:any){Alert.alert('Error',e.message);} }}
    ]);
  }, [reportPost]);

  const handleDeletePost = useCallback(() => {
    Alert.alert('Delete Post','Cannot be undone.',[
      {text:'Cancel',style:'cancel'},
      {text:'Delete',style:'destructive',onPress:async()=>{ try{await deletePost();router.back();}catch(e:any){Alert.alert('Error',e.message);} }}
    ]);
  }, [deletePost, router]);

  const handleMore = useCallback(() => {
    const opts: any[] = [{text:'Cancel',style:'cancel'},{text:'Copy Link',onPress:()=>Alert.alert('Copied','Link copied')},{text:'Report',onPress:()=>setShowReport(true),style:'destructive'}];
    if (isOwnPost) { opts.push({text:'Edit',onPress:()=>router.push(`/(os)/streets/edit/${postId}`)}); opts.push({text:'Delete',onPress:handleDeletePost,style:'destructive'}); }
    Alert.alert('Options','',opts);
  }, [isOwnPost, postId, router, handleDeletePost]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadPost(); setRefreshing(false); }, [loadPost]);

  if (loading) return <View style={[styles.container,{paddingTop:insets.top,justifyContent:'center',alignItems:'center'}]}><ActivityIndicator size="large" color="#FF2D55"/><Text style={styles.loadingText}>Loading...</Text></View>;
  if (error||!post) return <View style={[styles.container,{paddingTop:insets.top,justifyContent:'center',alignItems:'center'}]}><Ionicons name="warning" size={64} color="#666"/><Text style={styles.errorTitle}>Post not found</Text><Text style={styles.errorSub}>{error||'This post may have been deleted'}</Text><Pressable style={styles.errBtn} onPress={loadPost}><Text style={styles.errBtnText}>Try Again</Text></Pressable><Pressable style={[styles.errBtn,{marginTop:8,backgroundColor:'transparent'}]} onPress={()=>router.back()}><Text style={[styles.errBtnText,{color:'#3897F0'}]}>Go Back</Text></Pressable></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':'height'} style={[styles.container,{paddingTop:insets.top}]}>
      <View style={styles.header}>
        <Pressable onPress={()=>router.back()} style={styles.hBtn}><Ionicons name="arrow-back" size={24} color="#fff"/></Pressable>
        <Text style={styles.hTitle}>Post</Text>
        <Pressable onPress={handleMore} style={styles.hBtn}><Ionicons name="ellipsis-horizontal" size={24} color="#fff"/></Pressable>
      </View>
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff"/>}>
        <Pressable style={styles.creatorRow} onPress={()=>router.push(`/(os)/streets/creator/${post.creator_id}`)}>
          <Image source={{uri:post.creator?.avatar_url||'https://placehold.co/100x100/333/fff?text=U'}} style={styles.creatorAvatar}/>
          <View style={styles.creatorInfo}>
            <View style={styles.creatorNameRow}><Text style={styles.creatorName}>{post.creator?.display_name||'Anonymous'}</Text>{post.creator?.is_verified&&<Ionicons name="checkmark-circle" size={14} color="#3897F0"/>}</View>
            <Text style={styles.creatorTime}>{formatTimeAgo(post.created_at)}</Text>
          </View>
        </Pressable>
        {post.title&&<Text style={styles.title}>{post.title}</Text>}
        {post.media_type==='video'&&post.media_url ? <Video source={{uri:post.media_url}} style={styles.media} resizeMode={ResizeMode.CONTAIN} useNativeControls isLooping/>
        : post.media_type==='image'&&post.media_url ? <Image source={{uri:post.media_url}} style={styles.media} resizeMode="contain"/>
        : <LinearGradient colors={['#667eea','#764ba2']} style={styles.textPost}><Text style={styles.textPostContent}>{post.content}</Text></LinearGradient>}
        {post.caption&&<Text style={styles.caption}>{post.caption}</Text>}
        {post.hashtags?.length>0&&<View style={styles.hashtagsRow}>{post.hashtags.map((tag:string,i:number)=><Pressable key={i} onPress={()=>router.push(`/(os)/streets/hashtag/${encodeURIComponent(tag)}`)}><Text style={styles.hashtag}>#{tag}</Text></Pressable>)}</View>}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>{fmt(post.views_count||0)} views</Text><Text style={styles.statsDot}>·</Text>
          <Text style={styles.statsText}>{fmt(post.likes_count||0)} likes</Text><Text style={styles.statsDot}>·</Text>
          <Text style={styles.statsText}>{fmt(post.comments_count||0)} comments</Text>
        </View>
        <View style={styles.actionRow}>
          <Pressable onPress={handleLike} style={styles.actionBtn}><FontAwesome name={post.is_liked?'heart':'heart-o'} size={24} color={post.is_liked?'#FF2D55':'#fff'}/><Text style={styles.actionLabel}>Like</Text></Pressable>
          {/* FIX: Comment button now has onPress */}
          <Pressable onPress={handleCommentPress} style={styles.actionBtn}><FontAwesome5 name="comment" size={22} color="#fff"/><Text style={styles.actionLabel}>Comment</Text></Pressable>
          <Pressable onPress={handleSave} style={styles.actionBtn}><FontAwesome name={post.is_saved?'bookmark':'bookmark-o'} size={22} color={post.is_saved?'#FFD700':'#fff'}/><Text style={styles.actionLabel}>Save</Text></Pressable>
          <Pressable onPress={handleShare} style={styles.actionBtn}><FontAwesome5 name="share" size={20} color="#fff"/><Text style={styles.actionLabel}>Share</Text></Pressable>
        </View>
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({fmt(post.comments_count||0)})</Text>
          {commentsLoading ? <ActivityIndicator color="#FF2D55" style={{marginVertical:20}}/> : comments.length===0 ? (
            <View style={styles.emptyComments}><Ionicons name="chatbubbles" size={48} color="#333"/><Text style={styles.emptyCommentsText}>No comments yet</Text><Text style={styles.emptyCommentsSub}>Be the first!</Text></View>
          ) : (
            <View style={styles.commentsList}>
              {comments.map(c=> (
                <View key={c.id} style={styles.commentItem}>
                  <Image source={{uri:c.creator?.avatar_url||'https://placehold.co/100x100/333/fff?text=U'}} style={styles.commentAvatar}/>
                  <View style={styles.commentContent}>
                    <View style={styles.commentHeader}><Text style={styles.commentAuthor}>{c.creator?.display_name||'Anonymous'}</Text><Text style={styles.commentTime}>{formatTimeAgo(c.created_at)}</Text></View>
                    <Text style={styles.commentText}>{c.text}</Text>
                    <View style={styles.commentActions}>
                      <Pressable style={styles.commentAction}><Ionicons name={c.is_liked?"heart":"heart-outline"} size={14} color={c.is_liked?'#FF2D55':'#888'}/><Text style={styles.commentActionText}>{fmt(c.likes_count||0)}</Text></Pressable>
                      <Pressable style={styles.commentAction}><Text style={styles.commentActionText}>Reply</Text></Pressable>
                      {c.creator_id===currentUser?.id && <Pressable style={styles.commentAction} onPress={()=>handleDeleteComment(c.id)}><Text style={[styles.commentActionText,{color:'#FF2D55'}]}>Delete</Text></Pressable>}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{height:100}}/>
      </ScrollView>
      <View style={[styles.commentInputWrap,{paddingBottom:insets.bottom+8}]}>
        <TextInput ref={commentInputRef} style={styles.commentInput} placeholder="Add a comment..." placeholderTextColor="#666"
          value={commentText} onChangeText={setCommentText} multiline maxLength={1000}/>
        <Pressable onPress={handleAddComment} disabled={!commentText.trim()||submitting}
          style={[styles.commentSubmit,(!commentText.trim()||submitting)&&styles.commentSubmitDisabled]}>
          {submitting?<ActivityIndicator size="small" color="#fff"/>:<Ionicons name="send" size={20} color="#fff"/>}
        </Pressable>
      </View>
      {showReport&&<View style={styles.reportOverlay}><Pressable style={styles.reportBackdrop} onPress={()=>setShowReport(false)}/>
        <View style={[styles.reportModal,{paddingBottom:insets.bottom+16}]}>
          <Text style={styles.reportTitle}>Report Post</Text><Text style={styles.reportSub}>Why are you reporting this?</Text>
          {['Spam','Inappropriate Content','Harassment','Violence','Other'].map(r=> (
            <Pressable key={r} style={styles.reportOption} onPress={()=>{handleReport(r.toLowerCase().replace(' ','_'));setShowReport(false);}}>
              <Text style={styles.reportOptionText}>{r}</Text><Ionicons name="chevron-forward" size={16} color="#666"/>
            </Pressable>
          ))}
          <Pressable style={styles.reportCancel} onPress={()=>setShowReport(false)}><Text style={styles.reportCancelText}>Cancel</Text></Pressable>
        </View>
      </View>}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#000'},
  loadingText:{color:'#888',marginTop:16,fontSize:16},
  errorTitle:{color:'#fff',fontSize:20,fontWeight:'700',marginTop:16},
  errorSub:{color:'#888',fontSize:14,textAlign:'center',marginTop:8,paddingHorizontal:40},
  errBtn:{marginTop:24,backgroundColor:'#FF2D55',paddingHorizontal:24,paddingVertical:12,borderRadius:8},
  errBtnText:{color:'#fff',fontSize:16,fontWeight:'600'},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingHorizontal:16,paddingVertical:12,borderBottomWidth:1,borderBottomColor:'#222'},
  hBtn:{padding:4}, hTitle:{color:'#fff',fontSize:18,fontWeight:'700'},
  creatorRow:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:16,paddingVertical:12},
  creatorAvatar:{width:40,height:40,borderRadius:20},
  creatorInfo:{gap:2},
  creatorNameRow:{flexDirection:'row',alignItems:'center',gap:4},
  creatorName:{color:'#fff',fontSize:15,fontWeight:'600'},
  creatorTime:{color:'#888',fontSize:13},
  title:{color:'#fff',fontSize:18,fontWeight:'700',paddingHorizontal:16,paddingBottom:8},
  media:{width:'100%',height:300,backgroundColor:'#111'},
  textPost:{padding:40,minHeight:200,justifyContent:'center'},
  textPostContent:{color:'#fff',fontSize:18,fontWeight:'600',textAlign:'center',lineHeight:26},
  caption:{color:'#fff',fontSize:15,lineHeight:22,paddingHorizontal:16,paddingTop:12},
  hashtagsRow:{flexDirection:'row',flexWrap:'wrap',gap:8,paddingHorizontal:16,paddingTop:8},
  hashtag:{color:'#3897F0',fontSize:14,fontWeight:'600'},
  statsRow:{flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:16,paddingTop:12},
  statsText:{color:'#888',fontSize:13}, statsDot:{color:'#666',fontSize:13},
  actionRow:{flexDirection:'row',justifyContent:'space-around',paddingVertical:16,borderTopWidth:1,borderBottomWidth:1,borderColor:'#222',marginTop:8},
  actionBtn:{alignItems:'center',gap:4}, actionLabel:{color:'#fff',fontSize:12},
  commentsSection:{paddingHorizontal:16,paddingTop:16,paddingBottom:80},
  commentsTitle:{color:'#fff',fontSize:16,fontWeight:'700',marginBottom:12},
  emptyComments:{alignItems:'center',paddingVertical:40},
  emptyCommentsText:{color:'#666',fontSize:16,fontWeight:'600',marginTop:12},
  emptyCommentsSub:{color:'#444',fontSize:14,marginTop:4},
  commentsList:{gap:16},
  commentItem:{flexDirection:'row',gap:12},
  commentAvatar:{width:32,height:32,borderRadius:16},
  commentContent:{flex:1,gap:4},
  commentHeader:{flexDirection:'row',alignItems:'center',gap:8},
  commentAuthor:{color:'#fff',fontSize:14,fontWeight:'600'},
  commentTime:{color:'#666',fontSize:12},
  commentText:{color:'#ccc',fontSize:14,lineHeight:20},
  commentActions:{flexDirection:'row',gap:16,marginTop:4},
  commentAction:{flexDirection:'row',alignItems:'center',gap:4},
  commentActionText:{color:'#888',fontSize:12},
  commentInputWrap:{position:'absolute',bottom:0,left:0,right:0,flexDirection:'row',alignItems:'center',gap:8,paddingHorizontal:16,paddingTop:8,backgroundColor:'#000',borderTopWidth:1,borderTopColor:'#222'},
  commentInput:{flex:1,color:'#fff',fontSize:15,backgroundColor:'#111',paddingHorizontal:16,paddingVertical:10,borderRadius:20,maxHeight:100},
  commentSubmit:{width:40,height:40,backgroundColor:'#FF2D55',borderRadius:20,justifyContent:'center',alignItems:'center'},
  commentSubmitDisabled:{backgroundColor:'#333'},
  reportOverlay:{...StyleSheet.absoluteFillObject,zIndex:1000,justifyContent:'flex-end'},
  reportBackdrop:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,0.5)'},
  reportModal:{backgroundColor:'#1a1a1a',borderTopLeftRadius:20,borderTopRightRadius:20,paddingHorizontal:16,paddingTop:16},
  reportTitle:{color:'#fff',fontSize:18,fontWeight:'700',textAlign:'center',marginBottom:4},
  reportSub:{color:'#888',fontSize:14,textAlign:'center',marginBottom:16},
  reportOption:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:14,borderBottomWidth:1,borderBottomColor:'#333'},
  reportOptionText:{color:'#fff',fontSize:16},
  reportCancel:{paddingVertical:16,alignItems:'center'},
  reportCancelText:{color:'#FF2D55',fontSize:16,fontWeight:'600'},
});
