import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Search, MapPin, Stethoscope, Pill, Building2, Phone,
  Star, Navigation, Filter, ChevronRight, Clock, Heart
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

interface Facility {
  id: string;
  name: string;
  type: string;
  address: string;
  phone: string;
  distance?: string;
  rating?: number;
  is_open: boolean;
  specialties?: string[];
}

export default function FindCareScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'hospital' | 'clinic' | 'pharmacy' | 'specialist'>('all');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(false);

  const categories = [
    { key: 'all', label: 'All', icon: Building2 },
    { key: 'hospital', label: 'Hospitals', icon: Building2 },
    { key: 'clinic', label: 'Clinics', icon: Stethoscope },
    { key: 'pharmacy', label: 'Pharmacy', icon: Pill },
    { key: 'specialist', label: 'Specialist', icon: Heart },
  ];

  useEffect(() => {
    loadFacilities();
  }, [activeCategory]);

  const loadFacilities = async () => {
    setLoading(true);
    try {
      let query = supabase.from('facilities').select('*').eq('is_active', true);
      if (activeCategory !== 'all') {
        query = query.eq('type', activeCategory);
      }
      const { data, error } = await query.limit(20);
      if (error) throw error;

      const mockData: Facility[] = data?.length ? data.map((f: any) => ({
        id: f.id, name: f.name, type: f.type, address: f.address,
        phone: f.phone, is_open: true, rating: 4.5, distance: '2.3 km',
        specialties: ['General Medicine', 'Pediatrics']
      })) : [
        { id: '1', name: 'Nairobi West Hospital', type: 'hospital', address: 'Gandhi Avenue, Nairobi', phone: '+254 20 600 0000', is_open: true, rating: 4.5, distance: '2.3 km', specialties: ['Emergency', 'Surgery', 'Maternity'] },
        { id: '2', name: 'Aga Khan University Hospital', type: 'hospital', address: '3rd Parklands Avenue, Nairobi', phone: '+254 20 366 2000', is_open: true, rating: 4.8, distance: '5.1 km', specialties: ['Cardiology', 'Oncology', 'Neurology'] },
        { id: '3', name: 'Kenyatta National Hospital', type: 'hospital', address: 'Hospital Road, Nairobi', phone: '+254 20 272 6300', is_open: true, rating: 4.2, distance: '3.7 km', specialties: ['Trauma', 'Burns', 'ICU'] },
        { id: '4', name: 'MediHealth Clinic', type: 'clinic', address: 'Moi Avenue, Nairobi', phone: '+254 712 345 678', is_open: true, rating: 4.0, distance: '0.8 km', specialties: ['General Practice', 'Vaccinations'] },
        { id: '5', name: 'Haltons Pharmacy', type: 'pharmacy', address: 'Kimathi Street, Nairobi', phone: '+254 723 456 789', is_open: true, rating: 4.3, distance: '1.2 km', specialties: ['Prescriptions', 'OTC'] },
        { id: '6', name: 'Dr. Wanjiku Cardiology', type: 'specialist', address: 'Upper Hill, Nairobi', phone: '+254 734 567 890', is_open: false, rating: 4.7, distance: '4.5 km', specialties: ['Cardiology', 'Hypertension'] },
      ];

      setFacilities(mockData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredFacilities = facilities.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.specialties?.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'hospital': return Building2;
      case 'clinic': return Stethoscope;
      case 'pharmacy': return Pill;
      case 'specialist': return Heart;
      default: return Building2;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hospital': return '#F44336';
      case 'clinic': return '#4CAF50';
      case 'pharmacy': return '#FF9800';
      case 'specialist': return '#9C27B0';
      default: return '#607D8B';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Find Care</Text>
          <Text style={styles.subtitle}>Hospitals, clinics & pharmacies near you</Text>
        </View>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, specialty, or location..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity>
          <Filter size={18} color="#999" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        <View style={styles.categoryRow}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.key}
              style={[styles.categoryChip, activeCategory === cat.key && styles.categoryChipActive]}
              onPress={() => setActiveCategory(cat.key as any)}
            >
              <cat.icon size={16} color={activeCategory === cat.key ? '#fff' : '#666'} />
              <Text style={[styles.categoryText, activeCategory === cat.key && styles.categoryTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.primary} />
        ) : filteredFacilities.length === 0 ? (
          <View style={styles.emptyState}>
            <MapPin size={40} color="#ccc" />
            <Text style={styles.emptyText}>No facilities found</Text>
          </View>
        ) : (
          filteredFacilities.map(facility => {
            const Icon = getTypeIcon(facility.type);
            const color = getTypeColor(facility.type);

            return (
              <TouchableOpacity
                key={facility.id}
                style={styles.facilityCard}
                onPress={() => router.push({
                  pathname: '/(os)/health/find-care/detail',
                  params: { id: facility.id }
                } as any)}
              >
                <View style={styles.facilityHeader}>
                  <View style={[styles.facilityIcon, { backgroundColor: color + '15' }]}>
                    <Icon size={20} color={color} />
                  </View>
                  <View style={styles.facilityInfo}>
                    <Text style={styles.facilityName}>{facility.name}</Text>
                    <View style={styles.facilityMeta}>
                      <Text style={[styles.typeBadge, { color, backgroundColor: color + '15' }]}>
                        {facility.type}
                      </Text>
                      {facility.rating && (
                        <View style={styles.ratingRow}>
                          <Star size={12} color="#FFB300" fill="#FFB300" />
                          <Text style={styles.ratingText}>{facility.rating}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <ChevronRight size={18} color="#ccc" />
                </View>

                <View style={styles.facilityDetails}>
                  <View style={styles.detailRow}>
                    <MapPin size={13} color="#666" />
                    <Text style={styles.detailText} numberOfLines={1}>{facility.address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Phone size={13} color="#666" />
                    <Text style={styles.detailText}>{facility.phone}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Navigation size={13} color="#666" />
                    <Text style={styles.detailText}>{facility.distance}</Text>
                    <View style={[styles.openBadge, { backgroundColor: facility.is_open ? '#E8F5E9' : '#FFEBEE' }]}>
                      <Text style={[styles.openText, { color: facility.is_open ? '#4CAF50' : '#F44336' }]}>
                        {facility.is_open ? 'Open' : 'Closed'}
                      </Text>
                    </View>
                  </View>
                </View>

                {facility.specialties && (
                  <View style={styles.specialtiesRow}>
                    {facility.specialties.map((spec, i) => (
                      <View key={i} style={styles.specialtyChip}>
                        <Text style={styles.specialtyText}>{spec}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push({
                      pathname: '/(os)/health/appointments/book',
                      params: { facilityId: facility.id }
                    } as any)}
                  >
                    <Clock size={14} color={Colors.primary} />
                    <Text style={styles.actionText}>Book</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Phone size={14} color={Colors.primary} />
                    <Text style={styles.actionText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionBtn}>
                    <Navigation size={14} color={Colors.primary} />
                    <Text style={styles.actionText}>Directions</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1a1a1a' },
  subtitle: { fontSize: 13, color: '#666', marginTop: 2 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 12, gap: 8
  },
  searchInput: { flex: 1, fontSize: 14, color: '#1a1a1a' },
  categoryScroll: { maxHeight: 50, marginBottom: 12 },
  categoryRow: { flexDirection: 'row', paddingHorizontal: 12, gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, backgroundColor: '#E8E8E8'
  },
  categoryChipActive: { backgroundColor: Colors.primary },
  categoryText: { fontSize: 12, color: '#666', fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  facilityCard: {
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12,
    borderRadius: 16, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1
  },
  facilityHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 10
  },
  facilityIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12
  },
  facilityInfo: { flex: 1 },
  facilityName: { fontSize: 15, fontWeight: '600', color: '#1a1a1a' },
  facilityMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typeBadge: {
    fontSize: 10, fontWeight: '600',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4,
    textTransform: 'capitalize'
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 11, color: '#666', marginLeft: 2 },
  facilityDetails: { gap: 6, marginBottom: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 12, color: '#555', flex: 1 },
  openBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  openText: { fontSize: 10, fontWeight: '600' },
  specialtiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  specialtyChip: {
    backgroundColor: '#f0f0f0', paddingHorizontal: 8,
    paddingVertical: 3, borderRadius: 4
  },
  specialtyText: { fontSize: 10, color: '#666' },
  cardActions: {
    flexDirection: 'row', borderTopWidth: 1,
    borderTopColor: '#f0f0f0', paddingTop: 10, gap: 12
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, color: Colors.primary, fontWeight: '500' },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 14, color: '#999', marginTop: 12 },
  bottomPadding: { height: 32 }
});
