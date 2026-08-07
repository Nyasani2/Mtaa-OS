import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

interface FollowButtonProps { userId: string; size?: 'sm'|'md'; }

export default function FollowButton({ userId, size='md' }: FollowButtonProps) {
  const { user } = useAuthStore();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.id === userId) return;
    supabase.from('streets_follows').select('id',{count:'exact',head:true}).eq('follower_id',user.id).eq('following_id',userId).then(({count})=>setFollowing(!!count));
  }, [user, userId]);

  const toggle = async () => {
    if (!user || loading || user.id === userId) return;
    setLoading(true);
    if (following) {
      await supabase.rpc('streets_unfollow_user',{p_follower:user.id,p_following:userId});
      setFollowing(false);
    } else {
      await supabase.rpc('streets_follow_user',{p_follower:user.id,p_following:userId});
      setFollowing(true);
    }
    setLoading(false);
  };

  if (user?.id === userId) return null;
  return (
    <TouchableOpacity style={[styles.btn,size==='sm'&&styles.btnSm,following&&styles.btnFollowing]} onPress={toggle} disabled={loading} activeOpacity={0.8}>
      <Text style={[styles.text,size==='sm'&&styles.textSm,following&&styles.textFollowing]}>{following?'Following':'Follow'}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn:{backgroundColor:'#ff2d55',borderRadius:8,paddingVertical:10,paddingHorizontal:24},
  btnSm:{paddingVertical:6,paddingHorizontal:16,borderRadius:6},
  btnFollowing:{backgroundColor:'transparent',borderWidth:1,borderColor:'#555'},
  text:{color:'#fff',fontSize:14,fontWeight:'700'},
  textSm:{fontSize:12},
  textFollowing:{color:'#aaa'},
});
