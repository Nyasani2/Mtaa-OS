// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function BusinessProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  
  const [profile, setProfile] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Edit states
  const [editName, setEditName] = useState('');
  const [editTagline, setEditTagline] = useState('');
  const [editStory, setEditStory] = useState('');

  useEffect(() => {
    loadBusinessData();
  }, [id]);

  const loadBusinessData = async () => {
    setLoading(true);
    try {
      // Fetch Profile
      const { data: profileData } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('id', id)
        .single();
        
      if (profileData) {
        setProfile(profileData);
        setEditName(profileData.business_name);
        setEditTagline(profileData.tagline || '');
        setEditStory(profileData.story_content || '');
        setIsOwner(user?.id === profileData.user_id);
      }

      // Fetch Items (Menu/Inventory)
      const { data: itemsData } = await supabase
        .from('business_items')
        .select('*')
        .eq('business_id', id)
        .eq('is_available', true)
        .order('sort_order', { ascending: true });
        
      setItems(itemsData || []);
    } catch (error) {
      console.error('Error loading business:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({ 
          business_name: editName, 
          tagline: editTagline, 
          story_content: editStory,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
        
      if (error) throw error;
      
      setProfile({ ...profile, business_name: editName, tagline: editTagline, story_content: editStory });
      setEditMode(false);
      Alert.alert('Success', 'Business profile updated!');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading Business Profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Business not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Group items by category
  const categories = [...new Set(items.map(item => item.category))];

  return (
    <ScrollView style={styles.container}>
      {/* Header / Hero */}
      <View style={styles.heroContainer}>
        <Image 
          source={{ uri: profile.hero_image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80' }} 
          style={styles.heroImage} 
        />
        <View style={styles.heroOverlay}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          {isOwner && (
            <TouchableOpacity style={styles.editToggle} onPress={() => setEditMode(!editMode)}>
              <Ionicons name={editMode ? "checkmark" : "pencil"} size={20} color="#fff" />
              <Text style={styles.editToggleText}>{editMode ? 'Save' : 'Edit'}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.heroContent}>
            {editMode ? (
              <TextInput 
                style={styles.editInputLarge} 
                value={editName} 
                onChangeText={setEditName} 
                placeholder="Business Name"
                placeholderTextColor="#cbd5e1"
              />
            ) : (
              <Text style={styles.businessName}>{profile.business_name}</Text>
            )}
            
            {editMode ? (
              <TextInput 
                style={styles.editInput} 
                value={editTagline} 
                onChangeText={setEditTagline} 
                placeholder="Tagline"
                placeholderTextColor="#cbd5e1"
              />
            ) : (
              <Text style={styles.tagline}>{profile.tagline || 'Welcome to our business'}</Text>
            )}
            
            <View style={styles.infoRow}>
              <Ionicons name="location" size={14} color="#fbbf24" />
              <Text style={styles.infoText}>{profile.address || 'Location not set'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Story Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{profile.story_title || 'Our Story'}</Text>
        {editMode ? (
          <TextInput 
            style={[styles.editInput, { minHeight: 100, textAlignVertical: 'top' }]} 
            value={editStory} 
            onChangeText={setEditStory} 
            multiline
            placeholder="Tell your story..."
            placeholderTextColor="#94a3b8"
          />
        ) : (
          <Text style={styles.storyText}>{profile.story_content || 'No story added yet.'}</Text>
        )}
      </View>

      {/* Menu / Items Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Our Offerings</Text>
        {categories.map(cat => (
          <View key={cat} style={styles.categoryBlock}>
            <Text style={styles.categoryTitle}>{cat}</Text>
            {items.filter(i => i.category === cat).map(item => (
              <View key={item.id} style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDesc} numberOfLines={2}>{item.description}</Text>
                  {item.price && <Text style={styles.itemPrice}>KES {item.price.toFixed(2)}</Text>}
                </View>
                {item.image_url && (
                  <Image source={{ uri: item.image_url }} style={styles.itemImage} />
                )}
              </View>
            ))}
          </View>
        ))}
        {items.length === 0 && (
          <Text style={styles.emptyText}>No items listed yet.</Text>
        )}
      </View>

      {/* Contact Section */}
      <View style={[styles.section, styles.contactSection]}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {profile.phone && (
          <TouchableOpacity style={styles.contactRow} onPress={() => {/* open phone */}}>
            <Ionicons name="call" size={20} color="#8b5cf6" />
            <Text style={styles.contactText}>{profile.phone}</Text>
          </TouchableOpacity>
        )}
        {profile.google_maps_url && (
          <TouchableOpacity style={styles.contactRow} onPress={() => {/* open maps */}}>
            <Ionicons name="map" size={20} color="#8b5cf6" />
            <Text style={styles.contactText}>Get Directions</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Save Button (Only in Edit Mode) */}
      {editMode && (
        <View style={styles.saveBar}>
          <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  loadingText: { color: '#fff', fontSize: 16 },
  errorText: { color: '#ef4444', fontSize: 16, marginBottom: 16 },
  backBtn: { backgroundColor: '#334155', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  backBtnText: { color: '#fff', fontWeight: '600' },
  heroContainer: { height: 320, position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', padding: 20, paddingBottom: 30 },
  backButton: { position: 'absolute', top: 50, left: 20, backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  editToggle: { position: 'absolute', top: 50, right: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: '#8b5cf6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 4 },
  editToggleText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  heroContent: { marginBottom: 10 },
  businessName: { fontSize: 32, fontWeight: '800', color: '#fff', marginBottom: 4 },
  tagline: { fontSize: 16, color: '#cbd5e1', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { color: '#fbbf24', fontSize: 14, fontWeight: '600', marginLeft: 4 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 16 },
  storyText: { fontSize: 15, color: '#cbd5e1', lineHeight: 24 },
  categoryBlock: { marginBottom: 24 },
  categoryTitle: { fontSize: 16, fontWeight: '600', color: '#8b5cf6', marginBottom: 12, textTransform: 'uppercase' },
  itemCard: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, marginBottom: 12 },
  itemInfo: { flex: 1, marginRight: 12 },
  itemName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  itemDesc: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
  itemPrice: { fontSize: 15, fontWeight: '700', color: '#8b5cf6' },
  itemImage: { width: 60, height: 60, borderRadius: 8 },
  emptyText: { color: '#64748b', fontSize: 14, textAlign: 'center', marginTop: 20 },
  contactSection: { backgroundColor: '#1e293b', margin: 20, borderRadius: 16 },
  contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  contactText: { color: '#fff', fontSize: 15 },
  saveBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#0f172a', padding: 20, borderTopWidth: 1, borderTopColor: '#334155' },
  saveButton: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  editInputLarge: { fontSize: 28, fontWeight: '800', color: '#fff', borderBottomWidth: 1, borderBottomColor: '#8b5cf6', marginBottom: 8, paddingBottom: 4 },
  editInput: { fontSize: 16, color: '#cbd5e1', borderBottomWidth: 1, borderBottomColor: '#334155', marginBottom: 12, paddingBottom: 4 },
});
