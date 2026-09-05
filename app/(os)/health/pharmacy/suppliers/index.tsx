
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, TextInput, Modal, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { usePharmacy } from '@/lib/health/hooks/usePharmacy';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { Truck, Plus, Search, X, Phone, Mail, MapPin, Package, Star, ChevronRight } from 'lucide-react-native';

const COLORS = {
  primary: '#0A4DA6', primaryLight: '#E8F0FE', success: '#10B981', warning: '#F59E0B',
  danger: '#EF4444', text: '#1F2937', textLight: '#6B7280', border: '#E5E7EB',
  background: '#F3F4F6', white: '#FFFFFF'
};

export default function PharmacySuppliersScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: '', contact_person: '', phone: '', email: '', address: '', license_number: '', rating: 3, notes: '' });
  const { suppliers, loading, error, refresh, addSupplier } = usePharmacy(selectedFacilityId);

  const onRefresh = useCallback(async () => { setRefreshing(true); await refresh(); setRefreshing(false); }, [refresh]);

  const filteredSuppliers = suppliers?.filter((s: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.contact_person?.toLowerCase().includes(q) || s.phone?.includes(q);
  });

  const handleAdd = useCallback(async () => {
    if (!newSupplier.name.trim() || !newSupplier.phone.trim()) {
      Alert.alert('Error', 'Name and phone are required'); return;
    }
    try {
      await addSupplier({ ...newSupplier, facility_id: selectedFacilityId });
      setShowAddModal(false);
      setNewSupplier({ name: '', contact_person: '', phone: '', email: '', address: '', license_number: '', rating: 3, notes: '' });
      Alert.alert('Success', 'Supplier added');
    } catch (err: any) { Alert.alert('Error', err.message || 'Failed to add supplier'); }
  }, [newSupplier, selectedFacilityId, addSupplier]);

  const handleCall = useCallback((phone: string) => {
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleEmail = useCallback((email: string) => {
    Linking.openURL(`mailto:${email}`);
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading suppliers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Plus size={20} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add Supplier</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Search size={18} color={COLORS.textLight} />
        <TextInput style={styles.searchInput} placeholder="Search suppliers..." value={searchQuery} onChangeText={setSearchQuery} placeholderTextColor={COLORS.textLight} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><X size={18} color={COLORS.textLight} /></TouchableOpacity>}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {filteredSuppliers?.length === 0 ? (
          <View style={styles.emptyState}><Truck size={48} color={COLORS.textLight} /><Text style={styles.emptyText}>{searchQuery ? 'No suppliers match' : 'No suppliers yet'}</Text></View>
        ) : (
          filteredSuppliers?.map((s: any) => (
            <View key={s.id} style={styles.supplierCard}>
              <View style={styles.supplierHeader}>
                <View style={styles.supplierInfo}>
                  <View style={[styles.avatar, { backgroundColor: COLORS.primaryLight }]}>
                    <Truck size={20} color={COLORS.primary} />
                  </View>
                  <View>
                    <Text style={styles.supplierName}>{s.name}</Text>
                    <Text style={styles.supplierContact}>{s.contact_person || 'No contact'}</Text>
                    <View style={styles.ratingRow}>
                      {[1,2,3,4,5].map((r) => (
                        <Star key={r} size={12} color={r <= (s.rating || 0) ? COLORS.warning : COLORS.border} fill={r <= (s.rating || 0) ? COLORS.warning : 'transparent'} />
                      ))}
                    </View>
                  </View>
                </View>
                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleCall(s.phone)}>
                    <Phone size={16} color={COLORS.success} />
                  </TouchableOpacity>
                  {s.email && (
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleEmail(s.email)}>
                      <Mail size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
              <View style={styles.supplierDetails}>
                {s.phone && <View style={styles.detailRow}><Phone size={14} color={COLORS.textLight} /><Text style={styles.detailText}>{s.phone}</Text></View>}
                {s.email && <View style={styles.detailRow}><Mail size={14} color={COLORS.textLight} /><Text style={styles.detailText}>{s.email}</Text></View>}
                {s.address && <View style={styles.detailRow}><MapPin size={14} color={COLORS.textLight} /><Text style={styles.detailText}>{s.address}</Text></View>}
                {s.license_number && <View style={styles.detailRow}><Package size={14} color={COLORS.textLight} /><Text style={styles.detailText}>License: {s.license_number}</Text></View>}
              </View>
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Supplier</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Company Name *</Text>
              <TextInput style={styles.input} placeholder="e.g. MedSupply Ltd" value={newSupplier.name} onChangeText={(t) => setNewSupplier({ ...newSupplier, name: t })} />
              <Text style={styles.inputLabel}>Contact Person</Text>
              <TextInput style={styles.input} placeholder="Full name" value={newSupplier.contact_person} onChangeText={(t) => setNewSupplier({ ...newSupplier, contact_person: t })} />
              <Text style={styles.inputLabel}>Phone *</Text>
              <TextInput style={styles.input} placeholder="+255..." value={newSupplier.phone} onChangeText={(t) => setNewSupplier({ ...newSupplier, phone: t })} keyboardType="phone-pad" />
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput style={styles.input} placeholder="supplier@company.com" value={newSupplier.email} onChangeText={(t) => setNewSupplier({ ...newSupplier, email: t })} keyboardType="email-address" autoCapitalize="none" />
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput style={styles.input} placeholder="Physical address" value={newSupplier.address} onChangeText={(t) => setNewSupplier({ ...newSupplier, address: t })} />
              <Text style={styles.inputLabel}>License Number</Text>
              <TextInput style={styles.input} placeholder="Supplier license" value={newSupplier.license_number} onChangeText={(t) => setNewSupplier({ ...newSupplier, license_number: t })} />
              <Text style={styles.inputLabel}>Rating (1-5)</Text>
              <View style={styles.ratingRow}>
                {[1,2,3,4,5].map((r) => (
                  <TouchableOpacity key={r} onPress={() => setNewSupplier({ ...newSupplier, rating: r })}>
                    <Star size={28} color={r <= newSupplier.rating ? COLORS.warning : COLORS.border} fill={r <= newSupplier.rating ? COLORS.warning : 'transparent'} />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.inputLabel}>Notes</Text>
              <TextInput style={[styles.input, styles.textArea]} placeholder="Additional notes..." value={newSupplier.notes} onChangeText={(t) => setNewSupplier({ ...newSupplier, notes: t })} multiline numberOfLines={3} />
              <TouchableOpacity style={styles.modalSubmit} onPress={handleAdd}>
                <Text style={styles.modalSubmitText}>Add Supplier</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: COLORS.textLight },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: COLORS.white, fontWeight: '600', marginLeft: 6 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, margin: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: COLORS.text },
  supplierCard: { backgroundColor: COLORS.white, marginHorizontal: 12, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  supplierHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  supplierInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  supplierName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  supplierContact: { fontSize: 12, color: COLORS.textLight, marginTop: 2 },
  ratingRow: { flexDirection: 'row', marginTop: 4, gap: 2 },
  actionRow: { flexDirection: 'row', gap: 8 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  supplierDetails: { marginLeft: 56 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  detailText: { marginLeft: 6, fontSize: 12, color: COLORS.textLight },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { marginTop: 12, color: COLORS.textLight, fontSize: 14 },
  bottomPadding: { height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  modalBody: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalSubmit: { backgroundColor: COLORS.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  modalSubmitText: { color: COLORS.white, fontWeight: '700', fontSize: 16 }
});
