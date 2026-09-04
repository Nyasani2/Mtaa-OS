import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useLocation } from '@/lib/transport/hooks/useLocation';

export interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const HARDCODED_PLACES: Place[] = [
  { id: '1', name: 'Nairobi CBD', address: 'City Centre, Nairobi', lat: -1.2921, lng: 36.8219 },
  { id: '2', name: 'Westlands', address: 'Westlands, Nairobi', lat: -1.2679, lng: 36.8089 },
  { id: '3', name: 'JKIA Airport', address: 'Jomo Kenyatta International Airport', lat: -1.3192, lng: 36.9278 },
  { id: '4', name: 'Kilimani', address: 'Kilimani, Nairobi', lat: -1.2924, lng: 36.7909 },
  { id: '5', name: 'Lavington', address: 'Lavington, Nairobi', lat: -1.2778, lng: 36.7669 },
  { id: '6', name: 'Karen', address: 'Karen, Nairobi', lat: -1.3196, lng: 36.71 },
  { id: '7', name: 'Eastleigh', address: 'Eastleigh, Nairobi', lat: -1.2714, lng: 36.8463 },
  { id: '8', name: 'Kasarani', address: 'Kasarani, Nairobi', lat: -1.2214, lng: 36.9 },
  { id: '9', name: 'Kitengela', address: 'Kitengela, Kajiado', lat: -1.4768, lng: 36.96 },
  { id: '10', name: 'Ngong', address: 'Ngong, Kajiado', lat: -1.3621, lng: 36.6565 },
  { id: '11', name: 'Rongai', address: 'Ongata Rongai, Kajiado', lat: -1.3933, lng: 36.7383 },
  { id: '12', name: 'Thika', address: 'Thika, Kiambu', lat: -1.0333, lng: 37.0667 },
  { id: '13', name: 'Ruaka', address: 'Ruaka, Kiambu', lat: -1.2056, lng: 36.7822 },
  { id: '14', name: 'Kiambu', address: 'Kiambu Town', lat: -1.1713, lng: 36.8358 },
  { id: '15', name: 'Machakos', address: 'Machakos Town', lat: -1.5177, lng: 37.2634 },
  { id: '16', name: 'Mombasa Road', address: 'Mombasa Road, Nairobi', lat: -1.3234, lng: 36.85 },
  { id: '17', name: 'Upper Hill', address: 'Upper Hill, Nairobi', lat: -1.2966, lng: 36.8148 },
  { id: '18', name: 'Gigiri', address: 'Gigiri, Nairobi', lat: -1.2292, lng: 36.81 },
  { id: '19', name: 'Parklands', address: 'Parklands, Nairobi', lat: -1.2614, lng: 36.8167 },
  { id: '20', name: 'Embakasi', address: 'Embakasi, Nairobi', lat: -1.3238, lng: 36.9 },
  { id: '21', name: 'Industrial Area', address: 'Industrial Area, Nairobi', lat: -1.31, lng: 36.86 },
  { id: '22', name: 'Kileleshwa', address: 'Kileleshwa, Nairobi', lat: -1.2789, lng: 36.7856 },
  { id: '23', name: 'Riverside', address: 'Riverside, Nairobi', lat: -1.2689, lng: 36.8056 },
  { id: '24', name: 'Yaya Centre', address: 'Yaya Centre, Kilimani', lat: -1.2897, lng: 36.7873 },
  { id: '25', name: 'Sarit Centre', address: 'Sarit Centre, Westlands', lat: -1.2614, lng: 36.8028 },
  { id: '26', name: 'Two Rivers', address: 'Two Rivers, Kiambu Road', lat: -1.2106, lng: 36.8033 },
  { id: '27', name: 'Garden City', address: 'Garden City, Thika Road', lat: -1.2333, lng: 36.8833 },
  { id: '28', name: 'The Hub Karen', address: 'The Hub, Karen', lat: -1.3196, lng: 36.71 },
  { id: '29', name: 'Village Market', address: 'Village Market, Gigiri', lat: -1.2292, lng: 36.81 },
  { id: '30', name: 'Galleria Mall', address: 'Galleria, Karen', lat: -1.3196, lng: 36.71 },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: Place) => void;
  title?: string;
  mode?: 'pickup' | 'destination';
}

