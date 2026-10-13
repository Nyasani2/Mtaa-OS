// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Modal } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { FEATURE_REGISTRY, isFeatureAvailable } from '@/lib/config/feature-capabilities';

// TODO: Integrate real device detection (e.g., react-native-device-info or custom Kamo API)
const IS_KAMO_DEVICE = false; 

interface NavItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  category: 'home' | 'academics' | 'communication' | 'health' | 'admin';
  roles: string[]; 
}

const NAV_ITEMS: NavItem[] = [
  // Home
  { id: 'edu_feed', label: 'Education Feed', icon: 'newspaper', route: '/(education)/feed', category: 'home', roles: ['student', 'teacher', 'parent', 'admin'] },
  { id: 'health_dashboard', label: 'Health Dashboard', icon: 'heart', route: '/(os)/health/patient/dashboard', category: 'health', roles: ['patient', 'doctor', 'admin'] },
  
  // Academics
  { id: 'my_classes', label: 'My Classes', icon: 'school', route: '/(education)/classes', category: 'academics', roles: ['student', 'teacher'] },
  { id: 'assignments', label: 'Assignments', icon: 'document-text', route: '/(education)/assignments', category: 'academics', roles: ['student', 'teacher'] },
  { id: 'grades', label: 'Grades & Results', icon: 'bar-chart', route: '/(education)/results', category: 'academics', roles: ['student', 'parent', 'teacher'] },
  
  // Communication
  { id: 'messages', label: 'Messages', icon: 'chatbubbles', route: '/(education)/messages', category: 'communication', roles: ['student', 'teacher', 'parent'] },
  { id: 'announcements', label: 'Announcements', icon: 'megaphone', route: '/(education)/announcements', category: 'communication', roles: ['student', 'teacher', 'parent', 'admin'] },
  
  // Admin / School Life
  { id: 'attendance', label: 'Attendance', icon: 'calendar', route: '/(education)/attendance', category: 'admin', roles: ['teacher', 'admin'] },
  { id: 'qr_checkin', label: 'QR Check-in', icon: 'qr-code', route: '/(education)/qr-checkin', category: 'admin', roles: ['teacher', 'admin'] },
];

export default function AppSidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuthStore();
  const [showKamoModal, setShowKamoModal] = useState<{name: string, message: string} | null>(null);

  // Default to 'student' if no profile role is set yet
  const userRole = profile?.role || 'student';
  const isMobile = Dimensions.get('window').width < 768;

  const filteredItems = NAV_ITEMS.filter(item => 
    item.roles.includes(userRole)
  );

  const handlePress = (item: NavItem) => {
    const availability = isFeatureAvailable(item.id, IS_KAMO_DEVICE);
    
    if (!availability.available) {
      setShowKamoModal({ name: item.name, message: availability.message || 'Not available.' });
      return;
    }
    
    router.push(item.route as any);
    if (isMobile && onClose) onClose();
  };

  const SidebarContent = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>MTAA OS</Text>
        {isMobile && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {['home', 'academics', 'communication', 'admin'].map(category => {
          const categoryItems = filteredItems.filter(i => i.category === category);
          if (categoryItems.length === 0) return null;

          return (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{category.toUpperCase()}</Text>
              {categoryItems.map(item => {
                const isActive = pathname === item.route || pathname?.startsWith(item.route + '/');
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.item, isActive && styles.itemActive]}
                    onPress={() => handlePress(item)}
                  >
                    <Ionicons name={item.icon} size={20} color={isActive ? '#8b5cf6' : '#94a3b8'} />
                    <Text style={[styles.itemLabel, isActive && styles.itemLabelActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.item} onPress={() => router.push('/(os)/settings' as any)}>
          <Ionicons name="settings" size={20} color="#94a3b8" />
          <Text style={styles.itemLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isMobile) {
    return (
      <>
        <Modal visible={isOpen} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.mobileSidebar}>
              <SidebarContent />
            </View>
          </View>
        </Modal>
        {showKamoModal && (
          <Modal visible={!!showKamoModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.kamoModal}>
                <Ionicons name="hardware-chip-outline" size={48} color="#8b5cf6" />
                <Text style={styles.kamoTitle}>{showKamoModal.name}</Text>
                <Text style={styles.kamoMessage}>{showKamoModal.message}</Text>
                <TouchableOpacity style={styles.kamoBtn} onPress={() => setShowKamoModal(null)}>
                  <Text style={styles.kamoBtnText}>Understood</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}
      </>
    );
  }

  return <SidebarContent />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', borderRightWidth: 1, borderRightColor: '#1e293b' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  logoText: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 1 },
  closeBtn: { padding: 4 },
  scroll: { flex: 1, padding: 12 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '700', color: '#64748b', marginBottom: 8, marginLeft: 12, letterSpacing: 0.5 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8, marginBottom: 4 },
  itemActive: { backgroundColor: 'rgba(139, 92, 246, 0.1)' },
  itemLabel: { fontSize: 14, color: '#94a3b8', marginLeft: 12, fontWeight: '500' },
  itemLabelActive: { color: '#8b5cf6', fontWeight: '600' },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#1e293b' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  mobileSidebar: { width: '85%', height: '100%', backgroundColor: '#0f172a', borderTopRightRadius: 20, borderBottomRightRadius: 20 },
  kamoModal: { margin: 20, backgroundColor: '#1e293b', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  kamoTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8 },
  kamoMessage: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  kamoBtn: { backgroundColor: '#8b5cf6', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8, width: '100%', alignItems: 'center' },
  kamoBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
