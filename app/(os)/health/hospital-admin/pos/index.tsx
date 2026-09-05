// @ts-nocheck
import React, { useState, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useHospitalPOS } from '@/lib/health/hooks/useHospitalPOS';
import { useHealthRole } from '@/lib/health/hooks/useHealthRole';
import { CreditCard, DollarSign, Wallet, Smartphone, Shield, Plus, Minus, Trash2, X, ChevronRight, ShoppingCart, User } from 'lucide-react-native';

const PAYMENT_METHODS = [
  { key: 'cash', label: 'Cash', icon: DollarSign, color: '#10B981' },
  { key: 'card', label: 'Card', icon: CreditCard, color: '#3B82F6' },
  { key: 'wallet', label: 'Wallet', icon: Wallet, color: '#8B5CF6' },
  { key: 'mpesa', label: 'M-Pesa', icon: Smartphone, color: '#00A650' },
  { key: 'insurance', label: 'Insurance', icon: Shield, color: '#F59E0B' },
];

export default function HospitalPOSScreen() {
  const router = useRouter();
  const { selectedFacilityId } = useHealthRole();
  const { session, cart, addToCart, removeFromCart, updateQuantity, checkout, loading } = useHospitalPOS(selectedFacilityId);
  const [patientId, setPatientId] = useState('');
  const [patientName, setPatientName] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', type: 'consultation', price: '' });

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;

  const handleAddItem = useCallback(() => {
    if (!newItem.name || !newItem.price) return;
    addToCart({ id: Date.now().toString(), name: newItem.name, type: newItem.type, price: parseFloat(newItem.price), quantity: 1 });
    setNewItem({ name: '', type: 'consultation', price: '' });
    setShowItemModal(false);
  }, [newItem, addToCart]);

  const handleCheckout = useCallback(async () => {
    if (!patientId.trim()) { Alert.alert('Error', 'Patient ID required'); return; }
    if (cart.length === 0) { Alert.alert('Error', 'Cart empty'); return; }
    const result = await checkout({ patient_id: patientId, patient_name: patientName, payment_method: selectedMethod, items: cart.map((i: any) => ({ type: i.type, name: i.name, qty: i.quantity, price: i.price, total: i.price * i.quantity })) });
    if (result.success) {
      Alert.alert('Payment Successful', `Invoice #${result.invoice_id?.slice(0,8)}\nTotal: $${total.toFixed(2)}`);
      setShowCheckout(false);
    } else { Alert.alert('Payment Failed', result.error || 'Unknown error'); }
  }, [patientId, patientName, selectedMethod, cart, total, checkout]);

  const renderCartItem = ({ item }: any) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{item.name}</Text>
        <Text style={styles.cartItemType}>{item.type} · ${item.price.toFixed(2)}</Text>
      </View>
      <View style={styles.cartItemActions}>
        <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}><Minus size={14} color="#6B7280" /></TouchableOpacity>
        <Text style={styles.qtyText}>{item.quantity}</Text>
        <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}><Plus size={14} color="#6B7280" /></TouchableOpacity>
        <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
        <TouchableOpacity onPress={() => removeFromCart(item.id)} style={styles.removeBtn}><Trash2 size={16} color="#EF4444" /></TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hospital POS</Text>
        <View style={styles.sessionBadge}><Text style={styles.sessionText}>Session: {session?.terminal_name || 'Main'}</Text></View>
      </View>
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Patient</Text>
          <View style={styles.inputRow}><User size={18} color="#6B7280" /><TextInput style={styles.input} placeholder="Patient ID / Scan QR" value={patientId} onChangeText={setPatientId} /></View>
          <TextInput style={styles.input} placeholder="Patient Name (optional)" value={patientName} onChangeText={setPatientName} />
        </View>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cart ({cart.length})</Text>
            <TouchableOpacity style={styles.addItemBtn} onPress={() => setShowItemModal(true)}><Plus size={16} color="#fff" /><Text style={styles.addItemText}>Add Item</Text></TouchableOpacity>
          </View>
          {cart.length === 0 ? <View style={styles.emptyCart}><ShoppingCart size={40} color="#D1D5DB" /><Text style={styles.emptyText}>Cart is empty</Text></View>
           : <FlatList data={cart} renderItem={renderCartItem} keyExtractor={i => i.id} scrollEnabled={false} />}
        </View>
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Subtotal</Text><Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text></View>
          <View style={styles.totalRow}><Text style={styles.totalLabel}>Tax (16%)</Text><Text style={styles.totalValue}>${tax.toFixed(2)}</Text></View>
          <View style={[styles.totalRow, styles.grandTotal]}><Text style={styles.grandLabel}>TOTAL</Text><Text style={styles.grandValue}>${total.toFixed(2)}</Text></View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <View style={styles.methodGrid}>
            {PAYMENT_METHODS.map((m: any) => { const Icon = m.icon; return (
              <TouchableOpacity key={m.key} style={[styles.methodCard, selectedMethod === m.key && { borderColor: m.color, backgroundColor: m.color + '10' }]} onPress={() => setSelectedMethod(m.key)}>
                <Icon size={22} color={selectedMethod === m.key ? m.color : '#9CA3AF'} />
                <Text style={[styles.methodLabel, selectedMethod === m.key && { color: m.color }]}>{m.label}</Text>
              </TouchableOpacity>
            ); })}
          </View>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.checkoutBtn} onPress={() => setShowCheckout(true)} disabled={cart.length === 0}>
        <Text style={styles.checkoutText}>Checkout ${total.toFixed(2)}</Text><ChevronRight size={20} color="#fff" />
      </TouchableOpacity>
      <Modal visible={showItemModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Add Item</Text><TouchableOpacity onPress={() => setShowItemModal(false)}><X size={24} color="#1F2937" /></TouchableOpacity></View>
            <Text style={styles.inputLabel}>Item Name</Text>
            <TextInput style={styles.modalInput} value={newItem.name} onChangeText={t => setNewItem({...newItem, name: t})} placeholder="e.g. Consultation Fee" />
            <Text style={styles.inputLabel}>Type</Text>
            <View style={styles.typeRow}>
              {['consultation','lab_test','medication','procedure','imaging','traditional_remedy'].map((t: any) => (
                <TouchableOpacity key={t} style={[styles.typeChip, newItem.type === t && styles.typeChipActive]} onPress={() => setNewItem({...newItem, type: t})}>
                  <Text style={[styles.typeChipText, newItem.type === t && styles.typeChipTextActive]}>{t.replace('_',' ')}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>Price ($)</Text>
            <TextInput style={styles.modalInput} value={newItem.price} onChangeText={t => setNewItem({...newItem, price: t})} keyboardType="decimal-pad" placeholder="0.00" />
            <TouchableOpacity style={styles.modalSubmit} onPress={handleAddItem}><Text style={styles.modalSubmitText}>Add to Cart</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal visible={showCheckout} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Payment</Text>
            <Text style={styles.confirmText}>Patient: {patientName || patientId}</Text>
            <Text style={styles.confirmText}>Method: {selectedMethod.toUpperCase()}</Text>
            <Text style={styles.confirmTotal}>${total.toFixed(2)}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCheckout(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCheckout} disabled={loading}><Text style={styles.confirmBtnText}>{loading ? 'Processing...' : 'Confirm Payment'}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#0A4DA6', paddingTop: 50 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  sessionBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  sessionText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  content: { flex: 1 },
  section: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, marginBottom: 8 },
  input: { flex: 1, paddingVertical: 10, fontSize: 15, color: '#1F2937' },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A4DA6', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  addItemText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  emptyCart: { alignItems: 'center', padding: 24 },
  emptyText: { color: '#9CA3AF', marginTop: 8 },
  cartItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  cartItemType: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  cartItemActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 14, fontWeight: '600', color: '#1F2937', width: 24, textAlign: 'center' },
  itemTotal: { fontSize: 14, fontWeight: '700', color: '#1F2937', width: 60, textAlign: 'right' },
  removeBtn: { padding: 4 },
  totalsCard: { backgroundColor: '#fff', margin: 12, padding: 16, borderRadius: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalLabel: { fontSize: 14, color: '#6B7280' },
  totalValue: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  grandTotal: { borderTopWidth: 1, borderTopColor: '#E5E7EB', marginTop: 8, paddingTop: 8 },
  grandLabel: { fontSize: 16, fontWeight: '700', color: '#1F2937' },
  grandValue: { fontSize: 18, fontWeight: '800', color: '#0A4DA6' },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  methodCard: { width: '30%', alignItems: 'center', padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  methodLabel: { fontSize: 11, fontWeight: '600', color: '#6B7280', marginTop: 6 },
  checkoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A4DA6', margin: 12, paddingVertical: 16, borderRadius: 12, gap: 8 },
  checkoutText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 6, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, color: '#1F2937' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#F3F4F6' },
  typeChipActive: { backgroundColor: '#0A4DA6' },
  typeChipText: { fontSize: 12, color: '#6B7280' },
  typeChipTextActive: { color: '#fff', fontWeight: '600' },
  modalSubmit: { backgroundColor: '#0A4DA6', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  modalSubmitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  confirmText: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  confirmTotal: { fontSize: 32, fontWeight: '800', color: '#0A4DA6', textAlign: 'center', marginVertical: 16 },
  confirmActions: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  cancelText: { color: '#6B7280', fontWeight: '600' },
  confirmBtn: { flex: 2, backgroundColor: '#0A4DA6', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700' },
});