export default function RoutePicker({ visible, onClose, onSelect, title = 'Where to?', mode = 'destination' }: Props) {
  const [query, setQuery] = useState('');
  const { position, getCurrentPosition, isLoading: locLoading, error: locError } = useLocation();
  const [currentLocPlace, setCurrentLocPlace] = useState<Place | null>(null);

  // When modal opens, try to get current position silently
  useEffect(() => {
    if (visible && mode === 'pickup') {
      getCurrentPosition().then(pos => {
        if (pos) {
          setCurrentLocPlace({
            id: 'current',
            name: 'Current Location',
            address: `${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`,
            lat: pos.latitude,
            lng: pos.longitude,
          });
        }
      });
    }
  }, [visible, mode]);

  const filtered = useMemo(() => {
    if (!query.trim()) return HARDCODED_PLACES;
    const q = query.toLowerCase();
    return HARDCODED_PLACES.filter((p: any) =>
      p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q)
    );
  }, [query]);

  const handleUseCurrentLocation = async () => {
    const pos = await getCurrentPosition();
    if (pos) {
      onSelect({
        id: 'current',
        name: 'Current Location',
        address: `${pos.latitude.toFixed(4)}, ${pos.longitude.toFixed(4)}`,
        lat: pos.latitude,
        lng: pos.longitude,
      });
      onClose();
    }
  };

  const renderItem = ({ item }: { item: Place }) => (
    <TouchableOpacity
      style={styles.placeRow}
      onPress={() => { onSelect(item); setQuery(''); onClose(); }}
    >
      <View style={styles.placeIcon}>
        <FontAwesome5 name="map-marker-alt" size={16} color="#3B82F6" />
      </View>
      <View style={styles.placeInfo}>
        <Text style={styles.placeName}>{item.name}</Text>
        <Text style={styles.placeAddress}>{item.address}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.searchWrap}>
          <View style={[styles.dot, mode === 'pickup' ? styles.dotGreen : styles.dotRed]} />
          <TextInput
            style={styles.input}
            placeholder={mode === 'pickup' ? 'Enter pickup location' : 'Enter destination'}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Current Location — actually works now */}
        <TouchableOpacity style={styles.currentLoc} onPress={handleUseCurrentLocation} disabled={locLoading}>
          {locLoading ? (
            <ActivityIndicator size="small" color="#3B82F6" style={{ marginRight: 10 }} />
          ) : (
            <Ionicons name="locate" size={18} color="#3B82F6" style={{ marginRight: 10 }} />
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.currentLocText}>Use Current Location</Text>
            {position && (
              <Text style={styles.currentLocSub}>
                {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)}
                {position.accuracy ? ` (±${Math.round(position.accuracy)}m)` : ''}
              </Text>
            )}
            {locError && <Text style={styles.locError}>{locError}</Text>}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>SUGGESTIONS</Text>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No places found for "{query}"</Text>
              <Text style={styles.emptySub}>Try a different search term</Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10 },
  closeBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  searchWrap: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, height: 48 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  dotRed: { backgroundColor: '#EF4444' },
  dotGreen: { backgroundColor: '#10B981' },
  input: { flex: 1, fontSize: 16, color: '#111827' },
  currentLoc: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  currentLocText: { fontSize: 15, color: '#111827', fontWeight: '600' },
  currentLocSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  locError: { fontSize: 12, color: '#EF4444', marginTop: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  placeRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  placeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#DBEAFE', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  placeInfo: { flex: 1 },
  placeName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  placeAddress: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 15, color: '#6B7280' },
  emptySub: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});
