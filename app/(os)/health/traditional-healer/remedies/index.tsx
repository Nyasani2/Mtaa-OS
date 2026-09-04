// @ts-nocheck
import React, { useState } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, useTraditionalHealer } from '@/lib/health/hooks/useTraditionalHealer';
import { Alert, Plus, X, Leaf, Edit3, Trash2, Package, DollarSign, AlertTriangle } from 'lucide-react-native';

export default function HealerRemediesScreen() {
  const router = useRouter();
  const { remedies, addRemedy, updateRemedy, deleteRemedy, loading } = useTraditionalHealer();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', local_name: '', scientific_name: '', description: '', ingredients: '', preparation_method: '', dosage_instructions: '', price: '', stock_quantity: '', conditions: '' });

  const openAdd = () => { setEditing(null); setForm({ name: '', local_name: '', scientific_name: '', description: '', ingredients: '', preparation_method: '', dosage_instructions: '', price: '', stock_quantity: '', conditions: '' }); setShowModal(true); };
  const openEdit = (item: any) => { setEditing(item); setForm({ name: item.name, local_name: item.local_name || '', scientific_name: item.scientific_name || '', description: item.description || '', ingredients: (item.ingredients || []).join(', '), preparation_method: item.preparation_method || '', dosage_instructions: item.dosage_instructions || '', price: String(item.price || ''), stock_quantity: String(item.stock_quantity || ''), conditions: (item.conditions_treated || []).join(', ') }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.name || !form.price) { Alert.alert('Error', 'Name and price required'); return; }
    const payload = { ...form, price: parseFloat(form.price), stock_quantity: parseFloat(form.stock_quantity || '0'), ingredients: form.ingredients.split(',').map((s: any) => s.trim()).filter(Boolean), conditions_treated: form.conditions.split(',').map((s: any) => s.trim()).filter(Boolean) };
    if (editing) { await updateRemedy(editing.id, payload); Alert.alert('Updated', 'Remedy updated'); }
    else { await addRemedy(payload); Alert.alert('Created', 'New remedy added'); }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Remedy', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteRemedy(id) }
    ]);
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={styles.iconBox}><Leaf size={20} color="#10B981" /></View>
          <View>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardSub}>{item.local_name} · {item.scientific_name}</Text>
          </View>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => openEdit(item)} style={styles.actionBtn}><Edit3 size={16} color="#3B82F6" /></TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.actionBtn}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
        </View>
      </View>
      <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}><DollarSign size={14} color="#0A4DA6" /><Text style={styles.footerText}>${item.price}</Text></View>
        <View style={styles.footerItem}><Package size={14} color={item.stock_quantity < 5 ? '#EF4444' : '#6B7280'} /><Text style={[styles.footerText, item.stock_quantity < 5 && { color: '#EF4444' }]}>{item.stock_quantity} in stock</Text></View>
        <View style={styles.footerItem}><AlertTriangle size={14} color={item.is_approved_by_regulator ? '#10B981' : '#F59E0B'} /><Text style={[styles.footerText, { color: item.is_approved_by_regulator ? '#10B981' : '#F59E0B' }]}>{item.is_approved_by_regulator ? 'Approved' : 'Pending'}</Text></View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Remedies</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}><Plus size={20} color="#fff" /></TouchableOpacity>
      </View>
      <FlatList data={remedies} renderItem={renderItem} keyExtractor={i => i.id} contentContainerStyle={styles.list} ListEmptyComponent={<View style={styles.empty}><Leaf size={48} color="#D1D5DB" /><Text style={styles.emptyText}>No remedies yet</Text></View>} />
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalInner}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{editing ? 'Edit Remedy' : 'New Remedy'}</Text><TouchableOpacity onPress={() => setShowModal(false)}><X size={24} color="#1F2937" /></TouchableOpacity></View>
            <Text style={styles.label}>Name *</Text><TextInput style={styles.input} value={form.name} onChangeText={t => setForm({...form, name: t})} placeholder="e.g. Malaria Herbal Mix" />
            <Text style={styles.label}>Local Name</Text><TextInput style={styles.input} value={form.local_name} onChangeText={t => setForm({...form, local_name: t})} placeholder="Local language name" />
            <Text style={styles.label}>Scientific Name</Text><TextInput style={styles.input} value={form.scientific_name} onChangeText={t => setForm({...form, scientific_name: t})} placeholder="Scientific name" />
            <Text style={styles.label}>Description</Text><TextInput style={[styles.input, styles.textArea]} value={form.description} onChangeText={t => setForm({...form, description: t})} placeholder="Describe the remedy..." multiline numberOfLines={3} />
            <Text style={styles.label}>Ingredients (comma separated)</Text><TextInput style={styles.input} value={form.ingredients} onChangeText={t => setForm({...form, ingredients: t})} placeholder="Neem leaves, ginger, honey..." />
            <Text style={styles.label}>Preparation Method</Text><TextInput style={[styles.input, styles.textArea]} value={form.preparation_method} onChangeText={t => setForm({...form, preparation_method: t})} placeholder="How to prepare..." multiline numberOfLines={3} />
            <Text style={styles.label}>Dosage Instructions</Text><TextInput style={styles.input} value={form.dosage_instructions} onChangeText={t => setForm({...form, dosage_instructions: t})} placeholder="e.g. 2 teaspoons twice daily" />
            <Text style={styles.label}>Price ($) *</Text><TextInput style={styles.input} value={form.price} onChangeText={t => setForm({...form, price: t})} keyboardType="decimal-pad" placeholder="0.00" />
            <Text style={styles.label}>Stock Quantity</Text><TextInput style={styles.input} value={form.stock_quantity} onChangeText={t => setForm({...form, stock_quantity: t})} keyboardType="number-pad" placeholder="0" />
            <Text style={styles.label}>Conditions Treated (comma separated)</Text><TextInput style={styles.input} value={form.conditions} onChangeText={t => setForm({...form, conditions: t})} placeholder="Malaria, cough, fever..." />
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={loading}><Text style={styles.saveText}>{loading ? 'Saving...' : (editing ? 'Update Remedy' : 'Create Remedy')}</Text></TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#059669', paddingTop: 50 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937' },
  cardSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },
  cardDesc: { fontSize: 13, color: '#6B7280', marginTop: 8, lineHeight: 18 },
  cardFooter: { flexDirection: 'row', marginTop: 12, gap: 16 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  empty: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#9CA3AF', marginTop: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: 40, flex: 1 },
  modalInner: { padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  label: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#1F2937' },
  textArea: { height: 80, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: '#059669', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
