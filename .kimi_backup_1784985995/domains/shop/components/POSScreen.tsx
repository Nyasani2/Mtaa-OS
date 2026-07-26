// domains/shop/components/POSScreen.tsx
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface Props {
  shopId: string;
}

export default function POSScreen({ shopId }: Props) {
  const [sessionActive, setSessionActive] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const startSession = () => setSessionActive(true);
  const endSession = () => { setSessionActive(false); setCart([]); };

  const lookupProduct = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('barcode', code.trim())
      .single();
    setLoading(false);
    if (error || !data) {
      Alert.alert('Not found', 'Product not found for this barcode');
      return;
    }
    const existing = cart.find((c) => c.id === data.id);
    if (existing) {
      setCart(cart.map((c) => c.id === data.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { id: data.id, name: data.name, price: data.price, qty: 1 }]);
    }
    setBarcode('');
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const checkout = () => {
    Alert.alert('Checkout', `Total: KES ${total.toLocaleString()}`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Confirm', onPress: () => { setCart([]); Alert.alert('Success', 'Sale recorded'); } },
    ]);
  };

  if (!sessionActive) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>POS Session</Text>
        <TouchableOpacity style={styles.bigBtn} onPress={startSession}>
          <Text style={styles.bigBtnText}>Start Session</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>POS — {shopId}</Text>
        <TouchableOpacity onPress={endSession}><Text style={styles.end}>End</Text></TouchableOpacity>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Scan barcode..."
        placeholderTextColor="#888"
        value={barcode}
        onChangeText={setBarcode}
        onSubmitEditing={() => lookupProduct(barcode)}
        autoFocus
      />
      {loading && <Text style={styles.loading}>Scanning...</Text>}
      <FlatList
        data={cart}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQty}>x{item.qty}</Text>
            <Text style={styles.itemPrice}>KES {(item.price * item.qty).toLocaleString()}</Text>
          </View>
        )}
      />
      <View style={styles.footer}>
        <Text style={styles.total}>Total: KES {total.toLocaleString()}</Text>
        <TouchableOpacity style={styles.checkoutBtn} onPress={checkout}>
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 24 },
  bigBtn: { backgroundColor: '#10B981', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12 },
  bigBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  header: { color: '#fff', fontSize: 20, fontWeight: '700' },
  end: { color: '#EF4444', fontSize: 16 },
  input: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 12, color: '#fff', marginBottom: 8 },
  loading: { color: '#888', marginBottom: 8 },
  item: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  itemName: { color: '#fff', flex: 1, fontSize: 16 },
  itemQty: { color: '#888', width: 40, textAlign: 'center' },
  itemPrice: { color: '#10B981', width: 100, textAlign: 'right' },
  footer: { borderTopWidth: 1, borderTopColor: '#1f1f1f', paddingTop: 16, marginTop: 8 },
  total: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 12 },
  checkoutBtn: { backgroundColor: '#10B981', borderRadius: 12, padding: 16, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 18, fontWeight: '700' },
});
