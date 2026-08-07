import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Radio } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function LiveCreateScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  async function goLive() {
    if (!user || !title.trim()) return;
    setLoading(true);
    const { data } = await supabase.from('streets_live_streams').insert({
      user_id: user.id, title: title.trim(), status: 'live', viewer_count: 0,
    }).select().single();
    setLoading(false);
    if (data) router.push(`/streets/live/${data.id}`);
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>router.back()} style={styles.backBtn}><ArrowLeft size={22} color="#fff"/></TouchableOpacity>
        <Text style={styles.headerTitle}>Go Live</Text>
        <View style={{width:40}}/>
      </View>
      <View style={styles.body}>
        <Radio size={64} color="#ff2d55"/>
        <Text style={styles.title}>Start a Live Stream</Text>
        <Text style={styles.sub}>Connect with your audience in real-time</Text>
        <TextInput style={styles.input} placeholder="Stream title..." placeholderTextColor="#555" value={title} onChangeText={setTitle}/>
        <TouchableOpacity style={[styles.btn,(!title.trim()||loading)&&styles.btnDisabled]} onPress={goLive} disabled={!title.trim()||loading}>
          <Text style={styles.btnText}>{loading?'Starting...':'Go Live Now'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:'#000'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:Platform.OS==='ios'?50:16,paddingBottom:10,backgroundColor:'#000',borderBottomWidth:1,borderBottomColor:'#1a1a1a'},
  backBtn:{width:40,height:40,borderRadius:20,backgroundColor:'#1a1a1a',justifyContent:'center',alignItems:'center'},
  headerTitle:{color:'#fff',fontSize:17,fontWeight:'700'},
  body:{flex:1,justifyContent:'center',alignItems:'center',padding:24,gap:12},
  title:{color:'#fff',fontSize:22,fontWeight:'800'},
  sub:{color:'#888',fontSize:14,textAlign:'center'},
  input:{width:'100%',maxWidth:400,height:50,backgroundColor:'#1a1a1a',borderRadius:10,paddingHorizontal:16,color:'#fff',fontSize:15,marginTop:12},
  btn:{width:'100%',maxWidth:400,backgroundColor:'#ff2d55',borderRadius:10,paddingVertical:14,alignItems:'center',marginTop:16},
  btnDisabled:{opacity:0.5},
  btnText:{color:'#fff',fontSize:15,fontWeight:'700'},
});
