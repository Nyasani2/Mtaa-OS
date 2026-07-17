import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function QRActionScreen() {
  const router = useRouter();
  const { data } = useLocalSearchParams<{ data: string }>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>QR Data</Text>
        <View style={{width:40}} />
      </View>
      <View style={styles.content}>
        <Ionicons name="qr-code-outline" size={64} color="#22C55E" />
        <Text style={styles.label}>Scanned Data:</Text>
        <Text style={styles.dataText}>{data}</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={() => Clipboard.setString(qrData)}>
          <Text style={styles.copyBtnText}>Copy to Clipboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1,backgroundColor:'#0A0A0F'},
  header:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:16,paddingTop:12,paddingBottom:8},
  backBtn:{padding:4}, headerTitle:{fontSize:20,fontWeight:'700',color:'#fff'},
  content:{flex:1,justifyContent:'center',alignItems:'center',padding:24},
  label:{fontSize:14,color:'#8E8E93',marginTop:24},
  dataText:{fontSize:16,color:'#fff',marginTop:8,textAlign:'center',fontFamily:'monospace'},
  copyBtn:{marginTop:24,backgroundColor:'#22C55E',paddingHorizontal:24,paddingVertical:14,borderRadius:12},
  copyBtnText:{fontSize:15,fontWeight:'700',color:'#fff'},
});
