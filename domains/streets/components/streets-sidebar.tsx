import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Home, Compass, Radio, Bell, User, PlusSquare, Bookmark, Settings } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const NAV_ITEMS = [
  { icon: Home, label: 'For You', path: '/streets' },
  { icon: Compass, label: 'Explore', path: '/streets/explore' },
  { icon: Radio, label: 'LIVE', path: '/streets/live' },
  { icon: Bell, label: 'Notifications', path: '/streets/notifications' },
  { icon: Bookmark, label: 'Saved', path: '/streets/saved' },
  { icon: User, label: 'Profile', path: '/streets/user/me' },
];

export default function StreetsSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuthStore();
  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.sidebar}>
      <Text style={styles.logo}>▶ Streets</Text>
      <TouchableOpacity style={styles.createBtn} onPress={()=>router.push('/streets/create')}>
        <PlusSquare size={18} color="#fff"/><Text style={styles.createBtnText}>Create Post</Text>
      </TouchableOpacity>
      <View style={styles.nav}>
        {NAV_ITEMS.map(item => {
          const isActive = pathname === item.path || pathname?.startsWith(item.path+'/');
          const Icon = item.icon;
          return (
            <TouchableOpacity key={item.path} style={[styles.navItem,isActive&&styles.navItemActive]} onPress={()=>router.push(item.path as any)}>
              <Icon size={22} color={isActive?'#ff2d55':'#fff'}/>
              <Text style={[styles.navLabel,isActive&&styles.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerItem} onPress={()=>router.push('/settings')}>
          <Settings size={18} color="#888"/><Text style={styles.footerLabel}>Settings</Text>
        </TouchableOpacity>
        <Text style={styles.copy}>© 2026 MTAA</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar:{width:220,height:'100vh',backgroundColor:'#000',borderRightWidth:1,borderRightColor:'#222',paddingVertical:20,paddingHorizontal:12,justifyContent:'space-between',position:'sticky',top:0,left:0},
  logo:{color:'#fff',fontSize:22,fontWeight:'800',paddingHorizontal:8,marginBottom:20},
  createBtn:{flexDirection:'row',alignItems:'center',justifyContent:'center',backgroundColor:'#ff2d55',borderRadius:8,paddingVertical:12,marginHorizontal:8,marginBottom:16,gap:8},
  createBtnText:{color:'#fff',fontSize:14,fontWeight:'700'},
  nav:{flex:1,gap:4},
  navItem:{flexDirection:'row',alignItems:'center',gap:14,paddingVertical:10,paddingHorizontal:12,borderRadius:8},
  navItemActive:{backgroundColor:'rgba(255,45,85,0.12)'},
  navLabel:{color:'#fff',fontSize:15,fontWeight:'600'},
  navLabelActive:{color:'#ff2d55',fontWeight:'700'},
  footer:{borderTopWidth:1,borderTopColor:'#222',paddingTop:12,gap:8},
  footerItem:{flexDirection:'row',alignItems:'center',gap:12,paddingHorizontal:12,paddingVertical:6},
  footerLabel:{color:'#888',fontSize:13},
  copy:{color:'#444',fontSize:11,paddingHorizontal:12,marginTop:4},
});
